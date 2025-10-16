import { z } from 'zod';
import {
  createTreatment,
  findActiveTreatmentsByUserId,
  findTreatmentByIdForUser,
  softDeleteTreatmentById,
  updateTreatmentById,
  type TreatmentInsert,
  type TreatmentRecord,
} from '../repositories/treatment-repository.js';
import { conflict, notFound } from '../lib/app-error.js';
import { treatmentSchema } from '../schemas/treatments.js';

type TreatmentDto = z.infer<typeof treatmentSchema>;

type CreateTreatmentInput = {
  name: string;
  defaultIntervalMonths?: number | null | undefined;
  price?: number | null | undefined;
};

type UpdateTreatmentInput = {
  name?: string | undefined;
  defaultIntervalMonths?: number | null | undefined;
  price?: number | null | undefined;
};

function serializeTreatment(record: TreatmentRecord): TreatmentDto {
  return {
    id: record.id,
    userId: record.userId,
    name: record.name,
    defaultIntervalMonths: record.defaultIntervalMonths ?? null,
    price: record.price ?? null,
  };
}

export async function listTreatmentsForUser(userId: string) {
  const records = await findActiveTreatmentsByUserId(userId);
  return records.map((record) => serializeTreatment(record));
}

export async function getTreatmentForUser(userId: string, treatmentId: string) {
  const record = await findTreatmentByIdForUser(userId, treatmentId);
  if (!record) throw notFound();
  return serializeTreatment(record);
}

export async function createTreatmentForUser(userId: string, input: CreateTreatmentInput) {
  try {
    const record = await createTreatment({
      userId,
      name: input.name,
      defaultIntervalMonths: input.defaultIntervalMonths ?? null,
      price: input.price ?? null,
    });
    if (!record) throw new Error('Failed to create treatment');
    return serializeTreatment(record);
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      typeof (err as { code?: unknown }).code === 'string' &&
      (err as { code: string }).code === '23505'
    ) {
      throw conflict({ code: 'duplicate_name' });
    }
    throw err;
  }
}

export async function updateTreatmentForUser(
  userId: string,
  treatmentId: string,
  input: UpdateTreatmentInput
) {
  const updates: Partial<TreatmentInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.defaultIntervalMonths !== undefined) {
    updates.defaultIntervalMonths = input.defaultIntervalMonths ?? null;
  }
  if (input.price !== undefined) {
    updates.price = input.price ?? null;
  }

  const record = await updateTreatmentById(treatmentId, userId, updates);
  if (!record) throw notFound();
  return serializeTreatment(record);
}

export async function deleteTreatmentForUser(userId: string, treatmentId: string) {
  const record = await softDeleteTreatmentById(treatmentId, userId);
  if (!record) throw notFound();
  return { ok: true } as const;
}
