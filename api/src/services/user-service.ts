import { z } from 'zod';
import { updateUserById, type UserRecord } from '../repositories/user-repository.js';
import { conflict, notFound } from '../lib/app-error.js';
import { settingsResponseSchema, userSchema } from '../schemas/users.js';

const userDto = userSchema;

export type UserDto = z.infer<typeof userDto>;
export type SettingsResponse = z.infer<typeof settingsResponseSchema>;

type UpdateSettingsInput = {
  name?: string | null;
  phone?: string | null;
};

export function serializeUser(record: Pick<UserRecord, 'id' | 'email' | 'name' | 'avatarUrl' | 'phone'>): UserDto {
  return {
    id: record.id,
    email: record.email,
    name: record.name ?? null,
    avatarUrl: record.avatarUrl ?? null,
    phone: record.phone ?? null,
  };
}

export function getSettingsFromUser(record: Pick<UserRecord, 'id' | 'email' | 'name' | 'avatarUrl' | 'phone'>) {
  return {
    user: serializeUser(record),
  } satisfies SettingsResponse;
}

export async function updateSettingsForUser(userId: string, input: UpdateSettingsInput) {
  try {
    const record = await updateUserById(userId, {
      name: input.name ?? null,
      phone: input.phone ?? null,
      updatedAt: new Date(),
    });

    if (!record) throw notFound();

    return getSettingsFromUser(record);
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      typeof (err as { code?: unknown }).code === 'string' &&
      (err as { code: string }).code === '23505'
    ) {
      throw conflict({ code: 'duplicate_phone' });
    }
    throw err;
  }
}
