import 'dotenv/config';
import { z } from 'zod';

const Env = z.object({
  PORT: z.coerce.number().default(3000),
  APP_ORIGIN: z.string().url(),
  JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  URL: z.string().url(),
});

const parsed = Env.parse(process.env);

export const env = {
  ...parsed,
  OAUTH_REDIRECT_URI: `${parsed.URL}/auth/google/callback`,
};
