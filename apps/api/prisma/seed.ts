import argon2 from 'argon2';
import {
  ApplicationType,
  PricingConfigType,
  PrismaClient,
  UserRole
} from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

config({
  path: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')]
});

const seedEnvSchema = z.object({
  SEED_ADMIN_NAME: z.string().trim().min(1),
  SEED_ADMIN_EMAIL: z.string().trim().email().transform((value) => value.toLowerCase()),
  SEED_ADMIN_PASSWORD: z.string().min(6).max(200)
});

const seedEnv = seedEnvSchema.parse(process.env);
const prisma = new PrismaClient();

const pricingConfigs = [
  [ApplicationType.WEBSITE, 'WEBSITE_BASE_LANDING_PAGE', 'Base landing page', 'BASE', PricingConfigType.FIXED_VALUE, '2500'],
  [ApplicationType.WEBSITE, 'WEBSITE_BASE_INSTITUCIONAL', 'Base website institucional', 'BASE', PricingConfigType.FIXED_VALUE, '2800'],
  [ApplicationType.WEBSITE, 'WEBSITE_BASE_PORTAL_CONTEUDO', 'Base portal de conteudo', 'BASE', PricingConfigType.FIXED_VALUE, '3000'],
  [ApplicationType.WEBSITE, 'WEBSITE_EXTRA_SECTION', 'Secao adicional', 'ESTRUTURA', PricingConfigType.UNIT_VALUE, '300'],
  [ApplicationType.WEBSITE, 'WEBSITE_EXTRA_PAGE', 'Pagina adicional', 'PAGINAS', PricingConfigType.UNIT_VALUE, '300'],
  [ApplicationType.WEBSITE, 'WEBSITE_UNIQUE_LAYOUT', 'Layout unico', 'ESTRUTURA', PricingConfigType.UNIT_VALUE, '400'],
  [ApplicationType.WEBSITE, 'WEBSITE_DESIGN_CLIENT_PROVIDED', 'Design fornecido pelo cliente', 'DESIGN', PricingConfigType.FIXED_VALUE, '0'],
  [ApplicationType.WEBSITE, 'WEBSITE_DESIGN_TEMPLATE_CUSTOMIZATION', 'Adaptacao de template', 'DESIGN', PricingConfigType.FIXED_VALUE, '200'],
  [ApplicationType.WEBSITE, 'WEBSITE_DESIGN_CUSTOM', 'Design personalizado', 'DESIGN', PricingConfigType.FIXED_VALUE, '1000'],
  [ApplicationType.WEBSITE, 'WEBSITE_CONTENT_MIGRATION', 'Migracao de conteudo', 'CONTEUDO', PricingConfigType.UNIT_VALUE, '100'],
  [ApplicationType.WEBSITE, 'WEBSITE_CONTENT_PRODUCTION', 'Producao de conteudo', 'CONTEUDO', PricingConfigType.UNIT_VALUE, '250'],
  [ApplicationType.WEBSITE, 'WEBSITE_EXTRA_LANGUAGE', 'Idioma adicional', 'CONTEUDO', PricingConfigType.UNIT_VALUE, '800'],
  [ApplicationType.WEBSITE, 'WEBSITE_CMS_STANDARD', 'CMS padrao', 'CMS', PricingConfigType.FIXED_VALUE, '1000'],
  [ApplicationType.WEBSITE, 'WEBSITE_CMS_CUSTOM', 'Painel administrativo personalizado', 'CMS', PricingConfigType.FIXED_VALUE, '3000'],
  [ApplicationType.WEBSITE, 'WEBSITE_FORM_SIMPLE', 'Formulario simples', 'FORMULARIOS', PricingConfigType.UNIT_VALUE, '300'],
  [ApplicationType.WEBSITE, 'WEBSITE_FORM_ADVANCED', 'Formulario avancado', 'FORMULARIOS', PricingConfigType.UNIT_VALUE, '800'],
  [ApplicationType.WEBSITE, 'WEBSITE_INTEGRATION_SIMPLE', 'Integracao simples', 'INTEGRACOES', PricingConfigType.UNIT_VALUE, '300'],
  [ApplicationType.WEBSITE, 'WEBSITE_INTEGRATION_STANDARD', 'Integracao padrao', 'INTEGRACOES', PricingConfigType.UNIT_VALUE, '800'],
  [ApplicationType.WEBSITE, 'WEBSITE_INTEGRATION_COMPLEX', 'Integracao complexa', 'INTEGRACOES', PricingConfigType.UNIT_VALUE, '1600'],
  [ApplicationType.WEBSITE, 'WEBSITE_MODULE_BLOG', 'Modulo de blog', 'MODULOS', PricingConfigType.FIXED_VALUE, '1000'],
  [ApplicationType.WEBSITE, 'WEBSITE_MODULE_SITE_SEARCH', 'Busca interna', 'MODULOS', PricingConfigType.FIXED_VALUE, '800'],
  [ApplicationType.WEBSITE, 'WEBSITE_SEO_TECHNICAL_BASELINE', 'SEO tecnico essencial', 'SEO', PricingConfigType.FIXED_VALUE, '0'],
  [ApplicationType.WEBSITE, 'WEBSITE_SEO_ON_PAGE_SETUP', 'Configuracao de SEO on-page', 'SEO', PricingConfigType.FIXED_VALUE, '600'],
  [ApplicationType.WEBSITE, 'WEBSITE_SEO_CONTENT_STRATEGY', 'Estrategia de conteudo para SEO', 'SEO', PricingConfigType.FIXED_VALUE, '1500'],
  [ApplicationType.WEBSITE, 'WEBSITE_DOMAIN_NEW_REGISTRATION', 'Registro de novo dominio', 'DOMINIO', PricingConfigType.FIXED_VALUE, '200'],
  [ApplicationType.WEBSITE, 'WEBSITE_DOMAIN_TRANSFER', 'Transferencia de dominio', 'DOMINIO', PricingConfigType.FIXED_VALUE, '300'],
  [ApplicationType.WEBSITE, 'WEBSITE_DOMAIN_CONFIGURATION_ONLY', 'Configuracao de dominio', 'DOMINIO', PricingConfigType.FIXED_VALUE, '150'],
  [ApplicationType.WEBSITE, 'WEBSITE_HOSTING_MJM_STANDARD_SETUP', 'Implantacao em hospedagem padrao', 'HOSPEDAGEM', PricingConfigType.FIXED_VALUE, '500'],
  [ApplicationType.WEBSITE, 'WEBSITE_HOSTING_MJM_STANDARD_MONTHLY', 'Hospedagem padrao mensal', 'HOSPEDAGEM', PricingConfigType.FIXED_VALUE, '250'],
  [ApplicationType.WEBSITE, 'WEBSITE_HOSTING_MJM_MANAGED_SETUP', 'Implantacao em hospedagem gerenciada', 'HOSPEDAGEM', PricingConfigType.FIXED_VALUE, '800'],
  [ApplicationType.WEBSITE, 'WEBSITE_HOSTING_MJM_MANAGED_MONTHLY', 'Hospedagem gerenciada mensal', 'HOSPEDAGEM', PricingConfigType.FIXED_VALUE, '500'],
  [ApplicationType.WEBSITE, 'WEBSITE_MAINTENANCE_ESSENTIAL_MONTHLY', 'Manutencao essencial mensal', 'MANUTENCAO', PricingConfigType.FIXED_VALUE, '250'],
  [ApplicationType.WEBSITE, 'WEBSITE_MAINTENANCE_STANDARD_MONTHLY', 'Manutencao padrao mensal', 'MANUTENCAO', PricingConfigType.FIXED_VALUE, '500'],
  [ApplicationType.WEBSITE, 'WEBSITE_MAINTENANCE_CUSTOM_MONTHLY', 'Manutencao personalizada mensal', 'MANUTENCAO', PricingConfigType.FIXED_VALUE, '1000'],
  [ApplicationType.WEBSITE, 'WEBSITE_COMPLEXITY_NONE', 'Sem ajuste de complexidade', 'COMPLEXIDADE', PricingConfigType.MULTIPLIER, '1'],
  [ApplicationType.WEBSITE, 'WEBSITE_COMPLEXITY_MODERATE', 'Complexidade moderada', 'COMPLEXIDADE', PricingConfigType.MULTIPLIER, '1.2'],
  [ApplicationType.WEBSITE, 'WEBSITE_COMPLEXITY_HIGH', 'Complexidade alta', 'COMPLEXIDADE', PricingConfigType.MULTIPLIER, '1.5'],
  [ApplicationType.WEBSITE, 'WEBSITE_URGENCY_NORMAL', 'Urgencia normal', 'URGENCIA', PricingConfigType.MULTIPLIER, '1'],
  [ApplicationType.WEBSITE, 'WEBSITE_URGENCY_PRIORITY', 'Urgencia prioridade', 'URGENCIA', PricingConfigType.MULTIPLIER, '1.3'],
  [ApplicationType.WEBSITE, 'WEBSITE_URGENCY_EXPRESS', 'Urgencia expressa', 'URGENCIA', PricingConfigType.MULTIPLIER, '1.6'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_BASE_CLIENT_PORTAL', 'Base portal do cliente', 'BASE', PricingConfigType.FIXED_VALUE, '6000'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_BASE_SAAS', 'Base plataforma SaaS', 'BASE', PricingConfigType.FIXED_VALUE, '8000'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_BASE_MARKETPLACE', 'Base marketplace', 'BASE', PricingConfigType.FIXED_VALUE, '10000'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_BASE_MEMBERSHIP_PLATFORM', 'Base plataforma de membros', 'BASE', PricingConfigType.FIXED_VALUE, '6500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_BASE_CUSTOM', 'Base plataforma personalizada', 'BASE', PricingConfigType.FIXED_VALUE, '8000'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_ACCOUNT_SINGLE_ORGANIZATION', 'Organizacao unica', 'CONTAS', PricingConfigType.FIXED_VALUE, '0'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_ACCOUNT_MULTI_ORGANIZATION', 'Multiplas organizacoes', 'CONTAS', PricingConfigType.FIXED_VALUE, '3500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_DESIGN_CLIENT_PROVIDED', 'Design fornecido pelo cliente', 'DESIGN', PricingConfigType.FIXED_VALUE, '0'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_DESIGN_SYSTEM_ADAPTATION', 'Adaptacao de design system', 'DESIGN', PricingConfigType.FIXED_VALUE, '1500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_DESIGN_CUSTOM', 'Design personalizado', 'DESIGN', PricingConfigType.FIXED_VALUE, '3000'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_EXTRA_SCREEN_CLIENT_PROVIDED', 'Tela adicional com design fornecido', 'TELAS', PricingConfigType.UNIT_VALUE, '0'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_EXTRA_SCREEN_DESIGN_SYSTEM_ADAPTATION', 'Tela adicional com adaptacao de design system', 'TELAS', PricingConfigType.UNIT_VALUE, '250'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_EXTRA_SCREEN_CUSTOM_DESIGN', 'Tela adicional com design personalizado', 'TELAS', PricingConfigType.UNIT_VALUE, '500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_EXTRA_USER_ROLE', 'Perfil de usuario adicional', 'ACESSO', PricingConfigType.UNIT_VALUE, '400'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_EXTRA_LANGUAGE', 'Idioma adicional', 'CONTEUDO', PricingConfigType.UNIT_VALUE, '800'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_MODULE_SIMPLE', 'Modulo funcional simples', 'MODULOS', PricingConfigType.UNIT_VALUE, '1200'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_MODULE_STANDARD', 'Modulo funcional padrao', 'MODULOS', PricingConfigType.UNIT_VALUE, '2500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_MODULE_COMPLEX', 'Modulo funcional complexo', 'MODULOS', PricingConfigType.UNIT_VALUE, '4500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_BACKOFFICE_STANDARD', 'Backoffice padrao', 'BACKOFFICE', PricingConfigType.FIXED_VALUE, '2000'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_BACKOFFICE_CUSTOM', 'Backoffice personalizado', 'BACKOFFICE', PricingConfigType.FIXED_VALUE, '4500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_DASHBOARD', 'Dashboard', 'ANALISE', PricingConfigType.UNIT_VALUE, '1200'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_REPORT', 'Relatorio', 'ANALISE', PricingConfigType.UNIT_VALUE, '600'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_AUTH_SOCIAL_LOGIN', 'Login social', 'AUTENTICACAO', PricingConfigType.FIXED_VALUE, '800'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_AUTH_MFA', 'Autenticacao multifator', 'AUTENTICACAO', PricingConfigType.FIXED_VALUE, '1500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_AUTH_SSO', 'SSO corporativo', 'AUTENTICACAO', PricingConfigType.FIXED_VALUE, '3500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_PAYMENT_ONE_TIME', 'Pagamento unico', 'PAGAMENTOS', PricingConfigType.FIXED_VALUE, '1800'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_PAYMENT_SUBSCRIPTION', 'Assinatura recorrente', 'PAGAMENTOS', PricingConfigType.FIXED_VALUE, '3000'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_PAYMENT_MARKETPLACE_SPLIT', 'Split de marketplace', 'PAGAMENTOS', PricingConfigType.FIXED_VALUE, '6000'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_NOTIFICATION_IN_APP', 'Notificacoes no aplicativo', 'NOTIFICACOES', PricingConfigType.FIXED_VALUE, '700'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_NOTIFICATION_EMAIL', 'Notificacoes por e-mail', 'NOTIFICACOES', PricingConfigType.FIXED_VALUE, '800'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_NOTIFICATION_WHATSAPP_SMS', 'Notificacoes por WhatsApp ou SMS', 'NOTIFICACOES', PricingConfigType.FIXED_VALUE, '1500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_FILE_BASIC_UPLOADS', 'Upload basico de arquivos', 'ARQUIVOS', PricingConfigType.FIXED_VALUE, '800'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_FILE_DOCUMENT_WORKFLOW', 'Fluxo de documentos', 'ARQUIVOS', PricingConfigType.FIXED_VALUE, '2500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_AUDIT_BASIC', 'Auditoria basica', 'AUDITORIA', PricingConfigType.FIXED_VALUE, '800'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_AUDIT_COMPLETE', 'Auditoria completa', 'AUDITORIA', PricingConfigType.FIXED_VALUE, '2500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_INTEGRATION_SIMPLE', 'Integracao simples', 'INTEGRACOES', PricingConfigType.UNIT_VALUE, '500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_INTEGRATION_STANDARD', 'Integracao padrao', 'INTEGRACOES', PricingConfigType.UNIT_VALUE, '1200'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_INTEGRATION_COMPLEX', 'Integracao complexa', 'INTEGRACOES', PricingConfigType.UNIT_VALUE, '2500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_DATA_MIGRATION_STRUCTURED_IMPORT', 'Importacao estruturada', 'MIGRACAO', PricingConfigType.UNIT_VALUE, '1000'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_DATA_MIGRATION_LEGACY_MIGRATION', 'Migracao de sistema legado', 'MIGRACAO', PricingConfigType.UNIT_VALUE, '3000'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_HOSTING_MJM_STANDARD_SETUP', 'Implantacao em hospedagem padrao', 'HOSPEDAGEM', PricingConfigType.FIXED_VALUE, '800'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_HOSTING_MJM_STANDARD_MONTHLY', 'Hospedagem padrao mensal', 'HOSPEDAGEM', PricingConfigType.FIXED_VALUE, '500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_HOSTING_MJM_MANAGED_SETUP', 'Implantacao em hospedagem gerenciada', 'HOSPEDAGEM', PricingConfigType.FIXED_VALUE, '1500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_HOSTING_MJM_MANAGED_MONTHLY', 'Hospedagem gerenciada mensal', 'HOSPEDAGEM', PricingConfigType.FIXED_VALUE, '1000'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_MAINTENANCE_ESSENTIAL_MONTHLY', 'Manutencao essencial mensal', 'MANUTENCAO', PricingConfigType.FIXED_VALUE, '500'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_MAINTENANCE_STANDARD_MONTHLY', 'Manutencao padrao mensal', 'MANUTENCAO', PricingConfigType.FIXED_VALUE, '1000'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_MAINTENANCE_CUSTOM_MONTHLY', 'Manutencao personalizada mensal', 'MANUTENCAO', PricingConfigType.FIXED_VALUE, '2000'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_COMPLEXITY_NONE', 'Sem ajuste de complexidade', 'COMPLEXIDADE', PricingConfigType.MULTIPLIER, '1'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_COMPLEXITY_MODERATE', 'Complexidade moderada', 'COMPLEXIDADE', PricingConfigType.MULTIPLIER, '1.2'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_COMPLEXITY_HIGH', 'Complexidade alta', 'COMPLEXIDADE', PricingConfigType.MULTIPLIER, '1.5'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_URGENCY_NORMAL', 'Urgencia normal', 'URGENCIA', PricingConfigType.MULTIPLIER, '1'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_URGENCY_PRIORITY', 'Urgencia prioridade', 'URGENCIA', PricingConfigType.MULTIPLIER, '1.3'],
  [ApplicationType.PLATAFORMA_WEB, 'WEB_PLATFORM_URGENCY_EXPRESS', 'Urgencia expressa', 'URGENCIA', PricingConfigType.MULTIPLIER, '1.6']
] as const;

const legacyPricingCodes = [
  'WEBSITE_BASE_BLOG',
  'WEBSITE_BASE_ECOMMERCE',
  'WEBSITE_BASE_PLATAFORMA',
  'WEBSITE_DESIGN_TEMPLATE',
  'WEBSITE_DEVELOPMENT_FRONTEND',
  'WEBSITE_DEVELOPMENT_FULLSTACK',
  'WEBSITE_ADMIN_PANEL',
  'WEBSITE_INTEGRATION',
  'WEBSITE_PAYMENT_SYSTEM',
  'WEBSITE_BLOG',
  'WEBSITE_BASIC_SEO',
  'WEBSITE_DOMAIN',
  'WEBSITE_HOSTING',
  'WEBSITE_COMPLEXITY_SIMPLE',
  'WEBSITE_COMPLEXITY_MEDIUM',
  'WEBSITE_COMPLEXITY_COMPLEX'
] as const;

async function main(): Promise<void> {
  const passwordHash = await argon2.hash(seedEnv.SEED_ADMIN_PASSWORD, {
    type: argon2.argon2id
  });

  await prisma.user.upsert({
    where: { email: seedEnv.SEED_ADMIN_EMAIL },
    update: {
      name: seedEnv.SEED_ADMIN_NAME,
      passwordHash,
      role: UserRole.ADMIN,
      active: true
    },
    create: {
      name: seedEnv.SEED_ADMIN_NAME,
      email: seedEnv.SEED_ADMIN_EMAIL,
      passwordHash,
      role: UserRole.ADMIN,
      active: true
    }
  });

  await prisma.pricingConfig.updateMany({
    where: { code: { in: [...legacyPricingCodes] } },
    data: { active: false }
  });

  for (const [applicationType, code, name, category, configType, value] of pricingConfigs) {
    await prisma.pricingConfig.upsert({
      where: { code },
      update: {
        name,
        applicationType,
        category,
        configType,
        active: true
      },
      create: {
        code,
        name,
        applicationType,
        category,
        configType,
        value,
        active: true
      }
    });
  }

  console.info(`Administrador preparado: ${seedEnv.SEED_ADMIN_EMAIL}`);
  console.info(`${pricingConfigs.length} configuracoes de preco preparadas`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
