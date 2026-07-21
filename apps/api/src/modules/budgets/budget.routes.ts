import { Router } from 'express';
import { create, finalize, index, recalculate, remove, show, update } from './budget.controller.js';

export const projectBudgetRouter = Router({ mergeParams: true });
projectBudgetRouter.get('/', index);
projectBudgetRouter.post('/', create);

export const budgetRouter = Router();
budgetRouter.get('/:id', show);
budgetRouter.patch('/:id', update);
budgetRouter.delete('/:id', remove);
budgetRouter.post('/:id/recalculate', recalculate);
budgetRouter.post('/:id/finalize', finalize);
