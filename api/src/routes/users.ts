import type { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { ensureAuthed } from '../plugins/auth.js';
import { eq } from 'drizzle-orm';
import { badRequest, conflict, notFound } from '../lib/app-error.js';

type UpdateSettingsBody = { name?: string | null; phone: string };

export async function userRoutes(app: FastifyInstance) {
  app.get('/settings', { preHandler: app.authenticate }, async (req, reply) => {
    ensureAuthed(req);
    const { user } = req;
    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        phone: user.phone ?? null,
      },
    });
  });

  app.put<{ Body: UpdateSettingsBody }>(
    '/settings',
    { preHandler: app.authenticate },
    async (req, reply) => {
      ensureAuthed(req);
      const userId = req.user.id;

      const { name, phone } = req.body ?? ({} as UpdateSettingsBody);
      if (typeof phone !== 'string' || phone.trim().length === 0) {
        throw badRequest({ code: 'phone_required', message: 'phone is required' });
      }

      const normalizedPhone = phone.trim();
      const nextName = typeof name === 'string' ? name : null;

      try {
        const [row] = await db
          .update(users)
          .set({ name: nextName, phone: normalizedPhone, updatedAt: new Date() })
          .where(eq(users.id, userId))
          .returning();

        if (!row) throw notFound();

        return reply.send({
          user: {
            id: row.id,
            email: row.email,
            name: row.name,
            avatarUrl: row.avatarUrl,
            phone: row.phone ?? null,
          },
        });
      } catch (err: unknown) {
        // Unique (phone) constraint -> 409 conflict
        if (
          err &&
          typeof err === 'object' &&
          'code' in err &&
          typeof (err as { code?: unknown }).code === 'string' &&
          (err as { code: string }).code === '23505'
        ) {
          throw conflict({ code: 'duplicate_phone' });
        }
        throw err;
      }
    }
  );
}
