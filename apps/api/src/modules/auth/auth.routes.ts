import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { login, logout, me } from './auth.controller.js';
import { requireAuthentication } from './auth.middleware.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Muitas tentativas. Tente novamente mais tarde' } }
});

export const authRouter = Router();

authRouter.post('/login', loginLimiter, login);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuthentication, me);

