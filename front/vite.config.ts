import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const coverageEnabled =
  process.env.CI === 'true' ||
  process.env.VITEST_COVERAGE === '1' ||
  process.argv.includes('--coverage');

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  resolve: { alias: { '@contracts': path.resolve(__dirname, '../api/src/schemas') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      enabled: coverageEnabled,
      all: true,
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        statements: 0.9,
        branches: 0.9,
        functions: 0.9,
        lines: 0.9,
      },
    },
  },
});
