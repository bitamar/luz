import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, fetchJson } from '../../lib/http';

const BASE_URL = 'https://api.example.test';

describe('fetchJson', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', BASE_URL);
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('performs successful GET requests and parses json', async () => {
    const data = { ok: true };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(data),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchJson('/customers');

    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/customers`, {
      credentials: 'include',
      headers: {},
    });
    expect(result).toEqual(data);
  });

  it('adds json headers when body is provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchJson('/customers', { method: 'POST', body: JSON.stringify({}) });

    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/customers`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({}),
    });
  });

  it('throws HttpError including parsed error response', async () => {
    const body = { error: 'bad_request' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue(body),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchJson('/customers')).rejects.toEqual(new HttpError(400, 'bad_request', body));
  });

  it('falls back to status message when error body is unavailable', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('no body')),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchJson('/customers')).rejects.toEqual(
      new HttpError(500, 'Request failed: 500', undefined)
    );
  });
});
