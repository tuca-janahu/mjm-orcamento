import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app/create-app.js';

const prisma = new PrismaClient();
const app = createApp();
const agent = request.agent(app);

const pricingValues: Record<string, number> = {
  WEBSITE_BASE_LANDING_PAGE: 2500,
  WEBSITE_BASE_INSTITUCIONAL: 2800,
  WEBSITE_BASE_PORTAL_CONTEUDO: 3000,
  WEBSITE_EXTRA_SECTION: 300,
  WEBSITE_EXTRA_PAGE: 300,
  WEBSITE_UNIQUE_LAYOUT: 400,
  WEBSITE_DESIGN_CLIENT_PROVIDED: 0,
  WEBSITE_DESIGN_TEMPLATE_CUSTOMIZATION: 200,
  WEBSITE_DESIGN_CUSTOM: 1000,
  WEBSITE_CONTENT_MIGRATION: 100,
  WEBSITE_CONTENT_PRODUCTION: 250,
  WEBSITE_EXTRA_LANGUAGE: 800,
  WEBSITE_CMS_STANDARD: 1000,
  WEBSITE_CMS_CUSTOM: 3000,
  WEBSITE_FORM_SIMPLE: 300,
  WEBSITE_FORM_ADVANCED: 800,
  WEBSITE_INTEGRATION_SIMPLE: 300,
  WEBSITE_INTEGRATION_STANDARD: 800,
  WEBSITE_INTEGRATION_COMPLEX: 1600,
  WEBSITE_MODULE_BLOG: 1000,
  WEBSITE_MODULE_SITE_SEARCH: 800,
  WEBSITE_SEO_TECHNICAL_BASELINE: 0,
  WEBSITE_SEO_ON_PAGE_SETUP: 600,
  WEBSITE_SEO_CONTENT_STRATEGY: 1500,
  WEBSITE_DOMAIN_NEW_REGISTRATION: 200,
  WEBSITE_DOMAIN_TRANSFER: 300,
  WEBSITE_DOMAIN_CONFIGURATION_ONLY: 150,
  WEBSITE_HOSTING_MJM_STANDARD_SETUP: 500,
  WEBSITE_HOSTING_MJM_STANDARD_MONTHLY: 250,
  WEBSITE_HOSTING_MJM_MANAGED_SETUP: 800,
  WEBSITE_HOSTING_MJM_MANAGED_MONTHLY: 500,
  WEBSITE_MAINTENANCE_ESSENTIAL_MONTHLY: 250,
  WEBSITE_MAINTENANCE_STANDARD_MONTHLY: 500,
  WEBSITE_MAINTENANCE_CUSTOM_MONTHLY: 1000,
  WEBSITE_COMPLEXITY_NONE: 1,
  WEBSITE_COMPLEXITY_MODERATE: 1.2,
  WEBSITE_COMPLEXITY_HIGH: 1.5,
  WEBSITE_URGENCY_NORMAL: 1,
  WEBSITE_URGENCY_PRIORITY: 1.3,
  WEBSITE_URGENCY_EXPRESS: 1.6
};

const unitPricingCodes = new Set([
  'WEBSITE_EXTRA_SECTION',
  'WEBSITE_EXTRA_PAGE',
  'WEBSITE_UNIQUE_LAYOUT',
  'WEBSITE_CONTENT_MIGRATION',
  'WEBSITE_CONTENT_PRODUCTION',
  'WEBSITE_EXTRA_LANGUAGE',
  'WEBSITE_FORM_SIMPLE',
  'WEBSITE_FORM_ADVANCED',
  'WEBSITE_INTEGRATION_SIMPLE',
  'WEBSITE_INTEGRATION_STANDARD',
  'WEBSITE_INTEGRATION_COMPLEX'
]);

const completeInput = {
  websiteCategory: 'INSTITUCIONAL',
  sectionCount: 1,
  pageCount: 7,
  uniqueLayoutCount: 3,
  languageCount: 2,
  contentResponsibility: 'MJM_MIGRATES_EXISTING',
  contentMigrationCount: 4,
  designApproach: 'CUSTOM_DESIGN',
  contentManagement: 'CUSTOM_ADMIN',
  simpleFormCount: 2,
  advancedFormCount: 1,
  integrations: [
    { name: 'HubSpot', complexity: 'STANDARD' },
    { name: 'ERP do cliente', complexity: 'COMPLEX' }
  ],
  additionalModules: ['BLOG', 'SITE_SEARCH'],
  seoLevel: 'CONTENT_STRATEGY',
  domainService: 'NEW_REGISTRATION',
  hostingPlan: 'MJM_MANAGED',
  maintenancePlan: 'STANDARD',
  complexityAdjustment: 'MODERATE',
  complexityReason: 'Integracoes e painel administrativo personalizado',
  discountPercentage: 10,
  discountReason: 'Condicao comercial aprovada'
} as const;

describe.sequential('fluxo de projetos e orcamentos', () => {
  let projectId: string;
  let firstBudgetId: string;
  let secondBudgetId: string;
  let firstItems: unknown;
  let secondItems: unknown;
  let firstInputData: unknown;

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
        category: 'COMPONENTE',
        configType: code.includes('COMPLEXITY') || code.includes('URGENCY')
          ? 'MULTIPLIER'
          : unitPricingCodes.has(code) ? 'UNIT_VALUE' : 'FIXED_VALUE',
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
      name: 'Novo site institucional',
      clientName: 'Cliente Teste',
      applicationType: 'WEBSITE'
    });

    expect(created.status).toBe(201);
    expect(created.body.project.name).toBe('Novo site institucional');
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

  it('cria o primeiro orcamento com o novo escopo completo', async () => {
    const response = await agent.post(`/projects/${projectId}/budgets`).send({
      inputData: completeInput
    });

    expect(response.status).toBe(201);
    expect(response.body.budget.versionNumber).toBe(1);
    expect(response.body.budget.inputData.websiteCategory).toBe('INSTITUCIONAL');
    expect(response.body.budget.subtotal).toBe('17100.00');
    expect(response.body.budget.complexityMultiplier).toBe('1.2000');
    expect(response.body.budget.urgencyMultiplier).toBe('1.0000');
    expect(response.body.budget.finalTotal).toBe('18388.00');
    expect(response.body.budget.monthlyRecurringTotal).toBe('1000.00');
    expect(response.body.budget.items).toHaveLength(18);

    const createdItems = response.body.budget.items as Array<{ code: string }>;
    const codes = createdItems.map((item) => item.code);
    expect(codes).toEqual(expect.arrayContaining([
      'WEBSITE_BASE_INSTITUCIONAL',
      'WEBSITE_EXTRA_PAGE',
      'WEBSITE_UNIQUE_LAYOUT',
      'WEBSITE_CONTENT_MIGRATION',
      'WEBSITE_HOSTING_MJM_MANAGED_MONTHLY',
      'WEBSITE_MAINTENANCE_STANDARD_MONTHLY'
    ]));

    firstBudgetId = response.body.budget.id;
    firstItems = response.body.budget.items;
    firstInputData = response.body.budget.inputData;
  });

  it('incrementa a versao sem sobrescrever a anterior', async () => {
    const response = await agent.post(`/projects/${projectId}/budgets`).send({
      inputData: completeInput
    });

    expect(response.status).toBe(201);
    expect(response.body.budget.versionNumber).toBe(2);
    expect(response.body.budget.finalTotal).toBe('18388.00');
    secondBudgetId = response.body.budget.id;
    secondItems = response.body.budget.items;

    const first = await agent.get(`/budgets/${firstBudgetId}`);
    expect(first.status).toBe(200);
    expect(first.body.budget.versionNumber).toBe(1);
    expect(first.body.budget.finalTotal).toBe('18388.00');
  });

  it('mantem o historico quando uma configuracao de preco muda', async () => {
    await prisma.pricingConfig.update({
      where: { code: 'WEBSITE_BASE_INSTITUCIONAL' },
      data: { value: 3800 }
    });

    const historical = await agent.get(`/budgets/${firstBudgetId}`);
    expect(historical.status).toBe(200);
    expect(historical.body.budget.finalTotal).toBe('18388.00');
    expect(historical.body.budget.items).toEqual(firstItems);
  });

  it('atualiza somente as observacoes sem recalcular o rascunho', async () => {
    const updated = await agent.patch(`/budgets/${secondBudgetId}`).send({
      notes: 'Escopo validado com o cliente'
    });

    expect(updated.status).toBe(200);
    expect(updated.body.budget.notes).toBe('Escopo validado com o cliente');
    expect(updated.body.budget.subtotal).toBe('17100.00');
    expect(updated.body.budget.finalTotal).toBe('18388.00');
    expect(updated.body.budget.items).toEqual(secondItems);
  });

  it('finaliza sem recalcular silenciosamente os valores congelados', async () => {
    const finalized = await agent.post(`/budgets/${firstBudgetId}/finalize`);

    expect(finalized.status).toBe(200);
    expect(finalized.body.budget.status).toBe('FINALIZADO');
    expect(finalized.body.budget.inputData).toEqual(firstInputData);
    expect(finalized.body.budget.subtotal).toBe('17100.00');
    expect(finalized.body.budget.finalTotal).toBe('18388.00');
    expect(finalized.body.budget.monthlyRecurringTotal).toBe('1000.00');
    expect(finalized.body.budget.items).toEqual(firstItems);
  });

  it('recalcula explicitamente um rascunho com os precos atuais', async () => {
    const recalculated = await agent.post(`/budgets/${secondBudgetId}/recalculate`);

    expect(recalculated.status).toBe(200);
    expect(recalculated.body.budget.subtotal).toBe('18100.00');
    expect(recalculated.body.budget.finalTotal).toBe('19468.00');
    expect(recalculated.body.budget.monthlyRecurringTotal).toBe('1000.00');
    expect(recalculated.body.budget.notes).toBe('Escopo validado com o cliente');

    const recalculatedItems = recalculated.body.budget.items as Array<{
      code: string;
      unitPrice: string;
    }>;
    const baseItem = recalculatedItems.find(
      (item) => item.code === 'WEBSITE_BASE_INSTITUCIONAL'
    );
    expect(baseItem?.unitPrice).toBe('3800.00');
  });

  it('impede alteracao direta de um orcamento finalizado', async () => {
    const update = await agent.patch(`/budgets/${firstBudgetId}`).send({
      notes: 'Alteracao indevida'
    });
    expect(update.status).toBe(409);
    expect(update.body.error.code).toBe('BUDGET_NOT_EDITABLE');
  });

  it('impede excluir projeto que possui historico de orcamentos', async () => {
    const response = await agent.delete(`/projects/${projectId}`);
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('PROJECT_HAS_BUDGETS');
  });
});
