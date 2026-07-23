import argon2 from 'argon2';
import {
  ApplicationType,
  PricingConfigType,
  PrismaClient,
  UserRole
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';
import { internalSystemRequiredPricingCodes } from '../src/modules/pricing/internal-system-pricing.js';

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

interface InternalSystemPricingSeedEntry {
  applicationType: ApplicationType;
  code: string;
  name: string;
  category: string;
  configType: PricingConfigType;
  value: string;
  metadata?: Prisma.InputJsonObject;
}

const internalSystemBaseMetadata = {
  includedAccessProfiles: 2,
  includedDashboards: 1,
  includedFeatures: [
    'EMAIL_PASSWORD_AUTH',
    'STANDARD_ROLES',
    'BASIC_ADMINISTRATION',
    'IN_APP_NOTIFICATIONS'
  ]
} satisfies Prisma.InputJsonObject;

const internalSystemPricingConfigs = [
  {
    applicationType: ApplicationType.SISTEMA_INTERNO,
    code: 'INTERNAL_SYSTEM_BASE',
    name: 'Base de sistema interno',
    category: 'BASE',
    configType: PricingConfigType.FIXED_VALUE,
    value: '5000',
    metadata: internalSystemBaseMetadata
  },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_MODULE_SIMPLE', name: 'Modulo simples', category: 'MODULOS', configType: PricingConfigType.UNIT_VALUE, value: '1200' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_MODULE_STANDARD', name: 'Modulo padrao', category: 'MODULOS', configType: PricingConfigType.UNIT_VALUE, value: '2500' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_MODULE_COMPLEX', name: 'Modulo complexo', category: 'MODULOS', configType: PricingConfigType.UNIT_VALUE, value: '4500' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_EXTRA_ACCESS_PROFILE', name: 'Perfil de acesso adicional', category: 'ACESSO', configType: PricingConfigType.UNIT_VALUE, value: '400' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_CUSTOM_PERMISSIONS', name: 'Permissoes personalizadas', category: 'ACESSO', configType: PricingConfigType.FIXED_VALUE, value: '2000' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_AUTH_MFA', name: 'Autenticacao multifator', category: 'AUTENTICACAO', configType: PricingConfigType.FIXED_VALUE, value: '1500' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_AUTH_CORPORATE_SSO', name: 'SSO corporativo', category: 'AUTENTICACAO', configType: PricingConfigType.FIXED_VALUE, value: '3500' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_WORKFLOW_SIMPLE', name: 'Workflow simples', category: 'PROCESSOS', configType: PricingConfigType.FIXED_VALUE, value: '1200' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_WORKFLOW_CUSTOM', name: 'Workflow personalizado', category: 'PROCESSOS', configType: PricingConfigType.FIXED_VALUE, value: '3000' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_DOCUMENT_BASIC_ATTACHMENTS', name: 'Anexos basicos', category: 'DOCUMENTOS', configType: PricingConfigType.FIXED_VALUE, value: '800' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_DOCUMENT_WORKFLOW', name: 'Fluxo documental', category: 'DOCUMENTOS', configType: PricingConfigType.FIXED_VALUE, value: '2500' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_EXTRA_DASHBOARD', name: 'Dashboard adicional', category: 'ANALISE', configType: PricingConfigType.UNIT_VALUE, value: '1200' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_REPORT', name: 'Relatorio', category: 'ANALISE', configType: PricingConfigType.UNIT_VALUE, value: '600' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_NOTIFICATION_EMAIL', name: 'Notificacoes por e-mail', category: 'NOTIFICACOES', configType: PricingConfigType.FIXED_VALUE, value: '800' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_NOTIFICATION_WHATSAPP_SMS', name: 'Notificacoes por WhatsApp ou SMS', category: 'NOTIFICACOES', configType: PricingConfigType.FIXED_VALUE, value: '1500' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_INTEGRATION_SIMPLE', name: 'Integracao simples', category: 'INTEGRACOES', configType: PricingConfigType.UNIT_VALUE, value: '500' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_INTEGRATION_STANDARD', name: 'Integracao padrao', category: 'INTEGRACOES', configType: PricingConfigType.UNIT_VALUE, value: '1200' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_INTEGRATION_COMPLEX', name: 'Integracao complexa', category: 'INTEGRACOES', configType: PricingConfigType.UNIT_VALUE, value: '2500' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_DATA_MIGRATION_STRUCTURED_IMPORT', name: 'Importacao estruturada', category: 'MIGRACAO', configType: PricingConfigType.UNIT_VALUE, value: '1000' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_DATA_MIGRATION_LEGACY', name: 'Migracao de sistema legado', category: 'MIGRACAO', configType: PricingConfigType.UNIT_VALUE, value: '3000' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_HOSTING_MJM_STANDARD_SETUP', name: 'Implantacao em hospedagem padrao', category: 'HOSPEDAGEM', configType: PricingConfigType.FIXED_VALUE, value: '800' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_HOSTING_MJM_MANAGED_SETUP', name: 'Implantacao em hospedagem gerenciada', category: 'HOSPEDAGEM', configType: PricingConfigType.FIXED_VALUE, value: '1500' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_HOSTING_MJM_STANDARD_MONTHLY', name: 'Hospedagem padrao mensal', category: 'HOSPEDAGEM', configType: PricingConfigType.FIXED_VALUE, value: '500' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_HOSTING_MJM_MANAGED_MONTHLY', name: 'Hospedagem gerenciada mensal', category: 'HOSPEDAGEM', configType: PricingConfigType.FIXED_VALUE, value: '1000' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_MAINTENANCE_ESSENTIAL_MONTHLY', name: 'Manutencao essencial mensal', category: 'MANUTENCAO', configType: PricingConfigType.FIXED_VALUE, value: '500' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_MAINTENANCE_STANDARD_MONTHLY', name: 'Manutencao padrao mensal', category: 'MANUTENCAO', configType: PricingConfigType.FIXED_VALUE, value: '1000' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_MAINTENANCE_CUSTOM_MONTHLY', name: 'Manutencao personalizada mensal', category: 'MANUTENCAO', configType: PricingConfigType.FIXED_VALUE, value: '2000' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_COMPLEXITY_NONE', name: 'Sem ajuste de complexidade', category: 'COMPLEXIDADE', configType: PricingConfigType.MULTIPLIER, value: '1' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_COMPLEXITY_MODERATE', name: 'Complexidade moderada', category: 'COMPLEXIDADE', configType: PricingConfigType.MULTIPLIER, value: '1.2' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_COMPLEXITY_HIGH', name: 'Complexidade alta', category: 'COMPLEXIDADE', configType: PricingConfigType.MULTIPLIER, value: '1.5' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_URGENCY_NORMAL', name: 'Urgencia normal', category: 'URGENCIA', configType: PricingConfigType.MULTIPLIER, value: '1' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_URGENCY_PRIORITY', name: 'Urgencia prioridade', category: 'URGENCIA', configType: PricingConfigType.MULTIPLIER, value: '1.3' },
  { applicationType: ApplicationType.SISTEMA_INTERNO, code: 'INTERNAL_SYSTEM_URGENCY_EXPRESS', name: 'Urgencia expressa', category: 'URGENCIA', configType: PricingConfigType.MULTIPLIER, value: '1.6' }
] satisfies InternalSystemPricingSeedEntry[];

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

function assertUniquePricingCodes(): void {
  const codes = [
    ...pricingConfigs.map(([, code]) => code),
    ...internalSystemPricingConfigs.map((config) => config.code)
  ];
  if (new Set(codes).size !== codes.length) {
    throw new Error('Existem codigos de configuracao de preco duplicados no seed');
  }
}

function assertInternalSystemPricingSeed(): void {
  const seedCodes = new Set(internalSystemPricingConfigs.map((config) => config.code));
  const missingCodes = internalSystemRequiredPricingCodes.filter((code) => !seedCodes.has(code));
  if (missingCodes.length > 0) {
    throw new Error(
      `Configuracoes consumidas pelo motor ausentes no seed: ${missingCodes.join(', ')}`
    );
  }

  const baseConfig = internalSystemPricingConfigs.find(
    (config) => config.code === 'INTERNAL_SYSTEM_BASE'
  );
  if (baseConfig === undefined || !('metadata' in baseConfig)) {
    throw new Error('INTERNAL_SYSTEM_BASE deve possuir metadata de franquias');
  }

  const includedFeatures = baseConfig.metadata.includedFeatures;
  if (
    baseConfig.metadata.includedAccessProfiles !== 2
    || baseConfig.metadata.includedDashboards !== 1
    || !Array.isArray(includedFeatures)
    || includedFeatures.length === 0
    || !includedFeatures.every(
      (feature) => typeof feature === 'string' && feature.trim().length > 0
    )
  ) {
    throw new Error('Metadata de franquias invalido em INTERNAL_SYSTEM_BASE');
  }

  const existingApplicationTypes = new Set(
    pricingConfigs.map(([applicationType]) => applicationType)
  );
  if (
    !existingApplicationTypes.has(ApplicationType.WEBSITE)
    || !existingApplicationTypes.has(ApplicationType.PLATAFORMA_WEB)
  ) {
    throw new Error('O seed deve preservar as configuracoes de Website e Plataforma Web');
  }
}

async function main(): Promise<void> {
  assertUniquePricingCodes();
  assertInternalSystemPricingSeed();

  const passwordHash = await argon2.hash(seedEnv.SEED_ADMIN_PASSWORD, {
    type: argon2.argon2id
  });

  await prisma.$transaction(async (transaction) => {
    await transaction.user.upsert({
      where: { email: seedEnv.SEED_ADMIN_EMAIL },
      update: {},
      create: {
        name: seedEnv.SEED_ADMIN_NAME,
        email: seedEnv.SEED_ADMIN_EMAIL,
        passwordHash,
        role: UserRole.ADMIN,
        active: true
      }
    });

    await transaction.pricingConfig.updateMany({
      where: { code: { in: [...legacyPricingCodes] } },
      data: { active: false }
    });

    for (const [applicationType, code, name, category, configType, value] of pricingConfigs) {
      await transaction.pricingConfig.upsert({
        where: { code },
        update: {
          name,
          applicationType,
          category,
          configType
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

    for (const config of internalSystemPricingConfigs) {
      await transaction.pricingConfig.upsert({
        where: { code: config.code },
        update: {
          name: config.name,
          applicationType: config.applicationType,
          category: config.category,
          configType: config.configType
        },
        create: {
          code: config.code,
          name: config.name,
          applicationType: config.applicationType,
          category: config.category,
          configType: config.configType,
          value: config.value,
          active: true,
          ...('metadata' in config ? { metadata: config.metadata } : {})
        }
      });
    }
  });

  console.info(`Administrador preparado: ${seedEnv.SEED_ADMIN_EMAIL}`);
  console.info(
    `${pricingConfigs.length + internalSystemPricingConfigs.length} configuracoes de preco preparadas`
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
