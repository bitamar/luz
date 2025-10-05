import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../src/app.js';

vi.mock('../src/env.js', () => ({
  env: {
    PORT: 3000,
    APP_ORIGIN: 'http://localhost:5173',
    JWT_SECRET: 'x'.repeat(32),
    DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: 'client-secret',
    TWILIO_SID: 'AC123456789012345678901234567890',
    TWILIO_AUTH_TOKEN: 'twilio-token',
    URL: 'http://localhost:3000',
    RATE_LIMIT_MAX: 2,
    RATE_LIMIT_TIME_WINDOW: 1000,
    OAUTH_REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
  },
}));

describe('app', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildServer({ logger: false });
  });

  afterEach(async () => {
    await app.close();
  });

  it('enforces rate limits across requests', async () => {
    const first = await app.inject({ method: 'GET', url: '/health' });
    const second = await app.inject({ method: 'GET', url: '/health' });
    const third = await app.inject({ method: 'GET', url: '/health' });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(third.statusCode).toBe(429);

    const body = third.json();
    expect(body).toMatchObject({
      error: 'too_many_requests',
      max: 2,
    });
    expect(body).toHaveProperty('reset');
  });

  it('resets rate limit after the configured window', async () => {
    await app.inject({ method: 'GET', url: '/health' });
    await app.inject({ method: 'GET', url: '/health' });
    await app.inject({ method: 'GET', url: '/health' });

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
  });
});
