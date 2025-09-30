import { API_BASE_URL } from '../config';

export async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    const message = (body && (body.error || body.message)) || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return (await response.json()) as T;
}
