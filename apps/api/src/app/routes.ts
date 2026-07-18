import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { budgetRouter, projectBudgetRouter } from '../modules/budgets/budget.routes.js';
import { pricingRouter } from '../modules/pricing/pricing.routes.js';
import { projectRouter } from '../modules/projects/project.routes.js';
import { requireAuthentication } from '../modules/auth/auth.middleware.js';

export const routes = Router();

routes.use('/auth', authRouter);
routes.use('/projects', requireAuthentication, projectRouter);
routes.use('/projects/:projectId/budgets', requireAuthentication, projectBudgetRouter);
routes.use('/budgets', requireAuthentication, budgetRouter);
routes.use('/pricing-configs', requireAuthentication, pricingRouter);
