import type { FastifyBaseLogger, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

function getBindings(logger: FastifyBaseLogger): Record<string, unknown> {
  const candidate = logger as FastifyBaseLogger & { bindings?: () => Record<string, unknown> };
  if (typeof candidate.bindings !== 'function') return {};
  try {
    return candidate.bindings() ?? {};
  } catch {
    return {};
  }
}

const loggingPluginFn: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (request) => {
    const bindings = getBindings(request.log);
    if (bindings.requestId !== request.id) {
      request.log = request.log.child({ requestId: request.id });
    }
    request.log.debug(
      {
        method: request.method,
        url: request.url,
      },
      'request_started'
    );
  });

  app.addHook('preHandler', async (request) => {
    const user = request.user;
    if (!user) return;

    const bindings = getBindings(request.log);
    if (bindings.userId === user.id) return;

    request.log = request.log.child({
      userId: user.id,
      sessionId: request.sessionId,
    });
  });

  app.addHook('onResponse', async (request, reply) => {
    request.log.info(
      {
        statusCode: reply.statusCode,
        responseTime: reply.getResponseTime(),
      },
      'request_completed'
    );
  });
};

export const loggingPlugin = fp(loggingPluginFn, { name: 'logging-plugin' });
