import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/app.js';
import { createTestUserWithSession, resetDb, seedCustomer } from '../utils/db.js';
import { injectAuthed } from '../utils/inject.js';

function getJson<T>(response: Awaited<ReturnType<typeof injectAuthed>>) {
  return { statusCode: response.statusCode, body: response.json() as T };
}

interface AddedPetResponse {
  pet: {
    id: string;
    name: string;
    type: 'dog' | 'cat';
    gender: 'male' | 'female';
    customerId: string;
  };
}

interface PetsListResponse {
  pets: Array<{
    id: string;
    name: string;
    type: 'dog' | 'cat';
    customerId: string;
  }>;
}

interface CustomersListResponse {
  customers: Array<{
    id: string;
    name: string;
    pets: Array<{ id: string; name: string; type: 'dog' | 'cat' }>;
  }>;
}

interface CustomerResponse {
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    pets: Array<{ id: string; name: string; type: 'dog' | 'cat' }>;
  };
}

describe('routes/customers', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ logger: false });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await resetDb();
  });

  it('returns the pet data after adding a pet', async () => {
    const { user, session } = await createTestUserWithSession();
    const customer = await seedCustomer(user.id, { name: 'Lola' });

    const response = await injectAuthed(app, session.id, {
      method: 'POST',
      url: `/customers/${customer.id}/pets`,
      payload: { name: 'Milo', type: 'dog', gender: 'male' },
    });

    const result = getJson<AddedPetResponse>(response);

    expect(result.statusCode).toBe(201);
    expect(result.body).toMatchObject({
      pet: {
        name: 'Milo',
        type: 'dog',
        customerId: customer.id,
        id: expect.any(String),
      },
    });

    const petsResponse = await injectAuthed(app, session.id, {
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

    const listResponse = await injectAuthed(app, session.id, {
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
    const { session } = await createTestUserWithSession();
    const response = await injectAuthed(app, session.id, {
      method: 'POST',
      url: '/customers',
      payload: { name: 'Nova', email: 'nova@example.com' },
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
    const { user, session } = await createTestUserWithSession();
    const customer = await seedCustomer(user.id, { name: 'Old Name' });

    const response = await injectAuthed(app, session.id, {
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
