import twilio from 'twilio';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { env } from '../env.js';
import { okResponseSchema } from '../schemas/common.js';
import { inboundBodySchema } from '../schemas/inbound.js';

const client = twilio(env.TWILIO_SID, env.TWILIO_AUTH_TOKEN);

const inboundRoutesPlugin: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/inbound',
    { schema: { body: inboundBodySchema, response: { 200: okResponseSchema } } },
    async (req) => {
      req.log.info({ body: req.body }, 'inbound');

      const from = req.body.From;
      const message = req.body.Body;

      await client.messages.create({
        from: 'whatsapp:+19854651922',
        to: from,
        body: `קיבלתי ממך: ${message}`,
      });

      return { ok: true } as const;
    }
  );
};

export const inboundRoutes = inboundRoutesPlugin;
