import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app/create-app.js';

const prisma = new PrismaClient();
const app = createApp();
const agent = request.agent(app);

const pricingValues: Record<string, number> = {
  WEBSITE_BASE_LANDING_PAGE: 500,
  WEBSITE_BASE_INSTITUCIONAL: 800,
  WEBSITE_BASE_BLOG: 1000,
  WEBSITE_BASE_ECOMMERCE: 1600,
  WEBSITE_BASE_PLATAFORMA: 2400,
  WEBSITE_EXTRA_PAGE: 300,
  WEBSITE_DESIGN_TEMPLATE: 200,
  WEBSITE_DESIGN_CUSTOM: 1000,
  WEBSITE_DEVELOPMENT_FRONTEND: 2000,
  WEBSITE_DEVELOPMENT_FULLSTACK: 3000,
  WEBSITE_ADMIN_PANEL: 2000,
  WEBSITE_INTEGRATION: 800,
  WEBSITE_PAYMENT_SYSTEM: 1500,
  WEBSITE_BLOG: 1000,
  WEBSITE_BASIC_SEO: 200,
  WEBSITE_DOMAIN: 200,
  WEBSITE_HOSTING: 500,
  WEBSITE_COMPLEXITY_SIMPLE: 1,
  WEBSITE_COMPLEXITY_MEDIUM: 1.2,
  WEBSITE_COMPLEXITY_COMPLEX: 1.5,
  WEBSITE_URGENCY_NORMAL: 1,
  WEBSITE_URGENCY_PRIORITY: 1.3,
  WEBSITE_URGENCY_EXPRESS: 1.6
};

const completeInput = {
  websiteType: 'PLATAFORMA',
  numberOfPages: 10,
  designType: 'PERSONALIZADO',
  developmentType: 'FULLSTACK',
  hasAdminPanel: true,
  integrationCount: 2,
  hasPaymentSystem: true,
  hasBlog: false,
  hasBasicSeo: true,
  hasDomain: true,
  hasHosting: true,
  complexity: 'MEDIO',
  urgency: 'NORMAL',
  requiresMonthlyMaintenance: true,
  discountPercentage: 10,
  estimatedDeadlineDays: 90
} as const;

describe.sequential('fluxo de projetos e orcamentos', () => {
  let projectId: string;
  let firstBudgetId: string;
  let secondBudgetId: string;

  beforeAll(async () => {
    await prisma.budgetItem.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.project.deleteMany();
    await prisma.pricingConfig.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.create({
      data: {
        name: 'Admin Teste',
        email: 'budget-test@example.com',
        passwordHash: await argon2.hash('correct-password', { type: argon2.argon2id }),
        role: 'ADMIN',
        active: true
      }
    });

    await prisma.pricingConfig.createMany({
      data: Object.entries(pricingValues).map(([code, value]) => ({
        code,
        name: code,
        applicationType: 'WEBSITE',
        category: code.includes('COMPLEXITY') ? 'COMPLEXIDADE' : code.includes('URGENCY') ? 'URGENCIA' : 'COMPONENTE',
        configType: code.includes('COMPLEXITY') || code.includes('URGENCY') ? 'MULTIPLIER' : 'FIXED_VALUE',
        value,
        active: true
      }))
    });

    const login = await agent.post('/auth/login').send({
      email: 'budget-test@example.com',
      password: 'correct-password'
    });
    expect(login.status).toBe(200);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('protege projetos sem autenticacao', async () => {
    const response = await request(app).get('/projects');
    expect(response.status).toBe(401);
  });

  it('cria e consulta um projeto WEBSITE', async () => {
    const created = await agent.post('/projects').send({
      name: 'Nova plataforma',
      clientName: 'Cliente Teste',
      applicationType: 'WEBSITE'
    });

    expect(created.status).toBe(201);
    expect(created.body.project.name).toBe('Nova plataforma');
    projectId = created.body.project.id;

    const listed = await agent.get('/projects');
    expect(listed.status).toBe(200);
    expect(listed.body.projects).toHaveLength(1);
  });

  it('consulta e edita o projeto', async () => {
    const consulted = await agent.get(`/projects/${projectId}`);
    expect(consulted.status).toBe(200);
    expect(consulted.body.project.clientName).toBe('Cliente Teste');

    const updated = await agent.patch(`/projects/${projectId}`).send({ status: 'PREPARACAO' });
    expect(updated.status).toBe(200);
    expect(updated.body.project.status).toBe('PREPARACAO');
  });

  it('cria o primeiro orcamento e persiste itens calculados', async () => {
    const response = await agent.post(`/projects/${projectId}/budgets`).send({ inputData: completeInput });

    expect(response.status).toBe(201);
    expect(response.body.budget.versionNumber).toBe(1);
    expect(response.body.budget.finalTotal).toBe('15012.00');
    expect(response.body.budget.items).toHaveLength(12);
    firstBudgetId = response.body.budget.id;
  });

  it('incrementa a versao sem sobrescrever a anterior', async () => {
    const response = await agent.post(`/projects/${projectId}/budgets`).send({
      inputData: { ...completeInput, discountPercentage: 0 }
    });

    expect(response.status).toBe(201);
    expect(response.body.budget.versionNumber).toBe(2);
    secondBudgetId = response.body.budget.id;

    const first = await agent.get(`/budgets/${firstBudgetId}`);
    expect(first.body.budget.discountPercentage).toBe('10.00');
    expect(first.body.budget.finalTotal).toBe('15012.00');
  });

  it('mantem valores historicos quando a configuracao muda', async () => {
    await prisma.pricingConfig.update({
      where: { code: 'WEBSITE_BASE_PLATAFORMA' },
      data: { value: 3000 }
    });

    const historical = await agent.get(`/budgets/${firstBudgetId}`);
    expect(historical.body.budget.finalTotal).toBe('15012.00');

    const recalculated = await agent.post(`/budgets/${secondBudgetId}/recalculate`);
    expect(recalculated.status).toBe(200);
    expect(recalculated.body.budget.finalTotal).toBe('17400.00');
  });

  it('finaliza e impede alteracao direta posterior', async () => {
    const finalized = await agent.post(`/budgets/${firstBudgetId}/finalize`);
    expect(finalized.status).toBe(200);
    expect(finalized.body.budget.status).toBe('FINALIZADO');

    const update = await agent.patch(`/budgets/${firstBudgetId}`).send({ notes: 'Alteracao indevida' });
    expect(update.status).toBe(409);
    expect(update.body.error.code).toBe('BUDGET_NOT_EDITABLE');
  });

  it('impede excluir projeto que possui historico de orcamentos', async () => {
    const response = await agent.delete(`/projects/${projectId}`);
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('PROJECT_HAS_BUDGETS');
  });
});
