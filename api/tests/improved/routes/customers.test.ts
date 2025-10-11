import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { setupApiTest } from '../../utils/setup-api-test.js';
import { seedCustomer } from '../../utils/seed-helpers.js';
import { createCustomerData, createPetData } from '../../utils/test-factories.js';
import {
  CustomerResponse,
  CustomersListResponse,
  PetResponse,
  PetsListResponse,
} from '../../utils/response-types.js';
import { injectAuthed } from '../../utils/inject.js';
import { getJson } from '../../utils/json-response.js';
import { resetDb, testDb } from '../../utils/db.js';
import { customers } from '../../../src/db/schema.js';
import { createTestUserWithSessionTx } from '../../utils/test-helpers.js';

describe('routes/customers', () => {
  // Reset the database before each test
  // This is important because setupApiTest with useResetDb: false doesn't reset the database
  const { getApp } = setupApiTest({ useResetDb: false });

  // Reset before each test to start with clean state
  beforeEach(async () => {
    await resetDb();
  });

  // Ensure we clean up after tests too
  afterEach(async () => {
    await resetDb();
  });

  it('returns the pet data after adding a pet', async () => {
    // Use transaction-based setup to ensure proper user/session creation
    const { user, session } = await createTestUserWithSessionTx();

    // Create customer after user is guaranteed to exist
    const [customer] = await testDb
      .insert(customers)
      .values({
        userId: user.id,
        name: 'Lola',
      })
      .returning();

    console.log(`Testing with session ID: ${session.id} for user ID: ${user.id}`);

    // Small delay to ensure session is fully available
    await new Promise((resolve) => setTimeout(resolve, 50));

    const petData = createPetData({
      name: 'Milo',
      type: 'dog',
      gender: 'male',
    });

    // Test your API endpoints
    const response = await injectAuthed(getApp(), session.id, {
      method: 'POST',
      url: `/customers/${customer.id}/pets`,
      payload: petData,
    });

    const result = getJson<PetResponse>(response);

    expect(result.statusCode).toBe(201);
    expect(result.body).toMatchObject({
      pet: {
        name: 'Milo',
        type: 'dog',
        customerId: customer.id,
        id: expect.any(String),
      },
    });

    const petsResponse = await injectAuthed(getApp(), session.id, {
      method: 'GET',
      url: `/customers/${customer.id}/pets`,
    });

    const petsResult = getJson<PetsListResponse>(petsResponse);
    expect(petsResult.statusCode).toBe(200);
    expect(petsResult.body.pets).toEqual([
      expect.objectContaining({
        name: 'Milo',
        type: 'dog',
        customerId: customer.id,
      }),
    ]);

    const listResponse = await injectAuthed(getApp(), session.id, {
      method: 'GET',
      url: '/customers',
    });

    const listResult = getJson<CustomersListResponse>(listResponse);
    expect(listResult.statusCode).toBe(200);
    expect(listResult.body.customers).toEqual([
      expect.objectContaining({ id: customer.id, name: 'Lola' }),
    ]);
  });

  it('returns full customer payload after creation', async () => {
    // Use transaction-based setup to avoid foreign key constraint errors
    const { session } = await createTestUserWithSessionTx();

    const customerData = createCustomerData({
      name: 'Nova',
      email: 'nova@example.com',
    });

    const response = await injectAuthed(getApp(), session.id, {
      method: 'POST',
      url: '/customers',
      payload: customerData,
    });

    const result = getJson<CustomerResponse>(response);
    expect(result.statusCode).toBe(201);
    expect(result.body.customer).toMatchObject({
      name: 'Nova',
      email: 'nova@example.com',
      pets: [],
    });
  });

  it('returns full customer payload after update', async () => {
    // Use transaction-based setup to avoid foreign key constraint errors
    const { user, session } = await createTestUserWithSessionTx();
    const customer = await seedCustomer(user.id, createCustomerData({ name: 'Old Name' }));

    const response = await injectAuthed(getApp(), session.id, {
      method: 'PUT',
      url: `/customers/${customer.id}`,
      payload: { name: 'New Name' },
    });

    const result = getJson<CustomerResponse>(response);
    expect(result.statusCode).toBe(200);
    expect(result.body.customer).toMatchObject({
      id: customer.id,
      name: 'New Name',
      pets: [],
    });
  });
});
