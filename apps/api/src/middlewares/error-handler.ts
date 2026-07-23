import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors/app-error.js';

function parserErrorType(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('type' in error)) return undefined;
  return typeof error.type === 'string' ? error.type : undefined;
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Dados de entrada invalidos', details: error.flatten() }
    });
    return;
  }

  if (parserErrorType(error) === 'entity.parse.failed') {
    response.status(400).json({ error: { code: 'INVALID_JSON', message: 'JSON invalido' } });
    return;
  }

  if (parserErrorType(error) === 'entity.too.large') {
    response.status(413).json({ error: { code: 'BODY_TOO_LARGE', message: 'Corpo da requisicao excede o limite permitido' } });
    return;
  }

  console.error(error);
  response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' } });
};
