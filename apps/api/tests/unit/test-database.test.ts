import { describe, expect, it } from 'vitest';
import { requireTestDatabaseUrl } from '../setup/test-database.js';

const validUrl = 'postgresql://mjm:mjm_local_password@localhost:5434/mjm_orcamentos_test?schema=public';

describe('requireTestDatabaseUrl', () => {
  it.each([
    [{}, 'TEST_DATABASE_URL e obrigatoria'],
    [{ TEST_DATABASE_URL: validUrl, DATABASE_URL: validUrl }, 'nao pode apontar'],
    [{ TEST_DATABASE_URL: 'not-a-url' }, 'TEST_DATABASE_URL invalida'],
    [{ TEST_DATABASE_URL: validUrl.replace('mjm_orcamentos_test', 'mjm_orcamentos') }, 'deve apontar'],
    [{ TEST_DATABASE_URL: validUrl.replace('localhost', 'postgres') }, 'deve apontar'],
    [{ TEST_DATABASE_URL: validUrl.replace('5434', '5432') }, 'deve apontar']
  ])('rejects an unsafe test database URL: %#', (environment, expectedMessage) => {
    expect(() => requireTestDatabaseUrl(environment)).toThrow(expectedMessage);
  });

  it('accepts the dedicated local test database URL', () => {
    expect(requireTestDatabaseUrl({ TEST_DATABASE_URL: validUrl })).toBe(validUrl);
  });
});
