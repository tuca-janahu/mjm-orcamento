import type { RequestHandler } from 'express';
import { createBudgetEnvelopeSchema, updateBudgetEnvelopeSchema } from '@mjm/shared';
import { z } from 'zod';
import { AppError } from '../../shared/errors/app-error.js';
import {
  createBudget,
  deleteBudget,
  finalizeBudget,
  getBudget,
  listBudgets,
  recalculateBudget,
  updateBudget
} from './budget.service.js';

function authenticatedUserId(request: Parameters<RequestHandler>[0]): string {
  if (request.authUser === undefined) throw new AppError(401, 'UNAUTHENTICATED', 'Autenticacao necessaria');
  return request.authUser.id;
}

function routeParam(request: Parameters<RequestHandler>[0], name: string): string {
  const value = request.params[name];
  if (typeof value !== 'string') throw new AppError(400, 'INVALID_ROUTE_PARAMETER', 'Parametro de rota invalido');
  return value;
}

const idempotencyKeySchema = z.string().uuid();

function idempotencyKey(request: Parameters<RequestHandler>[0]): string | undefined {
  const value = request.get('Idempotency-Key');
  return value === undefined ? undefined : idempotencyKeySchema.parse(value);
}

export const index: RequestHandler = async (request, response, next) => {
  try { response.json({ budgets: await listBudgets(routeParam(request, 'projectId')) }); } catch (error) { next(error); }
};

export const show: RequestHandler = async (request, response, next) => {
  try { response.json({ budget: await getBudget(routeParam(request, 'id')) }); } catch (error) { next(error); }
};

export const remove: RequestHandler = async (request, response, next) => {
  try {
    await deleteBudget(routeParam(request, 'id'));
    response.status(204).send();
  } catch (error) { next(error); }
};

export const create: RequestHandler = async (request, response, next) => {
  try {
    const budget = await createBudget(
      routeParam(request, 'projectId'),
      createBudgetEnvelopeSchema.parse(request.body),
      authenticatedUserId(request),
      idempotencyKey(request)
    );
    response.status(201).json({ budget });
  } catch (error) { next(error); }
};

export const update: RequestHandler = async (request, response, next) => {
  try {
    response.json({
      budget: await updateBudget(
        routeParam(request, 'id'),
        updateBudgetEnvelopeSchema.parse(request.body)
      )
    });
  } catch (error) { next(error); }
};

export const recalculate: RequestHandler = async (request, response, next) => {
  try { response.json({ budget: await recalculateBudget(routeParam(request, 'id')) }); } catch (error) { next(error); }
};

export const finalize: RequestHandler = async (request, response, next) => {
  try { response.json({ budget: await finalizeBudget(routeParam(request, 'id')) }); } catch (error) { next(error); }
};
