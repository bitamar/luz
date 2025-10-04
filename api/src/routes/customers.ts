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
      columns: { id: true, name: true, email: true, phone: true, address: true },
      with: {
        pets: { columns: { id: true, name: true, type: true } },
      },
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
        .where(and(eq(customers.id, id), eq(customers.userId, userId), eq(customers.isDeleted, false)))
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
        .where(and(eq(customers.id, id), eq(customers.userId, userId), eq(customers.isDeleted, false)))
        .returning();
      if (!row) return reply.code(404).send({ error: 'not_found' });
      return reply.send({ ok: true });
    }
  );

  app.get<{ Params: { customerId: string; petId: string } }>(
    '/customers/:customerId/pets/:petId',
    { preHandler: app.authenticate },
    async (req, reply) => {
      ensureAuthed(req);
      const userId = req.user.id;
      const { customerId, petId } = req.params;

      // Find pet with customer info
      const pet = await db.query.pets.findFirst({
        where: and(eq(pets.id, petId), eq(pets.customerId, customerId)),
        with: {
          customer: {
            columns: { id: true, name: true, userId: true, isDeleted: true },
          },
        },
      });

      if (!pet || pet.customer.userId !== userId || pet.customer.isDeleted)
        return reply.code(404).send({ error: 'not_found' });

      return reply.send({ pet });
    }
  );

  app.post<{
    Params: { id: string };
    Body: Partial<{
      name: string;
      type: 'dog' | 'cat';
      gender: 'male' | 'female';
      dateOfBirth?: string | null;
      breed?: string | null;
      isSterilized?: boolean | null;
      isCastrated?: boolean | null;
    }>;
  }>(
    '/customers/:id/pets',
    { preHandler: app.authenticate },
    async (req, reply) => {
      ensureAuthed(req);
      const userId = req.user.id;

      const { id } = req.params;
      const body = req.body ?? {};

      // Basic validation
      const allowedTypes = new Set(['dog', 'cat']);
      const allowedGenders = new Set(['male', 'female']);
      if (typeof body.name !== 'string' || body.name.trim().length === 0)
        return reply.code(400).send({ error: 'invalid_request', message: 'name is required' });
      if (!allowedTypes.has(body.type as string))
        return reply.code(400).send({ error: 'invalid_request', message: 'invalid type' });
      if (!allowedGenders.has(body.gender as string))
        return reply.code(400).send({ error: 'invalid_request', message: 'invalid gender' });

      // Ensure customer exists and belongs to user and is not soft-deleted
      const customer = await db.query.customers.findFirst({
        where: and(eq(customers.id, id), eq(customers.userId, userId), eq(customers.isDeleted, false)),
        columns: { id: true },
      });

      if (!customer) return reply.code(404).send({ error: 'not_found' });

      const dateOfBirth = typeof body.dateOfBirth === 'string' ? new Date(body.dateOfBirth) : null;

      const [pet] = await db
        .insert(pets)
        .values({
          customerId: id,
          name: body.name,
          type: body.type as 'dog' | 'cat',
          gender: body.gender as 'male' | 'female',
          dateOfBirth,
          breed: typeof body.breed === 'string' ? body.breed : null,
          isSterilized: typeof body.isSterilized === 'boolean' ? body.isSterilized : null,
          isCastrated: typeof body.isCastrated === 'boolean' ? body.isCastrated : null,
        })
        .returning();

      return reply.code(201).send({ pet });
    }
  );
}
