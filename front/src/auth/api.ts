import { fetchJson } from '../lib/http';
import type { AuthUser } from './types';
import { API_BASE_URL } from '../config';

export async function getMe(): Promise<{ user: AuthUser } | null> {
  try {
    return await fetchJson<{ user: AuthUser }>('/me');
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await fetchJson('/auth/logout', { method: 'POST' });
}

export function getGoogleLoginUrl(): string {
  return `${API_BASE_URL}/auth/google`;
}

export async function getSettings(): Promise<{ user: AuthUser }> {
  return await fetchJson<{ user: AuthUser }>('/settings');
}

export async function updateSettings(input: { name: string | null; phone: string }): Promise<{
  user: AuthUser;
}> {
  return await fetchJson<{ user: AuthUser }>(
    '/settings',
    {
      method: 'PUT',
      body: JSON.stringify(input),
    }
  );
}
