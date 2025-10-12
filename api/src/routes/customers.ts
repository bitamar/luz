import type { FastifyInstance } from 'fastify';
import { and, count, eq, inArray } from 'drizzle-orm';
import { db } from '../db/client.js';
import { customers, pets } from '../db/schema.js';
import { ensureAuthed } from '../plugins/auth.js';
import { badRequest, notFound } from '../lib/app-error.js';

export async function customerRoutes(app: FastifyInstance) {
  async function getPetsCountForCustomers(customerIds: string[]) {
    if (customerIds.length === 0) return new Map<string, number>();

    const rows = await db
      .select({ customerId: pets.customerId, count: count(pets.id) })
      .from(pets)
      .where(and(inArray(pets.customerId, customerIds), eq(pets.isDeleted, false)))
      .groupBy(pets.customerId);

    const counts = new Map<string, number>();
    for (const row of rows) {
      const customerId = row.customerId;
      if (!customerId) continue;
      const rawCount = row.count;
      const numericCount = Number(rawCount ?? 0);
      counts.set(customerId, Number.isNaN(numericCount) ? 0 : numericCount);
    }

    return counts;
  }

  async function getPetsCount(customerId: string) {
    const counts = await getPetsCountForCustomers([customerId]);
    return counts.get(customerId) ?? 0;
  }

  async function fetchCustomerWithPets(customerId: string, userId: string) {
    try {
      const row = await db.query.customers.findFirst({
        where: and(
          eq(customers.id, customerId),
          eq(customers.userId, userId),
          eq(customers.isDeleted, false)
        ),
        columns: { id: true, name: true, email: true, phone: true, address: true },
      });

      if (!row) return null;

      const petsCount = await getPetsCount(customerId);

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        petsCount,
      };
    } catch (error) {
      console.error('Error in fetchCustomerWithPets:', error);
      throw error;
    }
  }

  app.get('/customers', { preHandler: app.authenticate }, async (req, reply) => {
    ensureAuthed(req);
    const userId = req.user.id;

    const rows = await db.query.customers.findMany({
      where: and(eq(customers.userId, userId), eq(customers.isDeleted, false)),
      columns: { id: true, name: true, email: true, phone: true, address: true },
    });

    const petsCounts = await getPetsCountForCustomers(rows.map((row) => row.id));

    const result = rows.map(({ id, name, email, phone, address }) => ({
      id,
      name,
      email,
      phone,
      address,
      petsCount: petsCounts.get(id) ?? 0,
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

      // Find pet with customer info for verification only
      const pet = await db.query.pets.findFirst({
        where: and(eq(pets.id, petId), eq(pets.customerId, customerId)),
        with: {
          customer: {
            columns: { id: true, name: true, userId: true, isDeleted: true },
          },
        },
      });

      if (!pet || pet.customer.userId !== userId || pet.customer.isDeleted) throw notFound();

      // Return pet without the nested customer object
      const { customer: _customer, ...petData } = pet;
      return reply.send({ pet: petData });
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
