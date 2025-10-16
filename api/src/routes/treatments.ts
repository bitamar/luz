import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { db } from '../db/client.js';
import { treatments } from '../db/schema.js';
import { ensureAuthed } from '../plugins/auth.js';
import { conflict, notFound } from '../lib/app-error.js';
import {
  createTreatmentBodySchema,
  deleteTreatmentResponseSchema,
  treatmentParamsSchema,
  treatmentResponseSchema,
  treatmentSchema,
  treatmentsListResponseSchema,
  updateTreatmentBodySchema,
  updateTreatmentParamsSchema,
} from '../schemas/treatments.js';
import { ensureTreatmentOwnership, getOwnedTreatment } from '../middleware/ownership.js';

type TreatmentRow = (typeof treatments)['$inferSelect'];
type TreatmentDto = z.infer<typeof treatmentSchema>;

function serializeTreatment(row: TreatmentRow): TreatmentDto {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    defaultIntervalMonths: row.defaultIntervalMonths ?? null,
    price: row.price ?? null,
  };
}

const treatmentRoutesPlugin: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/treatments',
    { preHandler: app.authenticate, schema: { response: { 200: treatmentsListResponseSchema } } },
    async (req) => {
      ensureAuthed(req);
      const userId = req.user.id;
      const rows = await db.query.treatments.findMany({
        where: and(eq(treatments.userId, userId), eq(treatments.isDeleted, false)),
        orderBy: desc(treatments.updatedAt),
      });
      return { treatments: rows.map((row) => serializeTreatment(row)) };
    }
  );

  app.post(
    '/treatments',
    {
      preHandler: app.authenticate,
      schema: { body: createTreatmentBodySchema, response: { 201: treatmentResponseSchema } },
    },
    async (req, reply) => {
      ensureAuthed(req);
      const userId = req.user.id;
      const { name, defaultIntervalMonths, price } = req.body;

      try {
        const [row] = await db
          .insert(treatments)
          .values({
            userId,
            name,
            defaultIntervalMonths: defaultIntervalMonths ?? null,
            price: price ?? null,
          })
          .returning();

        if (!row) throw new Error('Failed to create treatment');

        return reply.code(201).send({ treatment: serializeTreatment(row) });
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'code' in err &&
          typeof (err as { code?: unknown }).code === 'string' &&
          (err as { code: string }).code === '23505'
        ) {
          throw conflict({ code: 'duplicate_name' });
        }
        throw err;
      }
    }
  );

  app.put(
    '/treatments/:id',
    {
      preHandler: [app.authenticate, ensureTreatmentOwnership('id')],
      schema: {
        params: updateTreatmentParamsSchema,
        body: updateTreatmentBodySchema,
        response: { 200: treatmentResponseSchema },
      },
    },
    async (req) => {
      const treatment = getOwnedTreatment(req);
      const { name, defaultIntervalMonths, price } = req.body;

      const updates: Partial<(typeof treatments)['$inferInsert']> = {};
      if (name !== undefined) updates.name = name;
      if (defaultIntervalMonths !== undefined)
        updates.defaultIntervalMonths = defaultIntervalMonths ?? null;
      if (price !== undefined) updates.price = price ?? null;

      const [row] = await db
        .update(treatments)
        .set({ ...updates, updatedAt: new Date() })
        .where(
          and(
            eq(treatments.id, treatment.id),
            eq(treatments.userId, treatment.userId),
            eq(treatments.isDeleted, false)
          )
        )
        .returning();

      if (!row) throw notFound();

      return { treatment: serializeTreatment(row) };
    }
  );

  app.delete(
    '/treatments/:id',
    {
      preHandler: [app.authenticate, ensureTreatmentOwnership('id')],
      schema: {
        params: treatmentParamsSchema,
        response: {
          200: deleteTreatmentResponseSchema,
        },
      },
    },
    async (req) => {
      const treatment = getOwnedTreatment(req);

      const [row] = await db
        .update(treatments)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(
          and(
            eq(treatments.id, treatment.id),
            eq(treatments.userId, treatment.userId),
            eq(treatments.isDeleted, false)
          )
        )
        .returning({ id: treatments.id });

      if (!row) throw notFound();
      return { ok: true } as const;
    }
  );

  app.get(
    '/treatments/:id',
    {
      preHandler: [app.authenticate, ensureTreatmentOwnership('id')],
      schema: {
        params: treatmentParamsSchema,
        response: {
          200: treatmentResponseSchema,
        },
      },
    },
    async (req) => {
      const treatment = getOwnedTreatment(req);
      return { treatment: serializeTreatment(treatment) };
    }
  );
};

export const treatmentRoutes = treatmentRoutesPlugin;
