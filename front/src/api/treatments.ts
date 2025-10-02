import { fetchJson } from '../lib/http';

export interface Treatment {
  id: string;
  userId: string;
  name: string;
  defaultIntervalMonths: number | null;
  price: number | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listTreatments(): Promise<Treatment[]> {
  const result = await fetchJson<{ treatments: Treatment[] }>('/treatments');
  return result.treatments;
}

export async function createTreatment(input: {
  name: string;
  defaultIntervalMonths?: number | null;
  price?: number | null;
}): Promise<Treatment> {
  const result = await fetchJson<{ treatment: Treatment }>('/treatments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.treatment;
}

export async function updateTreatment(
  id: string,
  input: { name?: string; defaultIntervalMonths?: number | null; price?: number | null }
): Promise<Treatment> {
  const result = await fetchJson<{ treatment: Treatment }>(`/treatments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return result.treatment;
}

export async function deleteTreatment(id: string): Promise<void> {
  await fetchJson(`/treatments/${id}`, { method: 'DELETE' });
}
