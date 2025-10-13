import { z } from 'zod';
import { nonEmptyString } from './common.js';

export const inboundBodySchema = z
  .object({
    SmsMessageSid: z.string().optional(),
    From: nonEmptyString,
    Body: nonEmptyString,
  })
  .passthrough();
