import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as http from '../../lib/http';
import {
  addPetToCustomer,
  createCustomer,
  deleteCustomer,
  deletePet,
  getCustomer,
  getCustomerPets,
  getPet,
  listCustomers,
} from '../../api/customers';

vi.mock('../../lib/http');

const fetchJson = vi.mocked(http.fetchJson);

beforeEach(() => {
  fetchJson.mockReset();
});

const customersPayload = {
  customers: [{ id: '1', name: 'Alice', email: 'alice@example.com', phone: null, petsCount: 0 }],
};

const customerPayload = {
  customer: { id: 'c1', name: 'Alice', email: 'alice@example.com', phone: null },
};

const petsPayload = {
  pets: [{ id: 'p1', name: 'Fido', type: 'dog' }],
};

const petPayload = { pet: { id: 'p1', name: 'Fido', type: 'dog' } };

describe('customers api', () => {
  it('lists customers', async () => {
    fetchJson.mockResolvedValueOnce(customersPayload);
    const result = await listCustomers();
    expect(fetchJson).toHaveBeenCalledWith('/customers', undefined);
    expect(result).toEqual(customersPayload.customers);
  });

  it('allows passing abort signals when listing customers', async () => {
    const controller = new AbortController();
    fetchJson.mockResolvedValueOnce(customersPayload);
    await listCustomers({ signal: controller.signal });
    expect(fetchJson).toHaveBeenCalledWith('/customers', { signal: controller.signal });
  });

  it('creates customer with validated payload', async () => {
    fetchJson.mockResolvedValueOnce(customerPayload);
    const result = await createCustomer({ name: 'Alice' });
    expect(fetchJson).toHaveBeenCalledWith('/customers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Alice' }),
    });
    expect(result).toEqual(customerPayload.customer);
  });

  it('fetches customer pets', async () => {
    fetchJson.mockResolvedValueOnce(petsPayload);
    const result = await getCustomerPets('c1');
    expect(fetchJson).toHaveBeenCalledWith('/customers/c1/pets', undefined);
    expect(result).toEqual(petsPayload.pets);
  });

  it('respects abort signal when fetching customer pets', async () => {
    const controller = new AbortController();
    fetchJson.mockResolvedValueOnce(petsPayload);
    await getCustomerPets('c1', { signal: controller.signal });
    expect(fetchJson).toHaveBeenCalledWith('/customers/c1/pets', { signal: controller.signal });
  });

  it('gets individual customer', async () => {
    fetchJson.mockResolvedValueOnce(customerPayload);
    const result = await getCustomer('c1');
    expect(fetchJson).toHaveBeenCalledWith('/customers/c1', undefined);
    expect(result).toEqual(customerPayload.customer);
  });

  it('gets pet detail', async () => {
    fetchJson.mockResolvedValueOnce(petPayload);
    const result = await getPet('c1', 'p1');
    expect(fetchJson).toHaveBeenCalledWith('/customers/c1/pets/p1', undefined);
    expect(result).toEqual(petPayload.pet);
  });

  it('adds pet to customer', async () => {
    fetchJson.mockResolvedValueOnce(petPayload);
    const result = await addPetToCustomer('c1', { name: 'Fido', type: 'dog' });
    expect(fetchJson).toHaveBeenCalledWith('/customers/c1/pets', {
      method: 'POST',
      body: JSON.stringify({ name: 'Fido', type: 'dog' }),
    });
    expect(result).toEqual(petPayload.pet);
  });

  it('deletes customer and pet', async () => {
    fetchJson.mockResolvedValueOnce(undefined);
    await deleteCustomer('c1');
    expect(fetchJson).toHaveBeenCalledWith('/customers/c1', { method: 'DELETE' });

    fetchJson.mockResolvedValueOnce(undefined);
    await deletePet('c1', 'p1');
    expect(fetchJson).toHaveBeenCalledWith('/customers/c1/pets/p1', { method: 'DELETE' });
  });
});
