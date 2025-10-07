import type { FastifyInstance } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { customers, pets } from '../db/schema.js';
import { ensureAuthed } from '../plugins/auth.js';
import { badRequest, notFound } from '../lib/app-error.js';

export async function customerRoutes(app: FastifyInstance) {
  async function fetchCustomerWithPets(customerId: string, userId: string) {
    const row = await db.query.customers.findFirst({
      where: and(
        eq(customers.id, customerId),
        eq(customers.userId, userId),
        eq(customers.isDeleted, false)
      ),
      columns: { id: true, name: true, email: true, phone: true, address: true },
    });

    if (!row) return null;

    const petRows = await db.query.pets.findMany({
      where: and(eq(pets.customerId, customerId), eq(pets.isDeleted, false)),
      columns: { id: true, name: true, type: true },
      orderBy: (p, { asc }) => asc(p.createdAt),
    });

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      pets: petRows.map((pet) => ({ id: pet.id, name: pet.name, type: pet.type })),
    };
  }

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
        pets: {
          columns: { id: true, name: true, type: true },
          where: and(eq(pets.customerId, customers.id), eq(pets.isDeleted, false)),
        },
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
    if (!body?.name) throw badRequest({ message: 'name is required' });

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
    if (!row) throw new Error('Failed to create customer');
    const customerWithPets = await fetchCustomerWithPets(row.id, userId);
    return reply.code(201).send({ customer: customerWithPets ?? row });
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
      if (Object.keys(updates).length === 0) throw badRequest({ message: 'No updates provided' });

      const [row] = await db
        .update(customers)
        .set({ ...updates })
        .where(
          and(eq(customers.id, id), eq(customers.userId, userId), eq(customers.isDeleted, false))
        )
        .returning();
      if (!row) throw notFound();
      const customerWithPets = await fetchCustomerWithPets(row.id, userId);
      return reply.send({ customer: customerWithPets ?? row });
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
      if (!row) throw notFound();
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

      if (!pet || pet.customer.userId !== userId || pet.customer.isDeleted) throw notFound();

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
  }>('/customers/:id/pets', { preHandler: app.authenticate }, async (req, reply) => {
    ensureAuthed(req);
    const userId = req.user.id;

    const { id } = req.params;
    const body = req.body ?? {};

    // Basic validation
    const allowedTypes = new Set(['dog', 'cat']);
    const allowedGenders = new Set(['male', 'female']);
    if (typeof body.name !== 'string' || body.name.trim().length === 0)
      throw badRequest({ message: 'name is required' });
    if (!allowedTypes.has(body.type as string)) throw badRequest({ message: 'invalid type' });
    if (!allowedGenders.has(body.gender as string)) throw badRequest({ message: 'invalid gender' });

    // Ensure customer exists and belongs to user and is not soft-deleted
    const customer = await db.query.customers.findFirst({
      where: and(
        eq(customers.id, id),
        eq(customers.userId, userId),
        eq(customers.isDeleted, false)
      ),
      columns: { id: true },
    });

    if (!customer) throw notFound();

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
    if (!pet) throw new Error('Failed to create pet');

    return reply.code(201).send({ pet });
  });

  app.delete<{
    Params: { customerId: string; petId: string };
  }>('/customers/:customerId/pets/:petId', { preHandler: app.authenticate }, async (req, reply) => {
    ensureAuthed(req);
    const userId = req.user.id;
    const { customerId, petId } = req.params;

    // Ensure pet exists and belongs to user's customer
    const pet = await db.query.pets.findFirst({
      where: and(eq(pets.id, petId), eq(pets.customerId, customerId)),
      with: {
        customer: {
          columns: { id: true, userId: true, isDeleted: true },
        },
      },
    });

    if (!pet || pet.customer.userId !== userId || pet.customer.isDeleted) {
      throw notFound();
    }

    await db.update(pets).set({ isDeleted: true, updatedAt: new Date() }).where(eq(pets.id, petId));

    return reply.send({ ok: true });
  });

  app.get<{ Params: { id: string } }>(
    '/customers/:id/pets',
    { preHandler: app.authenticate },
    async (req, reply) => {
      ensureAuthed(req);
      const userId = req.user.id;
      const { id } = req.params;

      // Check if the customer exists and belongs to the user
      const customer = await db.query.customers.findFirst({
        where: and(
          eq(customers.id, id),
          eq(customers.userId, userId),
          eq(customers.isDeleted, false)
        ),
        columns: { id: true },
      });

      if (!customer) throw notFound();

      const petRows = await db.query.pets.findMany({
        where: and(eq(pets.customerId, id), eq(pets.isDeleted, false)),
        orderBy: (p, { asc }) => asc(p.createdAt),
      });

      return reply.send({ pets: petRows });
    }
  );
}
