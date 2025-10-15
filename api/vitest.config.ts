import { defineConfig } from 'vitest/config';

const coverageEnabled =
  process.env.CI === 'true' ||
  process.env.VITEST_COVERAGE === '1' ||
  process.argv.includes('--coverage');

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    maxWorkers: 1,
    coverage: {
      provider: 'v8',
      enabled: coverageEnabled,
      all: true,
      reporter: ['text', 'lcov', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/auth/types.ts',
        'src/db/**',
        'src/env.ts',
        'drizzle.config.ts',
        'src/server.ts',
      ],
      thresholds: {
        statements: 0.9,
        branches: 0.9,
        functions: 0.9,
        lines: 0.9,
      },
    },
  },
});
