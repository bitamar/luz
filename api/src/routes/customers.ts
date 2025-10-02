import type { FastifyInstance } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { customers, pets } from '../db/schema.js';
import { ensureAuthed } from '../plugins/auth.js';

export async function customerRoutes(app: FastifyInstance) {
  app.get('/customers', { preHandler: app.authenticate }, async (req, reply) => {
    ensureAuthed(req);
    const userId = req.user.id;

    type CustomerRow = (typeof customers)['$inferSelect'] & {
      pets: Array<(typeof pets)['$inferSelect']>;
    };
    const rows = (await db.query.customers.findMany({
      where: and(eq(customers.userId, userId), eq(customers.isDeleted, false)),
      with: { pets: true },
    })) as CustomerRow[];

    const result = rows.map(({ id, name, email, phone, address, pets }) => ({
      id,
      name,
      email,
      phone,
      address,
      pets: (pets ?? []).map((p) => ({ id: p.id, name: p.name, type: p.type })),
    }));

    return reply.send({ customers: result });
  });

  app.post('/customers', { preHandler: app.authenticate }, async (req, reply) => {
    ensureAuthed(req);
    const userId = req.user.id;

    const body = req.body as Partial<{
      name: string;
      email?: string;
      phone?: string;
      address?: string;
    }>;
    if (!body?.name) return reply.code(400).send({ error: 'invalid_request' });

    const [row] = await db
      .insert(customers)
      .values({
        userId,
        name: body.name,
        email: body.email ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
      })
      .returning();
    return reply.code(201).send({ customer: row });
  });

  app.put<{ Params: { id: string } }>(
    '/customers/:id',
    { preHandler: app.authenticate },
    async (req, reply) => {
      ensureAuthed(req);
      const userId = req.user.id;

      const { id } = req.params;
      const body = req.body as Partial<{
        name: string;
        email?: string;
        phone?: string;
        address?: string;
      }>;
      const updates: Partial<(typeof customers)['$inferInsert']> = {};
      if (typeof body.name === 'string') updates.name = body.name;
      if (typeof body.email === 'string') updates.email = body.email ?? null;
      if (typeof body.phone === 'string') updates.phone = body.phone ?? null;
      if (typeof body.address === 'string') updates.address = body.address ?? null;
      if (Object.keys(updates).length === 0)
        return reply.code(400).send({ error: 'invalid_request' });

      const [row] = await db
        .update(customers)
        .set({ ...updates })
        .where(and(eq(customers.id, id), eq(customers.userId, userId)))
        .returning();
      if (!row) return reply.code(404).send({ error: 'not_found' });
      return reply.send({ customer: row });
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/customers/:id',
    { preHandler: app.authenticate },
    async (req, reply) => {
      ensureAuthed(req);
      const userId = req.user.id;
      const { id } = req.params;

      const [row] = await db
        .update(customers)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(
          and(eq(customers.id, id), eq(customers.userId, userId), eq(customers.isDeleted, false))
        )
        .returning();
      if (!row) return reply.code(404).send({ error: 'not_found' });
      return reply.send({ ok: true });
    }
  );
}
