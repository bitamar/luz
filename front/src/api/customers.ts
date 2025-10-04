import { fetchJson } from '../lib/http';

export interface PetSummary {
  id: string;
  name: string;
  type: 'dog' | 'cat';
}

export interface Pet {
  id: string;
  customerId: string;
  name: string;
  type: 'dog' | 'cat';
  gender: 'male' | 'female';
  dateOfBirth: string | null;
  breed: string | null;
  isSterilized: boolean | null;
  isCastrated: boolean | null;
  customer: {
    id: string;
    name: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  pets: PetSummary[];
}

export async function listCustomers(): Promise<Customer[]> {
  const result = await fetchJson<{ customers: Customer[] }>('/customers');
  return result.customers;
}

export async function createCustomer(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}): Promise<Customer> {
  const result = await fetchJson<{ customer: Customer }>('/customers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.customer;
}

export async function getPet(customerId: string, petId: string): Promise<Pet> {
  const result = await fetchJson<{ pet: Pet }>(`/customers/${customerId}/pets/${petId}`);
  return result.pet;
}

export async function addPetToCustomer(
  customerId: string,
  input: {
    name: string;
    type: 'dog' | 'cat';
    gender: 'male' | 'female';
    dateOfBirth?: string | null;
    breed?: string | null;
    isSterilized?: boolean | null;
    isCastrated?: boolean | null;
  }
) {
  const result = await fetchJson<{ pet: Pet }>(`/customers/${customerId}/pets`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
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
