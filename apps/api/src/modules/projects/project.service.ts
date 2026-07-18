import type { CreateProjectInput, UpdateProjectInput } from '@mjm/shared';
import { ApplicationType, ProjectStatus } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';
import { prisma } from '../../shared/prisma/client.js';

const projectInclude = {
  responsibleUser: { select: { id: true, name: true, email: true } },
  _count: { select: { budgets: true } }
} as const;

function optionalText(value: string): string | null {
  return value === '' ? null : value;
}

export async function listProjects() {
  return prisma.project.findMany({
    include: projectInclude,
    orderBy: { updatedAt: 'desc' }
  });
}

export async function getProject(id: string) {
  const project = await prisma.project.findUnique({ where: { id }, include: projectInclude });
  if (project === null) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Projeto nao encontrado');
  return project;
}

export async function createProject(input: CreateProjectInput, responsibleUserId: string) {
  return prisma.project.create({
    data: {
      name: input.name,
      ...(input.clientName === undefined ? {} : { clientName: optionalText(input.clientName) }),
      ...(input.description === undefined ? {} : { description: optionalText(input.description) }),
      applicationType: ApplicationType[input.applicationType],
      status: ProjectStatus[input.status],
      responsibleUserId,
      ...(input.notes === undefined ? {} : { notes: optionalText(input.notes) })
    },
    include: projectInclude
  });
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  await getProject(id);
  return prisma.project.update({
    where: { id },
    data: {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.clientName === undefined ? {} : { clientName: optionalText(input.clientName) }),
      ...(input.description === undefined ? {} : { description: optionalText(input.description) }),
      ...(input.applicationType === undefined ? {} : { applicationType: ApplicationType[input.applicationType] }),
      ...(input.status === undefined ? {} : { status: ProjectStatus[input.status] }),
      ...(input.notes === undefined ? {} : { notes: optionalText(input.notes) })
    },
    include: projectInclude
  });
}

export async function deleteProject(id: string): Promise<void> {
  const project = await getProject(id);
  if (project._count.budgets > 0) {
    throw new AppError(
      409,
      'PROJECT_HAS_BUDGETS',
      'Projetos com orcamentos nao podem ser excluidos'
    );
  }
  await prisma.project.delete({ where: { id } });
}
