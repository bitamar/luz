import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/app.js';
import { resetDb } from './db.js';

/**
 * Creates a standardized test setup with FastifyInstance and database management.
 * This helps reduce boilerplate in individual test files.
 *
 * @param options Configuration options
 * @returns Object containing the app instance and other utilities
 */
export function setupApiTest(options: { useDb?: boolean; useResetDb?: boolean } = {}) {
  const useDb = options.useDb ?? true;
  const useResetDb = options.useResetDb ?? true;

  // Use a shared app instance for the test suite
  let app: FastifyInstance;

  beforeAll(async () => {
    // Create a fresh server instance for each test suite with test configuration
    app = await buildServer({
      logger: false,
    });

    // Ensure database is clean at the start of tests
    if (useDb && useResetDb) {
      try {
        await resetDb();
      } catch (error) {
        console.error('Error resetting database during setup:', error);
        throw error;
      }
    }
  });

  afterAll(async () => {
    await app.close();
  });

  // Handle database setup/teardown if enabled
  if (useDb && useResetDb) {
    beforeEach(async () => {
      try {
        await resetDb();
      } catch (error) {
        console.error('Error resetting database before test:', error);
        throw error;
      }
    });

    afterEach(async () => {
      try {
        await resetDb();
      } catch (error) {
        console.error('Error resetting database after test:', error);
        throw error;
      }
    });
  }

  return {
    // Return a function that returns the app instance to ensure it's initialized
    getApp: () => app,
  };
}
