import type {
  BudgetInputData,
  CreateBudgetEnvelope,
  UpdateBudgetEnvelope
} from '@mjm/shared';
import {
  webPlatformBudgetInputSchema,
  websiteBudgetInputSchema
} from '@mjm/shared';
import { BudgetStatus, Prisma, type ApplicationType } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';
import { prisma } from '../../shared/prisma/client.js';
import { lockProjectForUpdate } from '../../shared/prisma/locks.js';
import { getActivePricing } from '../pricing/pricing.service.js';
import type { PricingResult } from '../pricing/pricing.types.js';
import { calculateWebPlatformBudget } from '../pricing/web-platform-pricing.js';
import { calculateWebsiteBudget } from '../pricing/website-pricing.js';

const budgetInclude = {
  items: { orderBy: { displayOrder: 'asc' as const } },
  project: { select: { id: true, name: true, applicationType: true } },
  createdBy: { select: { id: true, name: true, email: true } }
} as const;

function serializeBudget<T extends {
  subtotal: Prisma.Decimal;
  complexityMultiplier: Prisma.Decimal;
  urgencyMultiplier: Prisma.Decimal;
  discountPercentage: Prisma.Decimal;
  finalTotal: Prisma.Decimal;
  monthlyRecurringTotal: Prisma.Decimal;
  items?: Array<{ unitPrice: Prisma.Decimal; totalPrice: Prisma.Decimal }>;
}>(budget: T) {
  return {
    ...budget,
    subtotal: budget.subtotal.toFixed(2),
    complexityMultiplier: budget.complexityMultiplier.toFixed(4),
    urgencyMultiplier: budget.urgencyMultiplier.toFixed(4),
    discountPercentage: budget.discountPercentage.toFixed(2),
    finalTotal: budget.finalTotal.toFixed(2),
    monthlyRecurringTotal: budget.monthlyRecurringTotal.toFixed(2),
    ...(budget.items === undefined ? {} : {
      items: budget.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toFixed(2),
        totalPrice: item.totalPrice.toFixed(2)
      }))
    })
  };
}

async function calculate(
  applicationType: ApplicationType,
  rawInput: unknown
): Promise<{ inputData: BudgetInputData; result: PricingResult }> {
  if (applicationType === 'WEBSITE') {
    const inputData = websiteBudgetInputSchema.parse(rawInput);
    return {
      inputData,
      result: calculateWebsiteBudget(inputData, await getActivePricing(applicationType))
    };
  }

  if (applicationType === 'PLATAFORMA_WEB') {
    const inputData = webPlatformBudgetInputSchema.parse(rawInput);
    return {
      inputData,
      result: calculateWebPlatformBudget(inputData, await getActivePricing(applicationType))
    };
  }

  throw new AppError(
    422,
    'PRICING_NOT_SUPPORTED',
    'Este tipo de projeto ainda nao possui precificacao automatica'
  );
}

function calculationData(input: BudgetInputData, result: PricingResult) {
  return {
    inputData: input as Prisma.InputJsonValue,
    subtotal: result.subtotal.toFixed(2),
    complexityMultiplier: result.complexityMultiplier.toString(),
    urgencyMultiplier: result.urgencyMultiplier.toString(),
    discountPercentage: result.discountPercentage.toFixed(2),
    finalTotal: result.finalTotal.toFixed(2),
    monthlyRecurringTotal: result.monthlyRecurringTotal.toFixed(2)
  };
}

function calculationItems(result: PricingResult) {
  return result.items.map((item) => ({
    code: item.code,
    name: item.name,
    ...(item.description === undefined ? {} : { description: item.description }),
    category: item.category,
    quantity: item.quantity,
    unitPrice: item.unitPrice.toFixed(2),
    totalPrice: item.totalPrice.toFixed(2),
    recurring: item.recurring,
    displayOrder: item.displayOrder,
    ...(item.metadata === undefined ? {} : { metadata: item.metadata })
  }));
}

function budgetNotEditable(): AppError {
  return new AppError(
    409,
    'BUDGET_NOT_EDITABLE',
    'Apenas orcamentos em rascunho podem ser alterados'
  );
}

function nullableNotes(notes: string): string | null {
  return notes === '' ? null : notes;
}

async function requireProject(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (project === null) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Projeto nao encontrado');
  return project;
}

export async function listBudgets(projectId: string) {
  await requireProject(projectId);
  const budgets = await prisma.budget.findMany({
    where: { projectId },
    include: budgetInclude,
    orderBy: { versionNumber: 'desc' }
  });
  return budgets.map(serializeBudget);
}

export async function getBudget(id: string) {
  const budget = await prisma.budget.findUnique({ where: { id }, include: budgetInclude });
  if (budget === null) throw new AppError(404, 'BUDGET_NOT_FOUND', 'Orcamento nao encontrado');
  return serializeBudget(budget);
}

export async function createBudget(
  projectId: string,
  input: CreateBudgetEnvelope,
  createdById: string
) {
  const project = await requireProject(projectId);
  const calculation = await calculate(project.applicationType, input.inputData);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const budget = await prisma.$transaction(async (transaction) => {
        const projectExists = await lockProjectForUpdate(transaction, projectId);
        if (!projectExists) {
          throw new AppError(404, 'PROJECT_NOT_FOUND', 'Projeto nao encontrado');
        }

        const lockedProject = await transaction.project.findUnique({
          where: { id: projectId },
          select: { applicationType: true }
        });
        if (lockedProject === null) {
          throw new AppError(404, 'PROJECT_NOT_FOUND', 'Projeto nao encontrado');
        }
        if (lockedProject.applicationType !== project.applicationType) {
          throw new AppError(
            409,
            'PROJECT_APPLICATION_TYPE_CHANGED',
            'O tipo do projeto foi alterado durante a criacao do orcamento'
          );
        }

        const latest = await transaction.budget.aggregate({
          where: { projectId },
          _max: { versionNumber: true }
        });
        return transaction.budget.create({
          data: {
            projectId,
            versionNumber: (latest._max.versionNumber ?? 0) + 1,
            status: BudgetStatus.RASCUNHO,
            ...(input.notes === undefined ? {} : { notes: nullableNotes(input.notes) }),
            createdById,
            ...calculationData(calculation.inputData, calculation.result),
            items: { create: calculationItems(calculation.result) }
          },
          include: budgetInclude
        });
      });
      return serializeBudget(budget);
    } catch (error) {
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError
        && (error.code === 'P2002' || error.code === 'P2034');
      if (!retryable) throw error;
      if (attempt === 1) break;
    }
  }
  throw new AppError(409, 'BUDGET_VERSION_CONFLICT', 'Nao foi possivel reservar a versao do orcamento');
}

async function requireDraftBudget(id: string) {
  const budget = await prisma.budget.findUnique({
    where: { id },
    include: { project: { select: { applicationType: true } } }
  });
  if (budget === null) throw new AppError(404, 'BUDGET_NOT_FOUND', 'Orcamento nao encontrado');
  if (budget.status !== BudgetStatus.RASCUNHO) {
    throw budgetNotEditable();
  }
  return budget;
}

async function persistRecalculation(
  id: string,
  applicationType: ApplicationType,
  rawInput: unknown,
  notes?: string
) {
  const calculation = await calculate(applicationType, rawInput);
  const budget = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.budget.updateMany({
      where: { id, status: BudgetStatus.RASCUNHO },
      data: {
        ...calculationData(calculation.inputData, calculation.result),
        ...(notes === undefined ? {} : { notes: nullableNotes(notes) })
      }
    });
    if (updated.count !== 1) throw budgetNotEditable();

    await transaction.budgetItem.deleteMany({ where: { budgetId: id } });
    const items = calculationItems(calculation.result);
    if (items.length > 0) {
      await transaction.budgetItem.createMany({
        data: items.map((item) => ({ ...item, budgetId: id }))
      });
    }

    const recalculated = await transaction.budget.findUnique({
      where: { id },
      include: budgetInclude
    });
    if (recalculated === null) {
      throw new AppError(404, 'BUDGET_NOT_FOUND', 'Orcamento nao encontrado');
    }
    return recalculated;
  });
  return serializeBudget(budget);
}

export async function updateBudget(
  id: string,
  input: UpdateBudgetEnvelope
) {
  const current = await requireDraftBudget(id);
  if (input.inputData !== undefined) {
    return persistRecalculation(
      id,
      current.project.applicationType,
      input.inputData,
      input.notes
    );
  }

  const budget = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.budget.updateMany({
      where: { id: current.id, status: BudgetStatus.RASCUNHO },
      data: input.notes === undefined ? {} : { notes: nullableNotes(input.notes) }
    });
    if (updated.count !== 1) throw budgetNotEditable();

    const persisted = await transaction.budget.findUnique({
      where: { id: current.id },
      include: budgetInclude
    });
    if (persisted === null) {
      throw new AppError(404, 'BUDGET_NOT_FOUND', 'Orcamento nao encontrado');
    }
    return persisted;
  });
  return serializeBudget(budget);
}

export async function recalculateBudget(id: string) {
  const current = await requireDraftBudget(id);
  return persistRecalculation(
    id,
    current.project.applicationType,
    current.inputData
  );
}

export async function finalizeBudget(id: string) {
  const current = await requireDraftBudget(id);
  const budget = await prisma.$transaction(async (transaction) => {
    const finalized = await transaction.budget.updateMany({
      where: { id: current.id, status: BudgetStatus.RASCUNHO },
      data: { status: BudgetStatus.FINALIZADO }
    });
    if (finalized.count !== 1) throw budgetNotEditable();

    const persisted = await transaction.budget.findUnique({
      where: { id: current.id },
      include: budgetInclude
    });
    if (persisted === null) {
      throw new AppError(404, 'BUDGET_NOT_FOUND', 'Orcamento nao encontrado');
    }
    return persisted;
  });
  return serializeBudget(budget);
}
