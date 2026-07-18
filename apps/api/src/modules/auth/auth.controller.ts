import type { RequestHandler } from 'express';
import { loginInputSchema } from '@mjm/shared';
import { env } from '../../config/env.js';
import { authenticate } from './auth.service.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.COOKIE_SECURE,
  path: '/',
  maxAge: env.JWT_EXPIRES_IN_SECONDS * 1000
};

export const login: RequestHandler = async (request, response, next) => {
  try {
    const input = loginInputSchema.parse(request.body);
    const result = await authenticate(input);
    response.cookie(env.AUTH_COOKIE_NAME, result.token, cookieOptions);
    response.status(200).json({ user: result.user });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = (_request, response) => {
  response.clearCookie(env.AUTH_COOKIE_NAME, {
    httpOnly: cookieOptions.httpOnly,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
    path: cookieOptions.path
  });
  response.status(204).send();
};

export const me: RequestHandler = (request, response) => {
  response.status(200).json({ user: request.authUser });
};

