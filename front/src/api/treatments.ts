import { fetchJson } from '../lib/http';
import {
  createTreatmentBodySchema,
  treatmentResponseSchema,
  treatmentsListResponseSchema,
  updateTreatmentBodySchema,
} from '@contracts/treatments';
import type { CreateTreatmentBody, Treatment, UpdateTreatmentBody } from '@contracts/treatments';

export type {
  CreateTreatmentBody,
  Treatment,
  TreatmentResponse,
  TreatmentsListResponse,
  UpdateTreatmentBody,
} from '@contracts/treatments';

type RequestOptions = {
  signal?: AbortSignal;
};

export async function listTreatments(options: RequestOptions = {}): Promise<Treatment[]> {
  const requestInit = options.signal ? { signal: options.signal } : undefined;
  const json = await fetchJson<unknown>('/treatments', requestInit);
  const result = treatmentsListResponseSchema.parse(json);
  return result.treatments;
}

export async function createTreatment(input: CreateTreatmentBody): Promise<Treatment> {
  const payload = createTreatmentBodySchema.parse(input);
  const json = await fetchJson<unknown>('/treatments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const result = treatmentResponseSchema.parse(json);
  return result.treatment;
}

export async function updateTreatment(id: string, input: UpdateTreatmentBody): Promise<Treatment> {
  const payload = updateTreatmentBodySchema.parse(input);
  const json = await fetchJson<unknown>(`/treatments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  const result = treatmentResponseSchema.parse(json);
  return result.treatment;
}

export async function deleteTreatment(id: string): Promise<void> {
  await fetchJson(`/treatments/${id}`, { method: 'DELETE' });
}
