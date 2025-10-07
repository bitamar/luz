import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import formbody from '@fastify/formbody';
import Fastify, { type FastifyServerOptions } from 'fastify';
import { env } from './env.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { inboundRoutes } from './routes/inbound.js';
import { treatmentRoutes } from './routes/treatments.js';
import { customerRoutes } from './routes/customers.js';
import { authPlugin } from './plugins/auth.js';
import { errorPlugin } from './plugins/errors.js';

export async function buildServer(options: FastifyServerOptions = {}) {
  const app = Fastify({ logger: true, ...options });

  await app.register(cors, {
    origin: env.APP_ORIGIN,
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
    preflight: true,
    preflightContinue: false,
  });
  await app.register(cookie, { secret: env.JWT_SECRET });
  await app.register(formbody);
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIME_WINDOW,
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: 'too_many_requests',
      max: context.max,
      reset: context.ttl,
    }),
  });
  await app.register(authPlugin);
  await app.register(errorPlugin);

  await app.register(authRoutes);
  await app.register(userRoutes);
  await app.register(inboundRoutes);
  await app.register(treatmentRoutes);
  await app.register(customerRoutes);

  app.get('/health', async () => ({ ok: true }));

  return app;
}
