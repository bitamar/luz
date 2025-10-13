import twilio from 'twilio';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { env } from '../env.js';
import { okResponseSchema } from '../schemas/common.js';
import { inboundBodySchema } from '../schemas/inbound.js';

const inboundRoutesPlugin: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/inbound',
    { schema: { body: inboundBodySchema, response: { 200: okResponseSchema } } },
    async (req) => {
      req.log.info({ body: req.body }, 'inbound');

      const from = req.body.From;
      const message = req.body.Body;

      const client = twilio(env.TWILIO_SID, env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        from: env.TWILIO_WHATSAPP_FROM,
        to: from,
        body: `קיבלתי ממך: ${message}`,
      });

      return { ok: true } as const;
    }
  );
};

export const inboundRoutes = inboundRoutesPlugin;
