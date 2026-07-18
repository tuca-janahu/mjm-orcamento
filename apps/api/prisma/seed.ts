import argon2 from 'argon2';
import { PrismaClient, UserRole } from '@prisma/client';
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

  console.info(`Administrador preparado: ${seedEnv.SEED_ADMIN_EMAIL}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
