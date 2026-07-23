const expectedDatabaseName = 'mjm_orcamentos_test';
const allowedHosts = new Set(['localhost', '127.0.0.1']);
const allowedPort = '5434';

export function requireTestDatabaseUrl(environment: NodeJS.ProcessEnv = process.env): string {
  const testDatabaseUrl = environment.TEST_DATABASE_URL;
  if (testDatabaseUrl === undefined || testDatabaseUrl.trim() === '') {
    throw new Error('TEST_DATABASE_URL e obrigatoria para testes de integracao');
  }

  if (testDatabaseUrl === environment.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL nao pode apontar para o banco de desenvolvimento');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(testDatabaseUrl);
  } catch {
    throw new Error('TEST_DATABASE_URL invalida');
  }

  const databaseName = decodeURIComponent(parsedUrl.pathname).replace(/^\//, '');
  if (
    (parsedUrl.protocol !== 'postgresql:' && parsedUrl.protocol !== 'postgres:')
    || !allowedHosts.has(parsedUrl.hostname)
    || parsedUrl.port !== allowedPort
    || databaseName !== expectedDatabaseName
    || /prod/i.test(parsedUrl.hostname) || /prod/i.test(databaseName)
  ) {
    throw new Error(
      `TEST_DATABASE_URL deve apontar para ${expectedDatabaseName} em localhost:${allowedPort}`
    );
  }

  return testDatabaseUrl;
}
