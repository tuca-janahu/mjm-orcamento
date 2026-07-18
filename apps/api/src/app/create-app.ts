import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from '../config/env.js';
import { errorHandler } from '../middlewares/error-handler.js';
import { notFound } from '../middlewares/not-found.js';
import { validateOrigin } from '../middlewares/validate-origin.js';
import { routes } from './routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(validateOrigin);

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.use(routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

