import { and, count, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { db } from '../db/client.js';
import { customers, pets } from '../db/schema.js';
import { ensureAuthed } from '../plugins/auth.js';
import { notFound } from '../lib/app-error.js';
import {
  createCustomerBodySchema,
  createPetBodySchema,
  createPetParamsSchema,
  customerPetParamsSchema,
  customerPetsParamsSchema,
  customerPetsResponseSchema,
  customerResponseSchema,
  customersListResponseSchema,
  customerSchema,
  deleteCustomerParamsSchema,
  petResponseSchema,
  petSchema,
  updateCustomerBodySchema,
  updateCustomerParamsSchema,
} from '../schemas/customers.js';
import { okResponseSchema } from '../schemas/common.js';

type CustomerRow = Pick<
  (typeof customers)['$inferSelect'],
  'id' | 'name' | 'email' | 'phone' | 'address'
>;
type CustomerDto = z.infer<typeof customerSchema>;
type PetRow = Pick<
  (typeof pets)['$inferSelect'],
  | 'id'
  | 'customerId'
  | 'name'
  | 'type'
  | 'gender'
  | 'dateOfBirth'
  | 'breed'
  | 'isSterilized'
  | 'isCastrated'
>;
type PetDto = z.infer<typeof petSchema>;

const customerRoutesPlugin: FastifyPluginAsyncZod = async (app) => {
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

  function cleanNullableString(value: string | null | undefined): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  function buildCustomer(row: CustomerRow, petsCount: number): CustomerDto {
    return {
      id: row.id,
      name: row.name.trim(),
      email: cleanNullableString(row.email),
      phone: cleanNullableString(row.phone),
      address: cleanNullableString(row.address),
      petsCount,
    };
  }

  function normalizeDate(value: Date | string | null): string | null {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    return value;
  }

  function serializePet(row: PetRow): PetDto {
    return {
      id: row.id,
      customerId: row.customerId,
      name: row.name.trim(),
      type: row.type,
      gender: row.gender,
      dateOfBirth: normalizeDate(row.dateOfBirth ?? null),
      breed: cleanNullableString(row.breed),
      isSterilized: row.isSterilized ?? null,
      isCastrated: row.isCastrated ?? null,
    };
  }

  app.get(
    '/customers',
    {
      preHandler: app.authenticate,
      schema: {
        response: {
          200: customersListResponseSchema,
        },
      },
    },
    async (req) => {
      ensureAuthed(req);
      const userId = req.user.id;

      const rows = await db.query.customers.findMany({
        where: and(eq(customers.userId, userId), eq(customers.isDeleted, false)),
        columns: { id: true, name: true, email: true, phone: true, address: true },
      });

      const petsCounts = await getPetsCountForCustomers(rows.map((row) => row.id));

      const customersList = rows.map((row) => buildCustomer(row, petsCounts.get(row.id) ?? 0));

      return { customers: customersList };
    }
  );

  app.post(
    '/customers',
    {
      preHandler: app.authenticate,
      schema: {
        body: createCustomerBodySchema,
        response: {
          201: customerResponseSchema,
        },
      },
    },
    async (req, reply) => {
      ensureAuthed(req);
      const userId = req.user.id;
      const { name, email, phone, address } = req.body;

      const [row] = await db
        .insert(customers)
        .values({
          userId,
          name,
          email: email ?? null,
          phone: phone ?? null,
          address: address ?? null,
        })
        .returning({
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
          address: customers.address,
        });

      if (!row) throw new Error('Failed to create customer');

      const customer = buildCustomer(row, 0);
      return reply.code(201).send({ customer });
    }
  );

  app.put(
    '/customers/:id',
    {
      preHandler: app.authenticate,
      schema: {
        params: updateCustomerParamsSchema,
        body: updateCustomerBodySchema,
        response: {
          200: customerResponseSchema,
        },
      },
    },
    async (req) => {
      ensureAuthed(req);
      const userId = req.user.id;
      const { id } = req.params;
      const { name, email, phone, address } = req.body;

      const updates: Partial<(typeof customers)['$inferInsert']> = {};
      if (name !== undefined) updates.name = name;
      if (email !== undefined) updates.email = email ?? null;
      if (phone !== undefined) updates.phone = phone ?? null;
      if (address !== undefined) updates.address = address ?? null;

      const [row] = await db
        .update(customers)
        .set({ ...updates, updatedAt: new Date() })
        .where(
          and(eq(customers.id, id), eq(customers.userId, userId), eq(customers.isDeleted, false))
        )
        .returning({
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
          address: customers.address,
        });

      if (!row) throw notFound();

      const petsCount = await getPetsCount(row.id);
      return { customer: buildCustomer(row, petsCount) };
    }
  );

  app.delete(
    '/customers/:id',
    {
      preHandler: app.authenticate,
      schema: {
        params: deleteCustomerParamsSchema,
        response: {
          200: okResponseSchema,
        },
      },
    },
    async (req) => {
      ensureAuthed(req);
      const userId = req.user.id;
      const { id } = req.params;

      const [row] = await db
        .update(customers)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(
          and(eq(customers.id, id), eq(customers.userId, userId), eq(customers.isDeleted, false))
        )
        .returning({ id: customers.id });

      if (!row) throw notFound();
      return { ok: true } as const;
    }
  );

  app.get(
    '/customers/:customerId/pets/:petId',
    {
      preHandler: app.authenticate,
      schema: {
        params: customerPetParamsSchema,
        response: {
          200: petResponseSchema,
        },
      },
    },
    async (req) => {
      ensureAuthed(req);
      const userId = req.user.id;
      const { customerId, petId } = req.params;

      const pet = await db.query.pets.findFirst({
        where: and(eq(pets.id, petId), eq(pets.customerId, customerId)),
        with: {
          customer: {
            columns: { id: true, userId: true, isDeleted: true },
          },
        },
      });

      if (!pet || pet.customer.userId !== userId || pet.customer.isDeleted) throw notFound();

      const { customer: _customer, ...petData } = pet;
      return { pet: serializePet(petData) };
    }
  );

  app.post(
    '/customers/:id/pets',
    {
      preHandler: app.authenticate,
      schema: {
        params: createPetParamsSchema,
        body: createPetBodySchema,
        response: {
          201: petResponseSchema,
        },
      },
    },
    async (req, reply) => {
      ensureAuthed(req);
      const userId = req.user.id;
      const { id } = req.params;
      const body = req.body;

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
          type: body.type,
          gender: body.gender,
          dateOfBirth,
          breed: body.breed ?? null,
          isSterilized: body.isSterilized ?? null,
          isCastrated: body.isCastrated ?? null,
        })
        .returning();

      if (!pet) throw new Error('Failed to create pet');

      return reply.code(201).send({ pet: serializePet(pet) });
    }
  );

  app.delete(
    '/customers/:customerId/pets/:petId',
    {
      preHandler: app.authenticate,
      schema: {
        params: customerPetParamsSchema,
        response: {
          200: okResponseSchema,
        },
      },
    },
    async (req) => {
      ensureAuthed(req);
      const userId = req.user.id;
      const { customerId, petId } = req.params;

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

      await db
        .update(pets)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(pets.id, petId));

      return { ok: true } as const;
    }
  );

  app.get(
    '/customers/:id/pets',
    {
      preHandler: app.authenticate,
      schema: {
        params: customerPetsParamsSchema,
        response: {
          200: customerPetsResponseSchema,
        },
      },
    },
    async (req) => {
      ensureAuthed(req);
      const userId = req.user.id;
      const { id } = req.params;

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

      return { pets: petRows.map((petRow) => serializePet(petRow)) };
    }
  );
};

export const customerRoutes = customerRoutesPlugin;
