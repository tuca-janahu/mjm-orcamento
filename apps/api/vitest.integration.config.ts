import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['./tests/integration/**/*.test.ts'],
    setupFiles: ['./tests/setup/env.ts'],
    clearMocks: true
  }
});
