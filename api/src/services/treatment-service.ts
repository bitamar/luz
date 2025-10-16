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
  defaultIntervalMonths?: number | null;
  price?: number | null;
};

type UpdateTreatmentInput = {
  name?: string;
  defaultIntervalMonths?: number | null;
  price?: number | null;
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

function applyTreatmentInput(
  target: Partial<TreatmentInsert>,
  input: CreateTreatmentInput | UpdateTreatmentInput
) {
  if ('name' in input && input.name !== undefined) target.name = input.name;
  if ('defaultIntervalMonths' in input && input.defaultIntervalMonths !== undefined) {
    target.defaultIntervalMonths = input.defaultIntervalMonths ?? null;
  }
  if ('price' in input && input.price !== undefined) {
    target.price = input.price ?? null;
  }
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
    const values: Partial<TreatmentInsert> = { userId };
    applyTreatmentInput(values, input);
    const record = await createTreatment(values);
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
  applyTreatmentInput(updates, input);

  const record = await updateTreatmentById(treatmentId, userId, updates);
  if (!record) throw notFound();
  return serializeTreatment(record);
}

export async function deleteTreatmentForUser(userId: string, treatmentId: string) {
  const record = await softDeleteTreatmentById(treatmentId, userId);
  if (!record) throw notFound();
  return { ok: true } as const;
}
