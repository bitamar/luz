import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ensureAuthed } from '../plugins/auth.js';
import {
  createTreatmentBodySchema,
  deleteTreatmentResponseSchema,
  treatmentParamsSchema,
  treatmentResponseSchema,
  treatmentsListResponseSchema,
  updateTreatmentBodySchema,
  updateTreatmentParamsSchema,
} from '../schemas/treatments.js';
import { ensureTreatmentOwnership } from '../middleware/ownership.js';
import {
  createTreatmentForUser,
  deleteTreatmentForUser,
  getTreatmentForUser,
  listTreatmentsForUser,
  updateTreatmentForUser,
} from '../services/treatment-service.js';

const treatmentRoutesPlugin: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/treatments',
    { preHandler: app.authenticate, schema: { response: { 200: treatmentsListResponseSchema } } },
    async (req) => {
      ensureAuthed(req);
      const treatments = await listTreatmentsForUser(req.user.id);
      return { treatments };
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
      const treatment = await createTreatmentForUser(req.user.id, req.body);
      return reply.code(201).send({ treatment });
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
      ensureAuthed(req);
      const { id } = req.params;
      const treatment = await updateTreatmentForUser(req.user.id, id, req.body);
      return { treatment };
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
      ensureAuthed(req);
      const { id } = req.params;
      return deleteTreatmentForUser(req.user.id, id);
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
      ensureAuthed(req);
      const { id } = req.params;
      const treatment = await getTreatmentForUser(req.user.id, id);
      return { treatment };
    }
  );
};

export const treatmentRoutes = treatmentRoutesPlugin;
