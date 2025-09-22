import 'dotenv/config';
import { z } from 'zod';

const Env = z.object({
  PORT: z.coerce.number().default(3000),
  APP_ORIGIN: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be ≥32 chars'),
});

export const env = Env.parse(process.env);
