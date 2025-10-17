import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTreatment,
  deleteTreatment,
  listTreatments,
  updateTreatment,
} from '../../api/treatments';
import { fetchJson } from '../../lib/http';

vi.mock('../../lib/http', () => ({
  fetchJson: vi.fn(),
}));

const fetchJsonMock = vi.mocked(fetchJson);

const treatment = {
  id: '33333333-3333-4333-8333-333333333333',
  userId: '44444444-4444-4444-8444-444444444444',
  name: 'Vaccination',
  defaultIntervalMonths: 12,
  price: 200,
};

describe('treatments api', () => {
  beforeEach(() => {
    fetchJsonMock.mockReset();
  });

  it('listTreatments forwards signal and returns parsed treatments', async () => {
    const controller = new AbortController();
    fetchJsonMock.mockResolvedValueOnce({ treatments: [treatment] });

    const result = await listTreatments({ signal: controller.signal });

    expect(fetchJsonMock).toHaveBeenCalledWith('/treatments', { signal: controller.signal });
    expect(result).toEqual([treatment]);
  });

  it('listTreatments works without options', async () => {
    fetchJsonMock.mockResolvedValueOnce({ treatments: [treatment] });

    const result = await listTreatments();

    expect(fetchJsonMock).toHaveBeenCalledWith('/treatments', undefined);
    expect(result).toEqual([treatment]);
  });

  it('createTreatment sends payload and returns created treatment', async () => {
    const payload = { name: treatment.name, defaultIntervalMonths: 12, price: 200 };
    fetchJsonMock.mockResolvedValueOnce({ treatment });

    const result = await createTreatment(payload);

    expect(fetchJsonMock).toHaveBeenCalledWith('/treatments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(treatment);
  });

  it('updateTreatment sends payload with id and returns updated treatment', async () => {
    const payload = { name: 'Updated Name' };
    const updated = { ...treatment, ...payload };
    fetchJsonMock.mockResolvedValueOnce({ treatment: updated });

    const result = await updateTreatment(treatment.id, payload);

    expect(fetchJsonMock).toHaveBeenCalledWith(`/treatments/${treatment.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(updated);
  });

  it('deleteTreatment sends delete request', async () => {
    fetchJsonMock.mockResolvedValueOnce(undefined);

    await deleteTreatment(treatment.id);

    expect(fetchJsonMock).toHaveBeenCalledWith(`/treatments/${treatment.id}`, {
      method: 'DELETE',
    });
  });
});
