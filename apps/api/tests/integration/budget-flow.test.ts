import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app/create-app.js';

const prisma = new PrismaClient();
const app = createApp();
const agent = request.agent(app);
const workspaceAgent = request.agent(app);

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
  WEBSITE_URGENCY_EXPRESS: 1.6,
  WEB_PLATFORM_BASE_CLIENT_PORTAL: 6000,
  WEB_PLATFORM_BASE_SAAS: 8000,
  WEB_PLATFORM_BASE_MARKETPLACE: 10000,
  WEB_PLATFORM_BASE_MEMBERSHIP_PLATFORM: 6500,
  WEB_PLATFORM_BASE_CUSTOM: 8000,
  WEB_PLATFORM_ACCOUNT_SINGLE_ORGANIZATION: 0,
  WEB_PLATFORM_ACCOUNT_MULTI_ORGANIZATION: 3500,
  WEB_PLATFORM_DESIGN_CLIENT_PROVIDED: 0,
  WEB_PLATFORM_DESIGN_SYSTEM_ADAPTATION: 1500,
  WEB_PLATFORM_DESIGN_CUSTOM: 3000,
  WEB_PLATFORM_EXTRA_SCREEN_CLIENT_PROVIDED: 0,
  WEB_PLATFORM_EXTRA_SCREEN_DESIGN_SYSTEM_ADAPTATION: 250,
  WEB_PLATFORM_EXTRA_SCREEN_CUSTOM_DESIGN: 500,
  WEB_PLATFORM_EXTRA_USER_ROLE: 400,
  WEB_PLATFORM_EXTRA_LANGUAGE: 800,
  WEB_PLATFORM_MODULE_SIMPLE: 1200,
  WEB_PLATFORM_MODULE_STANDARD: 2500,
  WEB_PLATFORM_MODULE_COMPLEX: 4500,
  WEB_PLATFORM_BACKOFFICE_STANDARD: 2000,
  WEB_PLATFORM_BACKOFFICE_CUSTOM: 4500,
  WEB_PLATFORM_DASHBOARD: 1200,
  WEB_PLATFORM_REPORT: 600,
  WEB_PLATFORM_AUTH_SOCIAL_LOGIN: 800,
  WEB_PLATFORM_AUTH_MFA: 1500,
  WEB_PLATFORM_AUTH_SSO: 3500,
  WEB_PLATFORM_PAYMENT_ONE_TIME: 1800,
  WEB_PLATFORM_PAYMENT_SUBSCRIPTION: 3000,
  WEB_PLATFORM_PAYMENT_MARKETPLACE_SPLIT: 6000,
  WEB_PLATFORM_NOTIFICATION_IN_APP: 700,
  WEB_PLATFORM_NOTIFICATION_EMAIL: 800,
  WEB_PLATFORM_NOTIFICATION_WHATSAPP_SMS: 1500,
  WEB_PLATFORM_FILE_BASIC_UPLOADS: 800,
  WEB_PLATFORM_FILE_DOCUMENT_WORKFLOW: 2500,
  WEB_PLATFORM_AUDIT_BASIC: 800,
  WEB_PLATFORM_AUDIT_COMPLETE: 2500,
  WEB_PLATFORM_INTEGRATION_SIMPLE: 500,
  WEB_PLATFORM_INTEGRATION_STANDARD: 1200,
  WEB_PLATFORM_INTEGRATION_COMPLEX: 2500,
  WEB_PLATFORM_DATA_MIGRATION_STRUCTURED_IMPORT: 1000,
  WEB_PLATFORM_DATA_MIGRATION_LEGACY_MIGRATION: 3000,
  WEB_PLATFORM_HOSTING_MJM_STANDARD_SETUP: 800,
  WEB_PLATFORM_HOSTING_MJM_STANDARD_MONTHLY: 500,
  WEB_PLATFORM_HOSTING_MJM_MANAGED_SETUP: 1500,
  WEB_PLATFORM_HOSTING_MJM_MANAGED_MONTHLY: 1000,
  WEB_PLATFORM_MAINTENANCE_ESSENTIAL_MONTHLY: 500,
  WEB_PLATFORM_MAINTENANCE_STANDARD_MONTHLY: 1000,
  WEB_PLATFORM_MAINTENANCE_CUSTOM_MONTHLY: 2000,
  WEB_PLATFORM_COMPLEXITY_NONE: 1,
  WEB_PLATFORM_COMPLEXITY_MODERATE: 1.2,
  WEB_PLATFORM_COMPLEXITY_HIGH: 1.5,
  WEB_PLATFORM_URGENCY_NORMAL: 1,
  WEB_PLATFORM_URGENCY_PRIORITY: 1.3,
  WEB_PLATFORM_URGENCY_EXPRESS: 1.6,
  INTERNAL_SYSTEM_BASE: 5000,
  INTERNAL_SYSTEM_MODULE_SIMPLE: 1200,
  INTERNAL_SYSTEM_MODULE_STANDARD: 2500,
  INTERNAL_SYSTEM_MODULE_COMPLEX: 4500,
  INTERNAL_SYSTEM_EXTRA_ACCESS_PROFILE: 400,
  INTERNAL_SYSTEM_CUSTOM_PERMISSIONS: 2000,
  INTERNAL_SYSTEM_AUTH_MFA: 1500,
  INTERNAL_SYSTEM_AUTH_CORPORATE_SSO: 3500,
  INTERNAL_SYSTEM_WORKFLOW_SIMPLE: 1200,
  INTERNAL_SYSTEM_WORKFLOW_CUSTOM: 3000,
  INTERNAL_SYSTEM_DOCUMENT_BASIC_ATTACHMENTS: 800,
  INTERNAL_SYSTEM_DOCUMENT_WORKFLOW: 2500,
  INTERNAL_SYSTEM_EXTRA_DASHBOARD: 1200,
  INTERNAL_SYSTEM_REPORT: 600,
  INTERNAL_SYSTEM_NOTIFICATION_EMAIL: 800,
  INTERNAL_SYSTEM_NOTIFICATION_WHATSAPP_SMS: 1500,
  INTERNAL_SYSTEM_INTEGRATION_SIMPLE: 500,
  INTERNAL_SYSTEM_INTEGRATION_STANDARD: 1200,
  INTERNAL_SYSTEM_INTEGRATION_COMPLEX: 2500,
  INTERNAL_SYSTEM_DATA_MIGRATION_STRUCTURED_IMPORT: 1000,
  INTERNAL_SYSTEM_DATA_MIGRATION_LEGACY: 3000,
  INTERNAL_SYSTEM_HOSTING_MJM_STANDARD_SETUP: 800,
  INTERNAL_SYSTEM_HOSTING_MJM_MANAGED_SETUP: 1500,
  INTERNAL_SYSTEM_HOSTING_MJM_STANDARD_MONTHLY: 500,
  INTERNAL_SYSTEM_HOSTING_MJM_MANAGED_MONTHLY: 1000,
  INTERNAL_SYSTEM_MAINTENANCE_ESSENTIAL_MONTHLY: 500,
  INTERNAL_SYSTEM_MAINTENANCE_STANDARD_MONTHLY: 1000,
  INTERNAL_SYSTEM_MAINTENANCE_CUSTOM_MONTHLY: 2000,
  INTERNAL_SYSTEM_COMPLEXITY_NONE: 1,
  INTERNAL_SYSTEM_COMPLEXITY_MODERATE: 1.2,
  INTERNAL_SYSTEM_COMPLEXITY_HIGH: 1.5,
  INTERNAL_SYSTEM_URGENCY_NORMAL: 1,
  INTERNAL_SYSTEM_URGENCY_PRIORITY: 1.3,
  INTERNAL_SYSTEM_URGENCY_EXPRESS: 1.6
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
  'WEBSITE_INTEGRATION_COMPLEX',
  'WEB_PLATFORM_EXTRA_SCREEN_CLIENT_PROVIDED',
  'WEB_PLATFORM_EXTRA_SCREEN_DESIGN_SYSTEM_ADAPTATION',
  'WEB_PLATFORM_EXTRA_SCREEN_CUSTOM_DESIGN',
  'WEB_PLATFORM_EXTRA_USER_ROLE',
  'WEB_PLATFORM_EXTRA_LANGUAGE',
  'WEB_PLATFORM_MODULE_SIMPLE',
  'WEB_PLATFORM_MODULE_STANDARD',
  'WEB_PLATFORM_MODULE_COMPLEX',
  'WEB_PLATFORM_DASHBOARD',
  'WEB_PLATFORM_REPORT',
  'WEB_PLATFORM_INTEGRATION_SIMPLE',
  'WEB_PLATFORM_INTEGRATION_STANDARD',
  'WEB_PLATFORM_INTEGRATION_COMPLEX',
  'WEB_PLATFORM_DATA_MIGRATION_STRUCTURED_IMPORT',
  'WEB_PLATFORM_DATA_MIGRATION_LEGACY_MIGRATION',
  'INTERNAL_SYSTEM_MODULE_SIMPLE',
  'INTERNAL_SYSTEM_MODULE_STANDARD',
  'INTERNAL_SYSTEM_MODULE_COMPLEX',
  'INTERNAL_SYSTEM_EXTRA_ACCESS_PROFILE',
  'INTERNAL_SYSTEM_EXTRA_DASHBOARD',
  'INTERNAL_SYSTEM_REPORT',
  'INTERNAL_SYSTEM_INTEGRATION_SIMPLE',
  'INTERNAL_SYSTEM_INTEGRATION_STANDARD',
  'INTERNAL_SYSTEM_INTEGRATION_COMPLEX',
  'INTERNAL_SYSTEM_DATA_MIGRATION_STRUCTURED_IMPORT',
  'INTERNAL_SYSTEM_DATA_MIGRATION_LEGACY'
]);

const internalSystemBaseMetadata = {
  includedAccessProfiles: 2,
  includedDashboards: 1,
  includedFeatures: [
    'EMAIL_PASSWORD_AUTH',
    'STANDARD_ROLES',
    'BASIC_ADMINISTRATION',
    'IN_APP_NOTIFICATIONS'
  ]
};

function applicationTypeForPricingCode(code: string) {
  if (code.startsWith('WEBSITE_')) return 'WEBSITE' as const;
  if (code.startsWith('WEB_PLATFORM_')) return 'PLATAFORMA_WEB' as const;
  if (code.startsWith('INTERNAL_SYSTEM_')) return 'SISTEMA_INTERNO' as const;
  throw new Error(`Prefixo de configuracao de preco desconhecido: ${code}`);
}

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

const completePlatformInput = {
  platformCategory: 'SAAS',
  accountStructure: 'MULTI_ORGANIZATION',
  screenCount: 8,
  userRoleCount: 4,
  languageCount: 2,
  designApproach: 'CUSTOM_DESIGN',
  functionalModules: [
    { name: 'Gestao de usuarios', complexity: 'SIMPLE' },
    {
      name: 'Gestao de assinaturas',
      description: 'Ciclo de contratacao e renovacao',
      complexity: 'STANDARD'
    }
  ],
  adminBackoffice: 'STANDARD',
  dashboardCount: 1,
  reportCount: 2,
  additionalAuthentication: ['MFA'],
  paymentFeatures: ['SUBSCRIPTION'],
  notificationChannels: ['IN_APP', 'EMAIL'],
  fileHandling: 'BASIC_UPLOADS',
  auditLevel: 'BASIC',
  integrations: [{ name: 'CRM', complexity: 'STANDARD' }],
  dataMigration: 'STRUCTURED_IMPORT',
  dataMigrationSourceCount: 2,
  hostingPlan: 'MJM_MANAGED',
  maintenancePlan: 'STANDARD',
  complexityAdjustment: 'MODERATE',
  complexityReason: 'Operacao multi-organizacao com cobranca recorrente',
  discountPercentage: 10,
  discountReason: 'Condicao comercial aprovada'
} as const;

const completeInternalSystemInput = {
  modules: [
    { name: 'Controle de estoque', complexity: 'SIMPLE' },
    {
      name: 'Ordens de servico',
      description: 'Abertura, execucao e encerramento das ordens',
      complexity: 'STANDARD'
    },
    { name: 'Aprovacoes internas', complexity: 'COMPLEX' }
  ],
  accessProfileCount: 4,
  permissionModel: 'CUSTOM_PERMISSIONS',
  additionalAuthentication: ['MFA'],
  workflowLevel: 'CUSTOM',
  documentManagement: 'DOCUMENT_WORKFLOW',
  dashboardCount: 2,
  reportCount: 2,
  additionalNotificationChannels: ['EMAIL'],
  integrations: [{
    name: 'ERP corporativo',
    description: 'Sincronizacao de estoque e ordens',
    complexity: 'STANDARD'
  }],
  dataMigration: 'LEGACY_MIGRATION',
  dataMigrationSourceCount: 2,
  dataMigrationDescription: 'Banco anterior e planilha historica de estoque',
  hostingPlan: 'MJM_MANAGED',
  maintenancePlan: 'STANDARD',
  complexityAdjustment: 'MODERATE',
  complexityReason: 'Regras transversais entre estoque, ordens e aprovacoes',
  discountPercentage: 10,
  discountReason: 'Condicao comercial de contratacao conjunta'
} as const;

describe.sequential('fluxo de projetos e orcamentos', () => {
  let projectId: string;
  let firstBudgetId: string;
  let secondBudgetId: string;
  let firstItems: unknown;
  let secondItems: unknown;
  let firstInputData: unknown;
  let platformProjectId: string;
  let platformBudgetId: string;
  let platformItems: unknown;
  let internalSystemProjectId: string;
  let internalSystemBudgetId: string;
  let internalSystemItems: unknown;

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

    await prisma.user.create({
      data: {
        name: 'Colaborador Teste',
        email: 'workspace-test@example.com',
        passwordHash: await argon2.hash('correct-password', { type: argon2.argon2id }),
        role: 'USER',
        active: true
      }
    });

    await prisma.pricingConfig.createMany({
      data: Object.entries(pricingValues).map(([code, value]) => ({
        code,
        name: code,
        applicationType: applicationTypeForPricingCode(code),
        category: 'COMPONENTE',
        configType: code.includes('COMPLEXITY') || code.includes('URGENCY')
          ? 'MULTIPLIER'
          : unitPricingCodes.has(code) ? 'UNIT_VALUE' : 'FIXED_VALUE',
        value,
        active: true,
        ...(code === 'INTERNAL_SYSTEM_BASE'
          ? { metadata: internalSystemBaseMetadata }
          : {})
      }))
    });

    const login = await agent.post('/auth/login').send({
      email: 'budget-test@example.com',
      password: 'correct-password'
    });
    expect(login.status).toBe(200);

    const workspaceLogin = await workspaceAgent.post('/auth/login').send({
      email: 'workspace-test@example.com',
      password: 'correct-password'
    });
    expect(workspaceLogin.status).toBe(200);
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

  it('mantem o workspace compartilhado para outro usuario autenticado', async () => {
    const response = await workspaceAgent.get('/projects');

    expect(response.status).toBe(200);
    expect(response.body.projects).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: projectId })
    ]));
  });

  it('normaliza UUIDs de rota e chaves de idempotência inválidos', async () => {
    const invalidRoute = await agent.get('/projects/not-a-uuid');

    expect(invalidRoute.status).toBe(400);
    expect(invalidRoute.body.error.code).toBe('INVALID_ROUTE_PARAMETER');

    const invalidIdempotencyKey = await agent
      .post(`/projects/${projectId}/budgets`)
      .set('Idempotency-Key', 'not-a-uuid')
      .send({ inputData: completeInput });

    expect(invalidIdempotencyKey.status).toBe(400);
    expect(invalidIdempotencyKey.body.error.code).toBe('INVALID_IDEMPOTENCY_KEY');
  });

  it('consulta e edita o projeto', async () => {
    const consulted = await agent.get(`/projects/${projectId}`);
    expect(consulted.status).toBe(200);
    expect(consulted.body.project.clientName).toBe('Cliente Teste');

    const updated = await agent.patch(`/projects/${projectId}`).send({ status: 'PREPARACAO' });
    expect(updated.status).toBe(200);
    expect(updated.body.project.status).toBe('PREPARACAO');
  });

  it('reaproveita uma criacao quando a mesma chave idempotente e reenviada', async () => {
    const project = await agent.post('/projects').send({
      name: 'Projeto com criacao idempotente',
      applicationType: 'WEBSITE'
    });
    const key = '00000000-0000-4000-8000-000000000010';
    const createRequest = () => agent
      .post(`/projects/${project.body.project.id}/budgets`)
      .set('Idempotency-Key', key)
      .send({ inputData: completeInput });

    const first = await createRequest();
    const replay = await createRequest();

    expect(first.status).toBe(201);
    expect(replay.status).toBe(201);
    expect(first.body.budget.id).toBe(key);
    expect(replay.body.budget.id).toBe(first.body.budget.id);
    expect(replay.body.budget.versionNumber).toBe(first.body.budget.versionNumber);
    expect(await prisma.budget.count({
      where: { projectId: project.body.project.id }
    })).toBe(1);

    await prisma.pricingConfig.update({
      where: { code: 'WEBSITE_BASE_INSTITUCIONAL' },
      data: { value: 3800 }
    });
    const replayAfterPricingChange = await createRequest();
    expect(replayAfterPricingChange.status).toBe(201);
    expect(replayAfterPricingChange.body.budget.finalTotal).toBe(first.body.budget.finalTotal);
    await prisma.pricingConfig.update({
      where: { code: 'WEBSITE_BASE_INSTITUCIONAL' },
      data: { value: 2800 }
    });

    const conflictingReplay = await agent
      .post(`/projects/${project.body.project.id}/budgets`)
      .set('Idempotency-Key', key)
      .send({ inputData: { ...completeInput, pageCount: 8 } });

    expect(conflictingReplay.status).toBe(409);
    expect(conflictingReplay.body.error.code).toBe('BUDGET_IDEMPOTENCY_KEY_REUSED');

    const conflictingNotes = await agent
      .post(`/projects/${project.body.project.id}/budgets`)
      .set('Idempotency-Key', key)
      .send({ inputData: completeInput, notes: 'Outra premissa' });
    expect(conflictingNotes.status).toBe(409);

    const conflictingUser = await workspaceAgent
      .post(`/projects/${project.body.project.id}/budgets`)
      .set('Idempotency-Key', key)
      .send({ inputData: completeInput });
    expect(conflictingUser.status).toBe(409);

    const otherProject = await agent.post('/projects').send({
      name: 'Projeto idempotente alternativo',
      applicationType: 'WEBSITE'
    });
    const conflictingProject = await agent
      .post(`/projects/${otherProject.body.project.id}/budgets`)
      .set('Idempotency-Key', key)
      .send({ inputData: completeInput });
    expect(conflictingProject.status).toBe(409);
    expect(await prisma.budget.count({
      where: { projectId: project.body.project.id }
    })).toBe(1);
  });

  it('reaproveita uma chave quando a data persistida ja ficou no passado', async () => {
    const project = await agent.post('/projects').send({
      name: 'Projeto plataforma com replay historico',
      applicationType: 'PLATAFORMA_WEB'
    });
    const inputData = {
      platformCategory: 'CLIENT_PORTAL',
      accountStructure: 'SINGLE_ORGANIZATION',
      screenCount: 5,
      userRoleCount: 2,
      languageCount: 1,
      designApproach: 'CLIENT_PROVIDED',
      functionalModules: [{ name: 'Area do cliente', complexity: 'SIMPLE' }],
      adminBackoffice: 'NONE',
      dashboardCount: 0,
      reportCount: 0,
      additionalAuthentication: [],
      paymentFeatures: [],
      notificationChannels: [],
      fileHandling: 'NONE',
      auditLevel: 'NONE',
      integrations: [],
      dataMigration: 'NONE',
      dataMigrationSourceCount: 0,
      hostingPlan: 'CLIENT_MANAGED',
      maintenancePlan: 'NONE',
      targetLaunchDate: '2020-01-01',
      complexityAdjustment: 'NONE',
      discountPercentage: 0
    };
    const key = '00000000-0000-4000-8000-000000000011';
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: 'budget-test@example.com' }
    });

    await prisma.budget.create({
      data: {
        id: key,
        projectId: project.body.project.id,
        versionNumber: 1,
        inputData,
        subtotal: 7200,
        complexityMultiplier: 1,
        urgencyMultiplier: 1,
        discountPercentage: 0,
        finalTotal: 7200,
        monthlyRecurringTotal: 0,
        createdById: user.id
      }
    });

    const replay = await agent
      .post(`/projects/${project.body.project.id}/budgets`)
      .set('Idempotency-Key', key)
      .send({ inputData });

    expect(replay.status).toBe(201);
    expect(replay.body.budget.id).toBe(key);
    expect(replay.body.budget.inputData.targetLaunchDate).toBe('2020-01-01');
  });

  it('reaproveita uma unica criacao para duas requisicoes simultaneas com a mesma chave', async () => {
    const project = await agent.post('/projects').send({
      name: 'Projeto concorrente idempotente',
      applicationType: 'WEBSITE'
    });
    const key = '00000000-0000-4000-8000-000000000012';
    const create = () => agent
      .post(`/projects/${project.body.project.id}/budgets`)
      .set('Idempotency-Key', key)
      .send({ inputData: completeInput });

    const [first, second] = await Promise.all([create(), create()]);
    expect([first.status, second.status]).toEqual([201, 201]);
    expect(first.body.budget.id).toBe(key);
    expect(second.body.budget.id).toBe(key);
    expect(await prisma.budget.count({ where: { projectId: project.body.project.id } })).toBe(1);
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

    const cleared = await agent.patch(`/budgets/${secondBudgetId}`).send({ notes: '   ' });
    expect(cleared.status).toBe(200);
    expect(cleared.body.budget.notes).toBeNull();
    expect(cleared.body.budget.items).toEqual(secondItems);

    const restored = await agent.patch(`/budgets/${secondBudgetId}`).send({
      notes: 'Escopo validado com o cliente'
    });
    expect(restored.status).toBe(200);
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

    const replay = await agent.post(`/budgets/${firstBudgetId}/finalize`);
    expect(replay.status).toBe(200);
    expect(replay.body.budget.id).toBe(firstBudgetId);
    expect(replay.body.budget.status).toBe('FINALIZADO');
    expect(replay.body.budget.items).toEqual(firstItems);
  });

  it('protege a exclusao de orcamentos sem autenticacao', async () => {
    const response = await request(app).delete(`/budgets/${secondBudgetId}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
    expect(await prisma.budget.count({ where: { id: secondBudgetId } })).toBe(1);
  });

  it('impede excluir um orcamento finalizado e preserva seu historico', async () => {
    const itemCountBefore = await prisma.budgetItem.count({
      where: { budgetId: firstBudgetId }
    });
    const response = await agent.delete(`/budgets/${firstBudgetId}`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('BUDGET_NOT_DELETABLE');
    expect(await prisma.budget.count({ where: { id: firstBudgetId } })).toBe(1);
    expect(await prisma.budgetItem.count({ where: { budgetId: firstBudgetId } }))
      .toBe(itemCountBefore);
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

  it('exclui atomicamente um rascunho e seus itens', async () => {
    expect(await prisma.budgetItem.count({ where: { budgetId: secondBudgetId } }))
      .toBeGreaterThan(0);

    const response = await agent.delete(`/budgets/${secondBudgetId}`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
    expect(await prisma.budget.count({ where: { id: secondBudgetId } })).toBe(0);
    expect(await prisma.budgetItem.count({ where: { budgetId: secondBudgetId } })).toBe(0);
  });

  it('responde como nao encontrado ao excluir um orcamento inexistente', async () => {
    const response = await agent.delete('/budgets/00000000-0000-4000-8000-000000000001');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('BUDGET_NOT_FOUND');
  });

  it('serializa a exclusao de rascunho com uma finalizacao concorrente', async () => {
    const project = await agent.post('/projects').send({
      name: 'Projeto em disputa de orcamento',
      applicationType: 'WEBSITE'
    });
    const created = await agent
      .post(`/projects/${project.body.project.id}/budgets`)
      .send({ inputData: completeInput });
    expect(project.status).toBe(201);
    expect(created.status).toBe(201);
    const disputedBudgetId = created.body.budget.id as string;

    const [finalizeResponse, deleteResponse] = await Promise.all([
      agent.post(`/budgets/${disputedBudgetId}/finalize`),
      agent.delete(`/budgets/${disputedBudgetId}`)
    ]);
    const persisted = await prisma.budget.findUnique({
      where: { id: disputedBudgetId },
      include: { items: true }
    });

    if (finalizeResponse.status === 200) {
      expect(deleteResponse.status).toBe(409);
      expect(deleteResponse.body.error.code).toBe('BUDGET_NOT_DELETABLE');
      expect(persisted?.status).toBe('FINALIZADO');
      expect(persisted?.items.length).toBeGreaterThan(0);
    } else {
      expect(deleteResponse.status).toBe(204);
      expect([404, 409]).toContain(finalizeResponse.status);
      expect(['BUDGET_NOT_FOUND', 'BUDGET_NOT_EDITABLE'])
        .toContain(finalizeResponse.body.error.code);
      expect(persisted).toBeNull();
    }
  });

  it('cria um projeto PLATAFORMA_WEB', async () => {
    const response = await agent.post('/projects').send({
      name: 'Plataforma SaaS',
      clientName: 'Cliente Plataforma',
      applicationType: 'PLATAFORMA_WEB'
    });

    expect(response.status).toBe(201);
    expect(response.body.project.applicationType).toBe('PLATAFORMA_WEB');
    platformProjectId = response.body.project.id;
  });

  it('mantem os demais tipos sem precificacao automatica', async () => {
    const project = await agent.post('/projects').send({
      name: 'Loja futura',
      applicationType: 'ECOMMERCE'
    });
    const response = await agent
      .post(`/projects/${project.body.project.id}/budgets`)
      .send({ inputData: { futureField: true } });

    expect(project.status).toBe(201);
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('PRICING_NOT_SUPPORTED');
  });

  it('recusa payloads de um tipo de aplicacao em projetos de outro tipo', async () => {
    const websitePayloadOnPlatform = await agent
      .post(`/projects/${platformProjectId}/budgets`)
      .send({ inputData: completeInput });
    const platformPayloadOnWebsite = await agent
      .post(`/projects/${projectId}/budgets`)
      .send({ inputData: completePlatformInput });

    expect(websitePayloadOnPlatform.status).toBe(400);
    expect(platformPayloadOnWebsite.status).toBe(400);
  });

  it('recusa campos desconhecidos e data de lancamento passada na plataforma', async () => {
    const unknownField = await agent
      .post(`/projects/${platformProjectId}/budgets`)
      .send({
        inputData: {
          ...completePlatformInput,
          estimatedFeatureCount: 12
        }
      });
    const pastLaunchDate = await agent
      .post(`/projects/${platformProjectId}/budgets`)
      .send({
        inputData: {
          ...completePlatformInput,
          targetLaunchDate: '2000-01-01'
        }
      });

    expect(unknownField.status).toBe(400);
    expect(pastLaunchDate.status).toBe(400);
  });

  it('cria orcamento de plataforma somente com configuracoes WEB_PLATFORM', async () => {
    const response = await agent
      .post(`/projects/${platformProjectId}/budgets`)
      .send({ inputData: completePlatformInput });

    expect(response.status).toBe(201);
    expect(response.body.budget.project.applicationType).toBe('PLATAFORMA_WEB');
    expect(response.body.budget.versionNumber).toBe(1);
    expect(response.body.budget.subtotal).toBe('38000.00');
    expect(response.body.budget.complexityMultiplier).toBe('1.2000');
    expect(response.body.budget.urgencyMultiplier).toBe('1.0000');
    expect(response.body.budget.finalTotal).toBe('40920.00');
    expect(response.body.budget.monthlyRecurringTotal).toBe('2000.00');

    const items = response.body.budget.items as Array<{ code: string }>;
    expect(items).toHaveLength(22);
    expect(items.every((item) => item.code.startsWith('WEB_PLATFORM_'))).toBe(true);
    expect(items.map((item) => item.code)).toEqual(expect.arrayContaining([
      'WEB_PLATFORM_BASE_SAAS',
      'WEB_PLATFORM_ACCOUNT_MULTI_ORGANIZATION',
      'WEB_PLATFORM_MODULE_STANDARD',
      'WEB_PLATFORM_PAYMENT_SUBSCRIPTION',
      'WEB_PLATFORM_HOSTING_MJM_MANAGED_MONTHLY'
    ]));

    platformBudgetId = response.body.budget.id;
    platformItems = response.body.budget.items;
  });

  it('mantem o orcamento de plataforma congelado quando seu preco-base muda', async () => {
    await prisma.pricingConfig.update({
      where: { code: 'WEB_PLATFORM_BASE_SAAS' },
      data: { value: 9000 }
    });

    const historical = await agent.get(`/budgets/${platformBudgetId}`);
    expect(historical.status).toBe(200);
    expect(historical.body.budget.finalTotal).toBe('40920.00');
    expect(historical.body.budget.items).toEqual(platformItems);
  });

  it('cria um projeto SISTEMA_INTERNO', async () => {
    const response = await agent.post('/projects').send({
      name: 'Sistema operacional interno',
      clientName: 'Cliente Interno',
      applicationType: 'SISTEMA_INTERNO'
    });

    expect(response.status).toBe(201);
    expect(response.body.project.applicationType).toBe('SISTEMA_INTERNO');
    internalSystemProjectId = response.body.project.id;
  });

  it('recusa escopos de Website, Plataforma Web e Marketplace em Sistema Interno', async () => {
    const websitePayload = await agent
      .post(`/projects/${internalSystemProjectId}/budgets`)
      .send({ inputData: completeInput });
    const platformPayload = await agent
      .post(`/projects/${internalSystemProjectId}/budgets`)
      .send({ inputData: completePlatformInput });
    const marketplacePayload = await agent
      .post(`/projects/${internalSystemProjectId}/budgets`)
      .send({
        inputData: {
          ...completeInternalSystemInput,
          platformCategory: 'MARKETPLACE',
          paymentFeatures: ['MARKETPLACE_SPLIT']
        }
      });

    expect(websitePayload.status).toBe(400);
    expect(platformPayload.status).toBe(400);
    expect(marketplacePayload.status).toBe(400);
  });

  it('cria orcamento de Sistema Interno e congela modulos, integracoes e franquias', async () => {
    const response = await agent
      .post(`/projects/${internalSystemProjectId}/budgets`)
      .send({ inputData: completeInternalSystemInput });

    expect(response.status).toBe(201);
    expect(response.body.budget.project.applicationType).toBe('SISTEMA_INTERNO');
    expect(response.body.budget.status).toBe('RASCUNHO');
    expect(response.body.budget.versionNumber).toBe(1);
    expect(response.body.budget.inputData).toEqual(completeInternalSystemInput);
    expect(response.body.budget.subtotal).toBe('34900.00');
    expect(response.body.budget.complexityMultiplier).toBe('1.2000');
    expect(response.body.budget.urgencyMultiplier).toBe('1.0000');
    expect(response.body.budget.discountPercentage).toBe('10.00');
    expect(response.body.budget.finalTotal).toBe('37572.00');
    expect(response.body.budget.monthlyRecurringTotal).toBe('2000.00');

    const items = response.body.budget.items as Array<{
      code: string;
      name: string;
      description: string | null;
      quantity: number;
      unitPrice: string;
      totalPrice: string;
      recurring: boolean;
      displayOrder: number;
      metadata: unknown;
    }>;
    expect(items).toHaveLength(17);
    expect(items.every((item) => item.code.startsWith('INTERNAL_SYSTEM_'))).toBe(true);
    expect(items.map((item) => item.displayOrder)).toEqual(
      Array.from({ length: items.length }, (_, index) => index)
    );

    const base = items.find((item) => item.code === 'INTERNAL_SYSTEM_BASE');
    expect(base?.metadata).toEqual({
      ...internalSystemBaseMetadata,
      informedAccessProfiles: 4,
      informedDashboards: 2
    });

    const modules = items.filter((item) => item.code.startsWith('INTERNAL_SYSTEM_MODULE_'));
    expect(modules).toHaveLength(3);
    expect(modules.every((item) => item.quantity === 1)).toBe(true);
    expect(modules.find((item) => item.code === 'INTERNAL_SYSTEM_MODULE_STANDARD'))
      .toMatchObject({
        name: expect.stringContaining('Ordens de servico'),
        description: 'Abertura, execucao e encerramento das ordens',
        unitPrice: '2500.00',
        totalPrice: '2500.00'
      });

    const integration = items.find(
      (item) => item.code === 'INTERNAL_SYSTEM_INTEGRATION_STANDARD'
    );
    expect(integration).toMatchObject({
      name: expect.stringContaining('ERP corporativo'),
      description: 'Sincronizacao de estoque e ordens',
      quantity: 1,
      unitPrice: '1200.00'
    });
    expect(items.find((item) => item.code === 'INTERNAL_SYSTEM_DATA_MIGRATION_LEGACY'))
      .toMatchObject({ quantity: 2, totalPrice: '6000.00' });
    expect(items.find(
      (item) => item.code === 'INTERNAL_SYSTEM_HOSTING_MJM_MANAGED_SETUP'
    )?.recurring).toBe(false);
    expect(items.find(
      (item) => item.code === 'INTERNAL_SYSTEM_HOSTING_MJM_MANAGED_MONTHLY'
    )?.recurring).toBe(true);

    internalSystemBudgetId = response.body.budget.id;
    internalSystemItems = response.body.budget.items;
  });

  it('recusa payload de Sistema Interno em projetos Website e Plataforma Web', async () => {
    const onWebsite = await agent
      .post(`/projects/${projectId}/budgets`)
      .send({ inputData: completeInternalSystemInput });
    const onPlatform = await agent
      .post(`/projects/${platformProjectId}/budgets`)
      .send({ inputData: completeInternalSystemInput });

    expect(onWebsite.status).toBe(400);
    expect(onPlatform.status).toBe(400);
  });

  it('edita e recalcula atomicamente o rascunho de Sistema Interno', async () => {
    const editedInput = { ...completeInternalSystemInput, reportCount: 3 };
    const edited = await agent.patch(`/budgets/${internalSystemBudgetId}`).send({
      inputData: editedInput,
      notes: 'Relatorio adicional aprovado'
    });

    expect(edited.status).toBe(200);
    expect(edited.body.budget.status).toBe('RASCUNHO');
    expect(edited.body.budget.inputData.reportCount).toBe(3);
    expect(edited.body.budget.notes).toBe('Relatorio adicional aprovado');
    expect(edited.body.budget.subtotal).toBe('35500.00');
    expect(edited.body.budget.finalTotal).toBe('38220.00');

    await prisma.pricingConfig.update({
      where: { code: 'INTERNAL_SYSTEM_MODULE_SIMPLE' },
      data: { value: 1300 }
    });
    const recalculated = await agent.post(`/budgets/${internalSystemBudgetId}/recalculate`);

    expect(recalculated.status).toBe(200);
    expect(recalculated.body.budget.subtotal).toBe('35600.00');
    expect(recalculated.body.budget.finalTotal).toBe('38328.00');
    expect(recalculated.body.budget.monthlyRecurringTotal).toBe('2000.00');
    const recalculatedItems = recalculated.body.budget.items as Array<{
      code: string;
      unitPrice: string;
    }>;
    expect(recalculatedItems.find(
      (item) => item.code === 'INTERNAL_SYSTEM_MODULE_SIMPLE'
    )?.unitPrice).toBe('1300.00');
  });

  it('finaliza sem recalcular e preserva historico e metadata de Sistema Interno', async () => {
    const beforeFinalize = await agent.get(`/budgets/${internalSystemBudgetId}`);
    expect(beforeFinalize.status).toBe(200);
    const finalizedInputData = beforeFinalize.body.budget.inputData as unknown;

    const finalized = await agent.post(`/budgets/${internalSystemBudgetId}/finalize`);
    expect(finalized.status).toBe(200);
    expect(finalized.body.budget.status).toBe('FINALIZADO');
    expect(finalized.body.budget.items).toEqual(beforeFinalize.body.budget.items);

    await prisma.pricingConfig.update({
      where: { code: 'INTERNAL_SYSTEM_BASE' },
      data: {
        value: 5500,
        metadata: {
          includedAccessProfiles: 3,
          includedDashboards: 2,
          includedFeatures: ['EMAIL_PASSWORD_AUTH']
        }
      }
    });

    const historical = await agent.get(`/budgets/${internalSystemBudgetId}`);
    expect(historical.status).toBe(200);
    expect(historical.body.budget.inputData).toEqual(finalizedInputData);
    expect(historical.body.budget.items).toEqual(beforeFinalize.body.budget.items);
    expect(historical.body.budget.finalTotal).toBe('38328.00');

    const forbiddenUpdate = await agent.patch(`/budgets/${internalSystemBudgetId}`).send({
      notes: 'Alteracao indevida'
    });
    expect(forbiddenUpdate.status).toBe(409);
    expect(forbiddenUpdate.body.error.code).toBe('BUDGET_NOT_EDITABLE');
  });

  it('cria nova versao de Sistema Interno com configuracoes atuais sem alterar a anterior', async () => {
    const created = await agent
      .post(`/projects/${internalSystemProjectId}/budgets`)
      .send({ inputData: completeInternalSystemInput });

    expect(created.status).toBe(201);
    expect(created.body.budget.versionNumber).toBe(2);
    expect(created.body.budget.finalTotal).not.toBe('38328.00');
    expect(created.body.budget.items).not.toEqual(internalSystemItems);

    const historical = await agent.get(`/budgets/${internalSystemBudgetId}`);
    expect(historical.body.budget.versionNumber).toBe(1);
    expect(historical.body.budget.status).toBe('FINALIZADO');
    expect(historical.body.budget.finalTotal).toBe('38328.00');
  });

  it('impede alteracao direta de um orcamento finalizado', async () => {
    const update = await agent.patch(`/budgets/${firstBudgetId}`).send({
      notes: 'Alteracao indevida'
    });
    expect(update.status).toBe(409);
    expect(update.body.error.code).toBe('BUDGET_NOT_EDITABLE');
  });

  it('impede alterar o tipo de um projeto que ja possui orcamentos', async () => {
    const response = await agent.patch(`/projects/${projectId}`).send({
      applicationType: 'PLATAFORMA_WEB'
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('PROJECT_APPLICATION_TYPE_LOCKED');
  });

  it('impede excluir projeto que possui historico de orcamentos', async () => {
    const response = await agent.delete(`/projects/${projectId}`);
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('PROJECT_HAS_BUDGETS');
  });

  it('serializa a criacao de orcamento com a alteracao do tipo do projeto', async () => {
    const created = await agent.post('/projects').send({
      name: 'Projeto em disputa de tipo',
      applicationType: 'WEBSITE'
    });
    expect(created.status).toBe(201);

    const concurrentProjectId = created.body.project.id as string;
    const [budgetResponse, typeChangeResponse] = await Promise.all([
      agent.post(`/projects/${concurrentProjectId}/budgets`).send({ inputData: completeInput }),
      agent.patch(`/projects/${concurrentProjectId}`).send({ applicationType: 'PLATAFORMA_WEB' })
    ]);

    const project = await agent.get(`/projects/${concurrentProjectId}`);
    const budgets = await agent.get(`/projects/${concurrentProjectId}/budgets`);
    expect(project.status).toBe(200);
    expect(budgets.status).toBe(200);

    if (budgetResponse.status === 201) {
      expect(typeChangeResponse.body.error.code).toBe('PROJECT_APPLICATION_TYPE_LOCKED');
      expect(project.body.project.applicationType).toBe('WEBSITE');
      expect(budgets.body.budgets).toHaveLength(1);
    } else {
      expect(typeChangeResponse.status).toBe(200);
      expect([400, 409]).toContain(budgetResponse.status);
      if (budgetResponse.status === 409) {
        expect(budgetResponse.body.error.code).toBe('PROJECT_APPLICATION_TYPE_CHANGED');
      }
      expect(project.body.project.applicationType).toBe('PLATAFORMA_WEB');
      expect(budgets.body.budgets).toHaveLength(0);
    }
  });

  it('serializa a criacao de orcamento com a exclusao do projeto', async () => {
    const created = await agent.post('/projects').send({
      name: 'Projeto em disputa de exclusao',
      applicationType: 'WEBSITE'
    });
    expect(created.status).toBe(201);

    const concurrentProjectId = created.body.project.id as string;
    const [budgetResponse, deleteResponse] = await Promise.all([
      agent.post(`/projects/${concurrentProjectId}/budgets`).send({ inputData: completeInput }),
      agent.delete(`/projects/${concurrentProjectId}`)
    ]);

    if (budgetResponse.status === 201) {
      expect(deleteResponse.status).toBe(409);
      expect(deleteResponse.body.error.code).toBe('PROJECT_HAS_BUDGETS');

      const project = await agent.get(`/projects/${concurrentProjectId}`);
      const budgets = await agent.get(`/projects/${concurrentProjectId}/budgets`);
      expect(project.status).toBe(200);
      expect(budgets.body.budgets).toHaveLength(1);
    } else {
      expect(budgetResponse.status).toBe(404);
      expect(budgetResponse.body.error.code).toBe('PROJECT_NOT_FOUND');
      expect(deleteResponse.status).toBe(204);

      const project = await agent.get(`/projects/${concurrentProjectId}`);
      expect(project.status).toBe(404);
    }
  });
});
