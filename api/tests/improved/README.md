# Improved Test Framework

This directory contains tests that use our improved testing utilities and patterns.

## Key Features

- **Standardized Test Setup**: Uses `setupApiTest` utility for consistent test initialization
- **Type-Safe Test Data**: Uses test factories from `test-factories.ts` to create data with sensible defaults
- **Database Seeding Utilities**: Uses helpers from `seed-helpers.ts` to create test data efficiently
- **Response Type Definitions**: Uses shared response types from `response-types.ts` for consistency
- **Improved Test Isolation**: Ensures proper cleanup between tests

## Getting Started

To create a new test using these improved utilities:

```typescript
import { describe, it, expect } from 'vitest';
import { setupApiTest } from '../utils/setup-api-test.js';
import { seedUser, seedSession } from '../utils/seed-helpers.js';
import { createUserData } from '../utils/test-factories.js';
import { getJson } from '../utils/json-response.js';
import { resetDb } from '../utils/db.js';

describe('your-feature', () => {
  // Get access to the Fastify app instance
  const { getApp } = setupApiTest({ useResetDb: false });

  // Set up test database before and after each test
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await resetDb();
  });

  it('should do something', async () => {
    // Create test data using factories
    const user = await seedUser(createUserData());
    const session = await seedSession(user.id);

    // Test your API endpoints
    // ...
  });
});
```

## Available Utilities

- `setupApiTest`: Creates a standardized test environment with app instance
- `seed-helpers.ts`: Functions to seed test data with proper relationships
- `test-factories.ts`: Factory functions for creating test data with sensible defaults
- `response-types.ts`: Type definitions for API responses
- `json-response.ts`: Utilities for handling API responses
