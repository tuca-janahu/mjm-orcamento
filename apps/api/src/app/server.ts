import { createApp } from './create-app.js';
import { env } from '../config/env.js';
import { prisma } from '../shared/prisma/client.js';

const app = createApp();
const server = app.listen(env.PORT, () => {
  console.info(`API executando na porta ${env.PORT}`);
});

function shutdown(signal: string): void {
  console.info(`Encerrando API: ${signal}`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
