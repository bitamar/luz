import { fetchJson } from '../lib/http';
import {
  createCustomerBodySchema,
  createPetBodySchema,
  customerPetsResponseSchema,
  customerResponseSchema,
  customersListResponseSchema,
  petResponseSchema,
} from '@contracts/customers';
import type { CreateCustomerBody, CreatePetBody, Customer, Pet } from '@contracts/customers';

export type {
  CreateCustomerBody,
  CreatePetBody,
  Customer,
  CustomerPetsResponse,
  CustomerResponse,
  CustomersListResponse,
  Pet,
  PetResponse,
} from '@contracts/customers';

export type PetSummary = Pick<Pet, 'id' | 'name' | 'type'>;

type RequestOptions = {
  signal?: AbortSignal;
};

export async function listCustomers(options: RequestOptions = {}): Promise<Customer[]> {
  const json = await fetchJson<unknown>('/customers', { signal: options.signal });
  const result = customersListResponseSchema.parse(json);
  return result.customers;
}

export async function createCustomer(input: CreateCustomerBody): Promise<Customer> {
  const payload = createCustomerBodySchema.parse(input);
  const json = await fetchJson<unknown>('/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const result = customerResponseSchema.parse(json);
  return result.customer;
}

export async function getCustomerPets(customerId: string, options: RequestOptions = {}): Promise<Pet[]> {
  const json = await fetchJson<unknown>(`/customers/${customerId}/pets`, { signal: options.signal });
  const result = customerPetsResponseSchema.parse(json);
  return result.pets;
}

export async function getCustomer(customerId: string, options: RequestOptions = {}): Promise<Customer> {
  const json = await fetchJson<unknown>(`/customers/${customerId}`, { signal: options.signal });
  const result = customerResponseSchema.parse(json);
  return result.customer;
}

export async function getPet(
  customerId: string,
  petId: string,
  options: RequestOptions = {}
): Promise<Pet> {
  const json = await fetchJson<unknown>(`/customers/${customerId}/pets/${petId}`, {
    signal: options.signal,
  });
  const result = petResponseSchema.parse(json);
  return result.pet;
}

export async function addPetToCustomer(customerId: string, input: CreatePetBody): Promise<Pet> {
  const payload = createPetBodySchema.parse(input);
  const json = await fetchJson<unknown>(`/customers/${customerId}/pets`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const result = petResponseSchema.parse(json);
  return result.pet;
}

export async function deleteCustomer(customerId: string): Promise<void> {
  await fetchJson(`/customers/${customerId}`, {
    method: 'DELETE',
  });
}

export async function deletePet(customerId: string, petId: string): Promise<void> {
  await fetchJson(`/customers/${customerId}/pets/${petId}`, {
    method: 'DELETE',
  });
}
