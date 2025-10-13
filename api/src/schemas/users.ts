import { z } from 'zod';
import { nonEmptyString, nullableString, optionalNullableString, uuidSchema } from './common.js';

export const userSchema = z.object({
  id: uuidSchema,
  email: z.string().trim().email(),
  name: nullableString,
  avatarUrl: nullableString,
  phone: nullableString,
});

export const settingsResponseSchema = z.object({
  user: userSchema,
});

export const updateSettingsBodySchema = z
  .object({
    name: optionalNullableString,
    phone: nonEmptyString,
  })
  .strict();

export type User = z.infer<typeof userSchema>;
export type SettingsResponse = z.infer<typeof settingsResponseSchema>;
export type UpdateSettingsBody = z.infer<typeof updateSettingsBodySchema>;
