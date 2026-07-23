import type { RequestHandler } from 'express';
import { createBudgetEnvelopeSchema, updateBudgetEnvelopeSchema } from '@mjm/shared';
import {
  authenticatedUserId,
  optionalUuidHeader,
  routeUuidParam
} from '../../shared/http/request-helpers.js';
import {
  createBudget,
  deleteBudget,
  finalizeBudget,
  getBudget,
  listBudgets,
  recalculateBudget,
  updateBudget
} from './budget.service.js';

export const index: RequestHandler = async (request, response, next) => {
  try { response.json({ budgets: await listBudgets(routeUuidParam(request, 'projectId')) }); } catch (error) { next(error); }
};

export const show: RequestHandler = async (request, response, next) => {
  try { response.json({ budget: await getBudget(routeUuidParam(request, 'id')) }); } catch (error) { next(error); }
};

export const remove: RequestHandler = async (request, response, next) => {
  try {
    await deleteBudget(routeUuidParam(request, 'id'));
    response.status(204).send();
  } catch (error) { next(error); }
};

export const create: RequestHandler = async (request, response, next) => {
  try {
    const budget = await createBudget(
      routeUuidParam(request, 'projectId'),
      createBudgetEnvelopeSchema.parse(request.body),
      authenticatedUserId(request),
      optionalUuidHeader(request, 'Idempotency-Key')
    );
    response.status(201).json({ budget });
  } catch (error) { next(error); }
};

export const update: RequestHandler = async (request, response, next) => {
  try {
    response.json({
      budget: await updateBudget(
        routeUuidParam(request, 'id'),
        updateBudgetEnvelopeSchema.parse(request.body)
      )
    });
  } catch (error) { next(error); }
};

export const recalculate: RequestHandler = async (request, response, next) => {
  try { response.json({ budget: await recalculateBudget(routeUuidParam(request, 'id')) }); } catch (error) { next(error); }
};

export const finalize: RequestHandler = async (request, response, next) => {
  try { response.json({ budget: await finalizeBudget(routeUuidParam(request, 'id')) }); } catch (error) { next(error); }
};
