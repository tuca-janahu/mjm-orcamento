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
  ['WEBSITE_BASE_LANDING_PAGE', 'Base landing page', 'BASE', PricingConfigType.FIXED_VALUE, '2500'],
  ['WEBSITE_BASE_INSTITUCIONAL', 'Base website institucional', 'BASE', PricingConfigType.FIXED_VALUE, '2800'],
  ['WEBSITE_BASE_PORTAL_CONTEUDO', 'Base portal de conteudo', 'BASE', PricingConfigType.FIXED_VALUE, '3000'],
  ['WEBSITE_EXTRA_SECTION', 'Secao adicional', 'ESTRUTURA', PricingConfigType.UNIT_VALUE, '300'],
  ['WEBSITE_EXTRA_PAGE', 'Pagina adicional', 'PAGINAS', PricingConfigType.UNIT_VALUE, '300'],
  ['WEBSITE_UNIQUE_LAYOUT', 'Layout unico', 'ESTRUTURA', PricingConfigType.UNIT_VALUE, '400'],
  ['WEBSITE_DESIGN_CLIENT_PROVIDED', 'Design fornecido pelo cliente', 'DESIGN', PricingConfigType.FIXED_VALUE, '0'],
  ['WEBSITE_DESIGN_TEMPLATE_CUSTOMIZATION', 'Adaptacao de template', 'DESIGN', PricingConfigType.FIXED_VALUE, '200'],
  ['WEBSITE_DESIGN_CUSTOM', 'Design personalizado', 'DESIGN', PricingConfigType.FIXED_VALUE, '1000'],
  ['WEBSITE_CONTENT_MIGRATION', 'Migracao de conteudo', 'CONTEUDO', PricingConfigType.UNIT_VALUE, '100'],
  ['WEBSITE_CONTENT_PRODUCTION', 'Producao de conteudo', 'CONTEUDO', PricingConfigType.UNIT_VALUE, '250'],
  ['WEBSITE_EXTRA_LANGUAGE', 'Idioma adicional', 'CONTEUDO', PricingConfigType.UNIT_VALUE, '800'],
  ['WEBSITE_CMS_STANDARD', 'CMS padrao', 'CMS', PricingConfigType.FIXED_VALUE, '1000'],
  ['WEBSITE_CMS_CUSTOM', 'Painel administrativo personalizado', 'CMS', PricingConfigType.FIXED_VALUE, '3000'],
  ['WEBSITE_FORM_SIMPLE', 'Formulario simples', 'FORMULARIOS', PricingConfigType.UNIT_VALUE, '300'],
  ['WEBSITE_FORM_ADVANCED', 'Formulario avancado', 'FORMULARIOS', PricingConfigType.UNIT_VALUE, '800'],
  ['WEBSITE_INTEGRATION_SIMPLE', 'Integracao simples', 'INTEGRACOES', PricingConfigType.UNIT_VALUE, '300'],
  ['WEBSITE_INTEGRATION_STANDARD', 'Integracao padrao', 'INTEGRACOES', PricingConfigType.UNIT_VALUE, '800'],
  ['WEBSITE_INTEGRATION_COMPLEX', 'Integracao complexa', 'INTEGRACOES', PricingConfigType.UNIT_VALUE, '1600'],
  ['WEBSITE_MODULE_BLOG', 'Modulo de blog', 'MODULOS', PricingConfigType.FIXED_VALUE, '1000'],
  ['WEBSITE_MODULE_SITE_SEARCH', 'Busca interna', 'MODULOS', PricingConfigType.FIXED_VALUE, '800'],
  ['WEBSITE_SEO_TECHNICAL_BASELINE', 'SEO tecnico essencial', 'SEO', PricingConfigType.FIXED_VALUE, '0'],
  ['WEBSITE_SEO_ON_PAGE_SETUP', 'Configuracao de SEO on-page', 'SEO', PricingConfigType.FIXED_VALUE, '600'],
  ['WEBSITE_SEO_CONTENT_STRATEGY', 'Estrategia de conteudo para SEO', 'SEO', PricingConfigType.FIXED_VALUE, '1500'],
  ['WEBSITE_DOMAIN_NEW_REGISTRATION', 'Registro de novo dominio', 'DOMINIO', PricingConfigType.FIXED_VALUE, '200'],
  ['WEBSITE_DOMAIN_TRANSFER', 'Transferencia de dominio', 'DOMINIO', PricingConfigType.FIXED_VALUE, '300'],
  ['WEBSITE_DOMAIN_CONFIGURATION_ONLY', 'Configuracao de dominio', 'DOMINIO', PricingConfigType.FIXED_VALUE, '150'],
  ['WEBSITE_HOSTING_MJM_STANDARD_SETUP', 'Implantacao em hospedagem padrao', 'HOSPEDAGEM', PricingConfigType.FIXED_VALUE, '500'],
  ['WEBSITE_HOSTING_MJM_STANDARD_MONTHLY', 'Hospedagem padrao mensal', 'HOSPEDAGEM', PricingConfigType.FIXED_VALUE, '250'],
  ['WEBSITE_HOSTING_MJM_MANAGED_SETUP', 'Implantacao em hospedagem gerenciada', 'HOSPEDAGEM', PricingConfigType.FIXED_VALUE, '800'],
  ['WEBSITE_HOSTING_MJM_MANAGED_MONTHLY', 'Hospedagem gerenciada mensal', 'HOSPEDAGEM', PricingConfigType.FIXED_VALUE, '500'],
  ['WEBSITE_MAINTENANCE_ESSENTIAL_MONTHLY', 'Manutencao essencial mensal', 'MANUTENCAO', PricingConfigType.FIXED_VALUE, '250'],
  ['WEBSITE_MAINTENANCE_STANDARD_MONTHLY', 'Manutencao padrao mensal', 'MANUTENCAO', PricingConfigType.FIXED_VALUE, '500'],
  ['WEBSITE_MAINTENANCE_CUSTOM_MONTHLY', 'Manutencao personalizada mensal', 'MANUTENCAO', PricingConfigType.FIXED_VALUE, '1000'],
  ['WEBSITE_COMPLEXITY_NONE', 'Sem ajuste de complexidade', 'COMPLEXIDADE', PricingConfigType.MULTIPLIER, '1'],
  ['WEBSITE_COMPLEXITY_MODERATE', 'Complexidade moderada', 'COMPLEXIDADE', PricingConfigType.MULTIPLIER, '1.2'],
  ['WEBSITE_COMPLEXITY_HIGH', 'Complexidade alta', 'COMPLEXIDADE', PricingConfigType.MULTIPLIER, '1.5'],
  ['WEBSITE_URGENCY_NORMAL', 'Urgencia normal', 'URGENCIA', PricingConfigType.MULTIPLIER, '1'],
  ['WEBSITE_URGENCY_PRIORITY', 'Urgencia prioridade', 'URGENCIA', PricingConfigType.MULTIPLIER, '1.3'],
  ['WEBSITE_URGENCY_EXPRESS', 'Urgencia expressa', 'URGENCIA', PricingConfigType.MULTIPLIER, '1.6']
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

  for (const [code, name, category, configType, value] of pricingConfigs) {
    await prisma.pricingConfig.upsert({
      where: { code },
      update: {
        name,
        applicationType: ApplicationType.WEBSITE,
        category,
        configType,
        active: true
      },
      create: {
        code,
        name,
        applicationType: ApplicationType.WEBSITE,
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
