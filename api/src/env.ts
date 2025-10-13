import 'dotenv/config';
import { z } from 'zod';

const Env = z.object({
  PORT: z.coerce.number().default(3000),
  APP_ORIGIN: z.string().url(),
  JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  TWILIO_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  URL: z.string().url(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_TIME_WINDOW: z
    .union([z.coerce.number().int().positive(), z.string()])
    .default('1 minute'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = Env.parse(process.env);

export const env = {
  ...parsed,
  OAUTH_REDIRECT_URI: `${parsed.URL}/auth/google/callback`,
};
