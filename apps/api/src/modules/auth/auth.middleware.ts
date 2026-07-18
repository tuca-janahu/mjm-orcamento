import type { RequestHandler } from 'express';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import { resolveAuthenticatedUser } from './auth.service.js';

export const requireAuthentication: RequestHandler = async (request, _response, next) => {
  const cookies = request.cookies as Record<string, string | undefined>;
  const token = cookies[env.AUTH_COOKIE_NAME];

  if (token === undefined) {
    next(new AppError(401, 'UNAUTHENTICATED', 'Autenticacao necessaria'));
    return;
  }

  try {
    request.authUser = await resolveAuthenticatedUser(token);
    next();
  } catch (error) {
    next(error);
  }
};
