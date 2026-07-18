import { Router } from 'express';
import { listActivePricingConfigs } from './pricing.service.js';

export const pricingRouter = Router();
pricingRouter.get('/', async (_request, response, next) => {
  try { response.json({ pricingConfigs: await listActivePricingConfigs() }); } catch (error) { next(error); }
});
