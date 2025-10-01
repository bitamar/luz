import { env } from './env.js';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import Fastify from 'fastify';
import { authRoutes } from './routes/auth.js';
import { inboundRoutes } from './routes/inbound.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: env.APP_ORIGIN, credentials: true });
await app.register(cookie, { secret: env.JWT_SECRET });
await app.register(formbody);

await app.register(authRoutes);
await app.register(inboundRoutes);

app.get('/health', async () => ({ ok: true }));

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
