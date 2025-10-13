import { fetchJson } from '../lib/http';
import { API_BASE_URL } from '../config';
import { settingsResponseSchema, updateSettingsBodySchema } from '@contracts/users';
import type { SettingsResponse, UpdateSettingsBody } from '@contracts/users';

export async function getMe(): Promise<SettingsResponse | null> {
  try {
    const json = await fetchJson<unknown>('/me');
    return settingsResponseSchema.parse(json);
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

export async function getSettings(): Promise<SettingsResponse> {
  const json = await fetchJson<unknown>('/settings');
  return settingsResponseSchema.parse(json);
}

export async function updateSettings(input: UpdateSettingsBody): Promise<SettingsResponse> {
  const payload = updateSettingsBodySchema.parse(input);
  const json = await fetchJson<unknown>('/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return settingsResponseSchema.parse(json);
}
