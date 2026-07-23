import { config } from 'dotenv';
import { resolve } from 'node:path';
import { requireTestDatabaseUrl } from './test-database.js';

config({ path: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')] });

process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = requireTestDatabaseUrl(process.env);
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
process.env.JWT_EXPIRES_IN_SECONDS = '3600';
process.env.AUTH_COOKIE_NAME = 'mjm_auth';
process.env.COOKIE_SECURE = 'false';
