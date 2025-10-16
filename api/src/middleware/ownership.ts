import type { FastifyRequest, preHandlerHookHandler } from 'fastify';
import { ensureAuthed } from '../plugins/auth.js';
import { notFound } from '../lib/app-error.js';
import {
  findCustomerByIdForUser,
  type CustomerRecord,
} from '../repositories/customer-repository.js';
import { findPetByIdForCustomer, type PetRecord } from '../repositories/pet-repository.js';
import {
  findTreatmentByIdForUser,
  type TreatmentRecord,
} from '../repositories/treatment-repository.js';

export type { CustomerRecord, PetRecord, TreatmentRecord };

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

    const customer = await findCustomerByIdForUser(req.user.id, customerId);

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

    const pet = await findPetByIdForCustomer(customer.id, petId);

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

    const treatment = await findTreatmentByIdForUser(req.user.id, treatmentId);

    if (!treatment) throw notFound();

    req.treatment = treatment;
  };
}

export function getOwnedTreatment(req: FastifyRequest): TreatmentRecord {
  const treatment = req.treatment;
  if (!treatment) throw notFound();
  return treatment;
}
