import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const { twilioMock, createMock } = vi.hoisted(() => {
  const create = vi.fn();
  const twilio = vi.fn(() => ({ messages: { create } }));
  return { twilioMock: twilio, createMock: create };
});

vi.mock('twilio', () => ({
  __esModule: true,
  default: twilioMock,
}));

vi.mock('../../src/env.js', () => ({
  env: {
    APP_ORIGIN: 'http://localhost:5173',
    JWT_SECRET: 'x'.repeat(32),
    DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: 'client-secret',
    TWILIO_SID: 'AC123456789012345678901234567890',
    TWILIO_AUTH_TOKEN: 'twilio-token',
    TWILIO_WHATSAPP_FROM: 'whatsapp:+19854651922',
    URL: 'http://localhost:3000',
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_TIME_WINDOW: 1000,
    OAUTH_REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
    NODE_ENV: 'test',
  },
}));

describe('routes/inbound', () => {
  let app: FastifyInstance;
  let buildServer: typeof import('../../src/app.js').buildServer;

  beforeAll(async () => {
    const module = await import('../../src/app.js');
    buildServer = module.buildServer;
    app = await buildServer({ logger: false, trustProxy: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    createMock.mockReset();
    twilioMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('responds to inbound WhatsApp message and sends reply via Twilio', async () => {
    createMock.mockResolvedValue({ sid: 'SM123' });

    const res = await app.inject({
      method: 'POST',
      url: '/inbound',
      payload: {
        From: 'whatsapp:+1234567890',
        Body: 'שלום',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    expect(twilioMock).toHaveBeenCalledWith('AC123456789012345678901234567890', 'twilio-token');
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'whatsapp:+19854651922',
        to: 'whatsapp:+1234567890',
        body: 'קיבלתי ממך: שלום',
      })
    );
  });
});
