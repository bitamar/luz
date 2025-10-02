import type { FastifyInstance } from 'fastify';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { treatments } from '../db/schema.js';
import { ensureAuthed } from '../plugins/auth.js';

type CreateBody = { name: string; defaultIntervalMonths?: number | null; price?: number | null };
type UpdateBody = { name?: string; defaultIntervalMonths?: number | null; price?: number | null };

export async function treatmentRoutes(app: FastifyInstance) {
  app.get('/treatments', { preHandler: app.authenticate }, async (req, reply) => {
    ensureAuthed(req);
    const userId = req.user.id;
    const rows = await db.query.treatments.findMany({
      where: and(eq(treatments.userId, userId), eq(treatments.isDeleted, false)),
      orderBy: desc(treatments.updatedAt),
    });
    return reply.send({ treatments: rows });
  });

  app.post<{ Body: CreateBody }>(
    '/treatments',
    { preHandler: app.authenticate },
    async (req, reply) => {
      ensureAuthed(req);
      const userId = req.user.id;

      const { name, defaultIntervalMonths, price } = req.body ?? {};
      if (!name) return reply.code(400).send({ error: 'invalid_request' });

      try {
        const [row] = await db
          .insert(treatments)
          .values({
            userId,
            name,
            defaultIntervalMonths:
              typeof defaultIntervalMonths === 'number' ? defaultIntervalMonths : null,
            price: typeof price === 'number' ? price : null,
          })
          .returning();
        return reply.code(201).send({ treatment: row });
      } catch (err: unknown) {
        // Unique (userId, name) constraint -> 409 conflict
        if (
          err &&
          typeof err === 'object' &&
          'code' in err &&
          typeof (err as { code?: unknown }).code === 'string' &&
          (err as { code: string }).code === '23505'
        ) {
          return reply.code(409).send({ error: 'duplicate_name' });
        }
        throw err;
      }
    }
  );

  app.put<{ Params: { id: string }; Body: UpdateBody }>(
    '/treatments/:id',
    { preHandler: app.authenticate },
    async (req, reply) => {
      ensureAuthed(req);
      const userId = req.user.id;

      const { id } = req.params;
      const { name, defaultIntervalMonths, price } = req.body ?? {};
      const updates: Record<string, unknown> = {};
      if (typeof name === 'string') updates['name'] = name;
      if (typeof defaultIntervalMonths === 'number' || defaultIntervalMonths === null)
        updates['defaultIntervalMonths'] = defaultIntervalMonths;
      if (typeof price === 'number' || price === null) updates['price'] = price;
      if (Object.keys(updates).length === 0)
        return reply.code(400).send({ error: 'invalid_request' });

      const [row] = await db
        .update(treatments)
        .set({ ...updates, updatedAt: new Date() })
        .where(
          and(eq(treatments.id, id), eq(treatments.userId, userId), eq(treatments.isDeleted, false))
        )
        .returning();
      if (!row) return reply.code(404).send({ error: 'not_found' });
      return reply.send({ treatment: row });
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/treatments/:id',
    { preHandler: app.authenticate },
    async (req, reply) => {
      ensureAuthed(req);
      const userId = req.user.id;

      const { id } = req.params;
      const [row] = await db
        .update(treatments)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(
          and(eq(treatments.id, id), eq(treatments.userId, userId), eq(treatments.isDeleted, false))
        )
        .returning();
      if (!row) return reply.code(404).send({ error: 'not_found' });
      return reply.send({ ok: true });
    }
  );

  app.get<{ Params: { id: string } }>(
    '/treatments/:id',
    { preHandler: app.authenticate },
    async (req, reply) => {
      ensureAuthed(req);
      const userId = req.user.id;

      const { id } = req.params;
      const rows = await db.query.treatments.findMany({
        where: and(
          eq(treatments.id, id),
          eq(treatments.userId, userId),
          eq(treatments.isDeleted, false)
        ),
        limit: 1,
      });
      const row = rows[0];
      if (!row) return reply.code(404).send({ error: 'not_found' });
      return reply.send({ treatment: row });
    }
  );
}
