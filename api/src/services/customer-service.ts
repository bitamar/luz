import { z } from 'zod';
import {
  createCustomer,
  findActiveCustomersByUserId,
  findCustomerByIdForUser,
  softDeleteCustomerById,
  updateCustomerById,
  type CustomerInsert,
} from '../repositories/customer-repository.js';
import {
  countPetsForCustomer,
  countPetsForCustomerIds,
  createPet,
  findActivePetsByCustomerId,
  findPetByIdForCustomer,
  softDeletePetById,
  type PetInsert,
  type PetRecord,
} from '../repositories/pet-repository.js';
import { notFound } from '../lib/app-error.js';
import {
  customerSchema,
  petSchema,
  type CreateCustomerBody,
  type UpdateCustomerBody,
  type CreatePetBody,
} from '../schemas/customers.js';

const customerDto = customerSchema;
const petDto = petSchema;

type CustomerDto = z.infer<typeof customerDto>;
type PetDto = z.infer<typeof petDto>;

type CustomerRecord = Awaited<ReturnType<typeof findActiveCustomersByUserId>>[number];

function cleanNullableString(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildCustomer(record: CustomerRecord, petsCount: number): CustomerDto {
  return {
    id: record.id,
    name: record.name.trim(),
    email: cleanNullableString(record.email),
    phone: cleanNullableString(record.phone),
    address: cleanNullableString(record.address),
    petsCount,
  };
}

function normalizeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function serializePet(record: PetRecord): PetDto {
  return {
    id: record.id,
    customerId: record.customerId,
    name: record.name.trim(),
    type: record.type,
    gender: record.gender,
    dateOfBirth: normalizeDate(record.dateOfBirth ?? null),
    breed: cleanNullableString(record.breed),
    isSterilized: record.isSterilized ?? null,
    isCastrated: record.isCastrated ?? null,
  };
}

export async function listCustomersForUser(userId: string) {
  const records = await findActiveCustomersByUserId(userId);
  const counts = await countPetsForCustomerIds(records.map((record) => record.id));
  return records.map((record) => buildCustomer(record, counts.get(record.id) ?? 0));
}

export async function createCustomerForUser(userId: string, input: CreateCustomerBody) {
  const record = await createCustomer({
    userId,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    address: input.address ?? null,
  });
  if (!record) throw new Error('Failed to create customer');
  return buildCustomer(record, 0);
}

export async function getCustomerForUser(userId: string, customerId: string) {
  const record = await findCustomerByIdForUser(userId, customerId);
  if (!record) throw notFound();
  const petsCount = await countPetsForCustomer(record.id);
  return buildCustomer(record, petsCount);
}

export async function updateCustomerForUser(
  userId: string,
  customerId: string,
  input: UpdateCustomerBody
) {
  const updates: Partial<CustomerInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.email !== undefined) updates.email = input.email ?? null;
  if (input.phone !== undefined) updates.phone = input.phone ?? null;
  if (input.address !== undefined) updates.address = input.address ?? null;

  const record = await updateCustomerById(customerId, userId, updates);
  if (!record) throw notFound();
  const petsCount = await countPetsForCustomer(record.id);
  return buildCustomer(record, petsCount);
}

export async function deleteCustomerForUser(userId: string, customerId: string) {
  const record = await softDeleteCustomerById(customerId, userId);
  if (!record) throw notFound();
  return { ok: true } as const;
}

export async function listPetsForCustomer(customerId: string) {
  const records = await findActivePetsByCustomerId(customerId);
  return records.map((record) => serializePet(record));
}

export async function getPetForCustomer(customerId: string, petId: string) {
  const record = await findPetByIdForCustomer(customerId, petId);
  if (!record) throw notFound();
  return serializePet(record);
}

export async function createPetForCustomer(customerId: string, input: CreatePetBody) {
  const values: Partial<PetInsert> = {
    customerId,
    name: input.name,
    type: input.type,
    gender: input.gender,
    breed: input.breed ?? null,
    isSterilized: input.isSterilized ?? null,
    isCastrated: input.isCastrated ?? null,
  };

  if (typeof input.dateOfBirth === 'string') {
    values.dateOfBirth = new Date(input.dateOfBirth);
  } else {
    values.dateOfBirth = null;
  }

  const record = await createPet(values as PetInsert);
  if (!record) throw new Error('Failed to create pet');
  return serializePet(record);
}

export async function deletePetForCustomer(customerId: string, petId: string) {
  const record = await findPetByIdForCustomer(customerId, petId);
  if (!record) throw notFound();
  await softDeletePetById(petId);
  return { ok: true } as const;
}
