import type { Request } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/app-error.js';

const uuidSchema = z.string().uuid();

export function authenticatedUserId(request: Request): string {
  if (request.authUser === undefined) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Autenticacao necessaria');
  }
  return request.authUser.id;
}

export function routeUuidParam(request: Request, name: string): string {
  const value = request.params[name];
  if (typeof value !== 'string' || !uuidSchema.safeParse(value).success) {
    throw new AppError(400, 'INVALID_ROUTE_PARAMETER', 'Parametro de rota invalido');
  }
  return value;
}

export function optionalUuidHeader(request: Request, name: string): string | undefined {
  const value = request.get(name);
  if (value === undefined) return undefined;
  if (!uuidSchema.safeParse(value).success) {
    throw new AppError(400, 'INVALID_IDEMPOTENCY_KEY', 'Chave de idempotencia invalida');
  }
  return value;
}
