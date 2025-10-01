import type { FastifyInstance } from 'fastify';
import { env } from '../env.js';
import twilio from 'twilio';

const client = twilio(env.TWILIO_SID, env.TWILIO_AUTH_TOKEN);

type TwilioInboundBody = {
  SmsMessageSid?: string;
  From?: string; // e.g. "whatsapp:+14155551234"
  Body?: string;
  [key: string]: unknown;
};

export async function inboundRoutes(app: FastifyInstance) {
  app.post<{ Body: TwilioInboundBody }>('/inbound', async (req) => {
    req.log.info({ body: req.body }, 'inbound');

    const from = req.body.From;
    const message = req.body.Body;

    if (from && message) {
      await client.messages.create({
        from: 'whatsapp:+19854651922',
        to: from,
        body: `קיבלתי ממך: ${message}`,
      });
    }

    return { ok: true };
  });
}
