import type { CreateBudgetInput, WebsiteBudgetInput } from '@mjm/shared';
import { websiteBudgetInputSchema } from '@mjm/shared';
import { BudgetStatus, Prisma } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';
import { prisma } from '../../shared/prisma/client.js';
import { getActiveWebsitePricing } from '../pricing/pricing.service.js';
import type { PricingResult } from '../pricing/pricing.types.js';
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

async function calculate(input: WebsiteBudgetInput): Promise<PricingResult> {
  return calculateWebsiteBudget(input, await getActiveWebsitePricing());
}

function calculationData(input: WebsiteBudgetInput, result: PricingResult) {
  return {
    inputData: input as Prisma.InputJsonValue,
    subtotal: result.subtotal.toFixed(2),
    complexityMultiplier: result.complexityMultiplier.toString(),
    urgencyMultiplier: result.urgencyMultiplier.toString(),
    discountPercentage: result.discountPercentage.toFixed(2),
    finalTotal: result.finalTotal.toFixed(2),
    monthlyRecurringTotal: result.monthlyRecurringTotal.toFixed(2),
    items: {
      create: result.items.map((item) => ({
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
      }))
    }
  };
}

async function requireWebsiteProject(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (project === null) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Projeto nao encontrado');
  if (project.applicationType !== 'WEBSITE') {
    throw new AppError(422, 'PRICING_NOT_SUPPORTED', 'Apenas projetos WEBSITE possuem precificacao neste ciclo');
  }
  return project;
}

export async function listBudgets(projectId: string) {
  await requireWebsiteProject(projectId);
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

export async function createBudget(projectId: string, input: CreateBudgetInput, createdById: string) {
  await requireWebsiteProject(projectId);
  const result = await calculate(input.inputData);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const budget = await prisma.$transaction(async (transaction) => {
        const latest = await transaction.budget.aggregate({
          where: { projectId },
          _max: { versionNumber: true }
        });
        return transaction.budget.create({
          data: {
            projectId,
            versionNumber: (latest._max.versionNumber ?? 0) + 1,
            status: BudgetStatus.RASCUNHO,
            ...(input.notes === undefined ? {} : { notes: input.notes }),
            createdById,
            ...calculationData(input.inputData, result)
          },
          include: budgetInclude
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return serializeBudget(budget);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002' || attempt === 1) {
        throw error;
      }
    }
  }
  throw new AppError(409, 'BUDGET_VERSION_CONFLICT', 'Nao foi possivel reservar a versao do orcamento');
}

async function requireDraftBudget(id: string) {
  const budget = await prisma.budget.findUnique({ where: { id } });
  if (budget === null) throw new AppError(404, 'BUDGET_NOT_FOUND', 'Orcamento nao encontrado');
  if (budget.status !== BudgetStatus.RASCUNHO) {
    throw new AppError(409, 'BUDGET_NOT_EDITABLE', 'Apenas orcamentos em rascunho podem ser alterados');
  }
  return budget;
}

async function persistRecalculation(id: string, inputData: WebsiteBudgetInput, notes?: string, finalize = false) {
  const result = await calculate(inputData);
  const budget = await prisma.$transaction(async (transaction) => {
    await transaction.budgetItem.deleteMany({ where: { budgetId: id } });
    return transaction.budget.update({
      where: { id },
      data: {
        ...calculationData(inputData, result),
        ...(notes === undefined ? {} : { notes }),
        ...(finalize ? { status: BudgetStatus.FINALIZADO } : {})
      },
      include: budgetInclude
    });
  });
  return serializeBudget(budget);
}

export async function updateBudget(
  id: string,
  input: { inputData?: WebsiteBudgetInput | undefined; notes?: string | undefined }
) {
  const current = await requireDraftBudget(id);
  const inputData = input.inputData ?? websiteBudgetInputSchema.parse(current.inputData);
  return persistRecalculation(id, inputData, input.notes);
}

export async function recalculateBudget(id: string) {
  const current = await requireDraftBudget(id);
  return persistRecalculation(id, websiteBudgetInputSchema.parse(current.inputData));
}

export async function finalizeBudget(id: string) {
  const current = await requireDraftBudget(id);
  return persistRecalculation(id, websiteBudgetInputSchema.parse(current.inputData), undefined, true);
}
