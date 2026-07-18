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
  ['WEBSITE_BASE_LANDING_PAGE', 'Base landing page', 'BASE', PricingConfigType.FIXED_VALUE, '500'],
  ['WEBSITE_BASE_INSTITUCIONAL', 'Base website institucional', 'BASE', PricingConfigType.FIXED_VALUE, '800'],
  ['WEBSITE_BASE_BLOG', 'Base blog', 'BASE', PricingConfigType.FIXED_VALUE, '1000'],
  ['WEBSITE_BASE_ECOMMERCE', 'Base e-commerce', 'BASE', PricingConfigType.FIXED_VALUE, '1600'],
  ['WEBSITE_BASE_PLATAFORMA', 'Base plataforma', 'BASE', PricingConfigType.FIXED_VALUE, '2400'],
  ['WEBSITE_EXTRA_PAGE', 'Pagina adicional', 'PAGINAS', PricingConfigType.UNIT_VALUE, '300'],
  ['WEBSITE_DESIGN_TEMPLATE', 'Design template', 'DESIGN', PricingConfigType.FIXED_VALUE, '200'],
  ['WEBSITE_DESIGN_CUSTOM', 'Design personalizado', 'DESIGN', PricingConfigType.FIXED_VALUE, '1000'],
  ['WEBSITE_DEVELOPMENT_FRONTEND', 'Desenvolvimento frontend', 'DESENVOLVIMENTO', PricingConfigType.FIXED_VALUE, '2000'],
  ['WEBSITE_DEVELOPMENT_FULLSTACK', 'Desenvolvimento fullstack', 'DESENVOLVIMENTO', PricingConfigType.FIXED_VALUE, '3000'],
  ['WEBSITE_ADMIN_PANEL', 'Painel administrativo', 'FUNCIONALIDADE', PricingConfigType.FIXED_VALUE, '2000'],
  ['WEBSITE_INTEGRATION', 'Integracao', 'INTEGRACAO', PricingConfigType.UNIT_VALUE, '800'],
  ['WEBSITE_PAYMENT_SYSTEM', 'Sistema de pagamento', 'FUNCIONALIDADE', PricingConfigType.FIXED_VALUE, '1500'],
  ['WEBSITE_BLOG', 'Blog', 'FUNCIONALIDADE', PricingConfigType.FIXED_VALUE, '1000'],
  ['WEBSITE_BASIC_SEO', 'SEO basico', 'SERVICO', PricingConfigType.FIXED_VALUE, '200'],
  ['WEBSITE_DOMAIN', 'Dominio', 'INFRAESTRUTURA', PricingConfigType.FIXED_VALUE, '200'],
  ['WEBSITE_HOSTING', 'Hospedagem', 'INFRAESTRUTURA', PricingConfigType.FIXED_VALUE, '500'],
  ['WEBSITE_COMPLEXITY_SIMPLE', 'Complexidade simples', 'COMPLEXIDADE', PricingConfigType.MULTIPLIER, '1'],
  ['WEBSITE_COMPLEXITY_MEDIUM', 'Complexidade media', 'COMPLEXIDADE', PricingConfigType.MULTIPLIER, '1.2'],
  ['WEBSITE_COMPLEXITY_COMPLEX', 'Complexidade complexa', 'COMPLEXIDADE', PricingConfigType.MULTIPLIER, '1.5'],
  ['WEBSITE_URGENCY_NORMAL', 'Urgencia normal', 'URGENCIA', PricingConfigType.MULTIPLIER, '1'],
  ['WEBSITE_URGENCY_PRIORITY', 'Urgencia prioridade', 'URGENCIA', PricingConfigType.MULTIPLIER, '1.3'],
  ['WEBSITE_URGENCY_EXPRESS', 'Urgencia expresso', 'URGENCIA', PricingConfigType.MULTIPLIER, '1.6']
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

  for (const [code, name, category, configType, value] of pricingConfigs) {
    await prisma.pricingConfig.upsert({
      where: { code },
      update: { name, category, configType, value, active: true },
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
