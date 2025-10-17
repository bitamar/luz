import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { resetDb } from '../utils/db.js';
import { db } from '../../src/db/client.js';
import { users } from '../../src/db/schema.js';
import {
  createCustomerForUser,
  createPetForCustomer,
  deleteCustomerForUser,
  deletePetForCustomer,
  getCustomerForUser,
  getPetForCustomer,
  listCustomersForUser,
  listPetsForCustomer,
  updateCustomerForUser,
} from '../../src/services/customer-service.js';

async function createUser() {
  const [user] = await db
    .insert(users)
    .values({ email: `customer-${randomUUID()}@example.com`, name: 'Customer Tester' })
    .returning();
  return user;
}

describe('customer-service', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await resetDb();
  });

  it('manages customers and pets for a user', async () => {
    const user = await createUser();

    const customer = await createCustomerForUser(user.id, {
      name: '  Example Customer  ',
      email: 'example@example.com',
    });

    expect(customer).toMatchObject({
      name: 'Example Customer',
      email: 'example@example.com',
      petsCount: 0,
    });

    const list = await listCustomersForUser(user.id);
    expect(list).toEqual([expect.objectContaining({ id: customer.id, petsCount: 0 })]);

    const pet = await createPetForCustomer(customer.id, {
      name: 'Luna',
      type: 'cat',
      gender: 'female',
    });
    expect(pet).toMatchObject({ customerId: customer.id, name: 'Luna', type: 'cat' });

    const customerWithPet = await getCustomerForUser(user.id, customer.id);
    expect(customerWithPet.petsCount).toBe(1);

    const petsList = await listPetsForCustomer(customer.id);
    expect(petsList).toEqual([expect.objectContaining({ id: pet.id, name: 'Luna' })]);

    const fetchedPet = await getPetForCustomer(customer.id, pet.id);
    expect(fetchedPet).toMatchObject({ id: pet.id, name: 'Luna' });

    const updatedCustomer = await updateCustomerForUser(user.id, customer.id, { phone: '123456' });
    expect(updatedCustomer.phone).toBe('123456');

    await deletePetForCustomer(customer.id, pet.id);
    const listAfterPetDelete = await listPetsForCustomer(customer.id);
    expect(listAfterPetDelete).toEqual([]);

    const deletionResult = await deleteCustomerForUser(user.id, customer.id);
    expect(deletionResult).toEqual({ ok: true });

    const listAfterDelete = await listCustomersForUser(user.id);
    expect(listAfterDelete).toEqual([]);
  });

  it('throws not found for missing pet', async () => {
    const user = await createUser();
    const customer = await createCustomerForUser(user.id, { name: 'Missing', email: null });

    await expect(getPetForCustomer(customer.id, randomUUID())).rejects.toHaveProperty(
      'statusCode',
      404
    );
  });
});
