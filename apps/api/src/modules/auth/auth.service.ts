import argon2 from 'argon2';
import { SignJWT, jwtVerify } from 'jose';
import type { AuthUser, LoginInput } from '@mjm/shared';
import { env } from '../../config/env.js';
import { prisma } from '../../shared/prisma/client.js';
import { AppError } from '../../shared/errors/app-error.js';

const jwtSecret = new TextEncoder().encode(env.JWT_SECRET);
const invalidCredentials = new AppError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha invalidos');

function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  active: boolean;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active
  };
}

export async function authenticate(input: LoginInput): Promise<{ user: AuthUser; token: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (user === null || !user.active) {
    throw invalidCredentials;
  }

  const passwordMatches = await argon2.verify(user.passwordHash, input.password);
  if (!passwordMatches) {
    throw invalidCredentials;
  }

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_EXPIRES_IN_SECONDS}s`)
    .sign(jwtSecret);

  return { user: toAuthUser(user), token };
}

export async function resolveAuthenticatedUser(token: string): Promise<AuthUser> {
  let subject: string | undefined;

  try {
    const result = await jwtVerify(token, jwtSecret, { algorithms: ['HS256'] });
    subject = result.payload.sub;
  } catch {
    throw new AppError(401, 'UNAUTHENTICATED', 'Autenticacao necessaria');
  }

  if (subject === undefined) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Autenticacao necessaria');
  }

  const user = await prisma.user.findUnique({ where: { id: subject } });
  if (user === null || !user.active) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Autenticacao necessaria');
  }

  return toAuthUser(user);
}

