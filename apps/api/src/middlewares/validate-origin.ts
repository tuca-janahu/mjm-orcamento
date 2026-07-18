import type { RequestHandler } from 'express';
import { env } from '../config/env.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

export const validateOrigin: RequestHandler = (request, response, next) => {
  if (safeMethods.has(request.method)) {
    next();
    return;
  }

  const origin = request.get('origin');
  if (origin !== undefined && origin !== env.CORS_ORIGIN) {
    response.status(403).json({ error: { code: 'INVALID_ORIGIN', message: 'Origem nao permitida' } });
    return;
  }

  next();
};

