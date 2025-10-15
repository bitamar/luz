import { and, eq } from 'drizzle-orm';
import type { FastifyRequest, preHandlerHookHandler } from 'fastify';
import { db } from '../db/client.js';
import { customers, pets, treatments } from '../db/schema.js';
import { ensureAuthed } from '../plugins/auth.js';
import { notFound } from '../lib/app-error.js';

export type CustomerRecord = (typeof customers)['$inferSelect'];
export type PetRecord = (typeof pets)['$inferSelect'];
export type TreatmentRecord = (typeof treatments)['$inferSelect'];

declare module 'fastify' {
  interface FastifyRequest {
    customer?: CustomerRecord;
    pet?: PetRecord;
    treatment?: TreatmentRecord;
  }
}

type ParamsWithId = Record<string, string | undefined>;

function getParam(params: unknown, key: string): string {
  const value = (params as ParamsWithId | undefined)?.[key];
  if (!value) throw notFound();
  return value;
}

export function ensureCustomerOwnership(paramKey: string): preHandlerHookHandler {
  return async (req) => {
    ensureAuthed(req);
    const customerId = getParam(req.params, paramKey);

    const customer = await db.query.customers.findFirst({
      where: and(
        eq(customers.id, customerId),
        eq(customers.userId, req.user.id),
        eq(customers.isDeleted, false)
      ),
    });

    if (!customer) throw notFound();

    req.customer = customer;
  };
}

export function getOwnedCustomer(req: FastifyRequest): CustomerRecord {
  const customer = req.customer;
  if (!customer) throw notFound();
  return customer;
}

export function ensurePetOwnership(petParamKey: string): preHandlerHookHandler {
  return async (req) => {
    const customer = getOwnedCustomer(req);
    const petId = getParam(req.params, petParamKey);

    const pet = await db.query.pets.findFirst({
      where: and(eq(pets.id, petId), eq(pets.customerId, customer.id), eq(pets.isDeleted, false)),
    });

    if (!pet) throw notFound();

    req.pet = pet;
  };
}

export function getOwnedPet(req: FastifyRequest): PetRecord {
  const pet = req.pet;
  if (!pet) throw notFound();
  return pet;
}

export function ensureTreatmentOwnership(paramKey: string): preHandlerHookHandler {
  return async (req) => {
    ensureAuthed(req);
    const treatmentId = getParam(req.params, paramKey);

    const treatment = await db.query.treatments.findFirst({
      where: and(
        eq(treatments.id, treatmentId),
        eq(treatments.userId, req.user.id),
        eq(treatments.isDeleted, false)
      ),
    });

    if (!treatment) throw notFound();

    req.treatment = treatment;
  };
}

export function getOwnedTreatment(req: FastifyRequest): TreatmentRecord {
  const treatment = req.treatment;
  if (!treatment) throw notFound();
  return treatment;
}
