import { afterEach, beforeEach } from 'vitest';
import { testDb } from './db.js';

/**
 * Runs each test in a transaction that's rolled back after the test.
 * This provides isolation between tests without needing to clean the entire database.
 */
export function useTransactionalTests() {
  beforeEach(async () => {
    // Start a transaction before each test
    await testDb.execute('BEGIN');

    // Ensure sessions are visible outside the transaction for authentication
    await testDb.execute('SET transaction isolation level read committed');
  });

  afterEach(async () => {
    // Roll back the transaction to undo any changes made during the test
    await testDb.execute('ROLLBACK');
  });
}
