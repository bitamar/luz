import crypto from 'node:crypto';
import { testDb } from './db.js';
import {
  users,
  sessions,
  customers,
  pets,
  treatments,
  visits,
  visitTreatments,
  appointments,
} from '../../src/db/schema.js';

/**
 * Test data generation utilities to help with database tests.
 * These functions create entities with valid relationships.
 */

// User-related seed helpers
export async function seedUser(
  data: {
    email?: string;
    name?: string;
    googleId?: string;
    avatarUrl?: string;
  } = {}
) {
  try {
    // Generate unique email if not provided
    const userEmail =
      data.email ?? `user-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;

    const [user] = await testDb
      .insert(users)
      .values({
        email: userEmail,
        name: data.name ?? 'Test User',
        googleId: data.googleId,
        avatarUrl: data.avatarUrl,
      })
      .returning();

    if (!user?.id) {
      throw new Error('Failed to create test user: Missing ID in database response');
    }

    // Wait a brief moment to ensure the user is fully committed in the database
    await new Promise((resolve) => setTimeout(resolve, 20));

    return user;
  } catch (error) {
    console.error('Error seeding user:', error);
    throw error;
  }
}

export async function seedSession(userId: string) {
  const now = new Date();

  try {
    const [session] = await testDb
      .insert(sessions)
      .values({
        id: crypto.randomUUID(),
        userId,
        createdAt: now,
        lastAccessedAt: now,
        expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24),
      })
      .returning();

    return session;
  } catch (error) {
    console.error(`Error creating session for user ${userId}:`, error);
    throw error;
  }
}

// Customer-related seed helpers
export async function seedCustomer(
  userId: string,
  data: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  }
) {
  const [customer] = await testDb
    .insert(customers)
    .values({
      userId,
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
    })
    .returning();

  return customer;
}

// Pet-related seed helpers
export async function seedPet(
  customerId: string,
  data: {
    name: string;
    type: 'dog' | 'cat';
    gender?: 'male' | 'female';
    breed?: string | null;
    dateOfBirth?: Date | null;
    isSterilized?: boolean;
    isCastrated?: boolean;
  }
) {
  const [pet] = await testDb
    .insert(pets)
    .values({
      customerId,
      name: data.name,
      type: data.type,
      gender: data.gender ?? 'male',
      breed: data.breed ?? null,
      dateOfBirth: data.dateOfBirth ?? null,
      isSterilized: data.isSterilized,
      isCastrated: data.isCastrated,
    })
    .returning();

  return pet;
}

// Treatment-related seed helpers
export async function seedTreatment(
  userId: string,
  data: {
    name: string;
    defaultIntervalMonths?: number | null;
    price?: number | null;
  }
) {
  const [treatment] = await testDb
    .insert(treatments)
    .values({
      userId,
      name: data.name,
      defaultIntervalMonths: data.defaultIntervalMonths ?? null,
      price: data.price ?? null,
    })
    .returning();

  return treatment;
}

// Visit-related seed helpers
export async function seedVisit(
  petId: string,
  data: {
    visitDate: Date;
    summary: string;
  }
) {
  const [visit] = await testDb
    .insert(visits)
    .values({
      petId,
      visitDate: data.visitDate,
      summary: data.summary,
    })
    .returning();

  return visit;
}

export async function seedVisitTreatment(
  visitId: string,
  treatmentId: string,
  data: {
    nextDueDate?: Date | null;
  } = {}
) {
  const [visitTreatment] = await testDb
    .insert(visitTreatments)
    .values({
      visitId,
      treatmentId,
      nextDueDate: data.nextDueDate ?? null,
    })
    .returning();

  return visitTreatment;
}

export async function seedAppointment(
  petId: string,
  customerId: string,
  data: {
    startTime: Date;
    endTime?: Date | null;
    title: string;
    notes?: string | null;
  }
) {
  const [appointment] = await testDb
    .insert(appointments)
    .values({
      petId,
      customerId,
      startTime: data.startTime,
      endTime: data.endTime ?? null,
      title: data.title,
      notes: data.notes ?? null,
    })
    .returning();

  return appointment;
}

// Complete test data setup with a full relationship chain
export async function seedCompleteTestData() {
  const user = await seedUser();
  const session = await seedSession(user.id);
  const customer = await seedCustomer(user.id, { name: 'Test Customer' });
  const pet = await seedPet(customer.id, { name: 'Test Pet', type: 'dog', gender: 'male' });
  const treatment = await seedTreatment(user.id, { name: 'Test Treatment', price: 100 });
  const visit = await seedVisit(pet.id, { visitDate: new Date(), summary: 'Routine checkup' });
  const visitTreatment = await seedVisitTreatment(visit.id, treatment.id);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const appointment = await seedAppointment(pet.id, customer.id, {
    startTime: tomorrow,
    title: 'Follow-up Visit',
  });

  return {
    user,
    session,
    customer,
    pet,
    treatment,
    visit,
    visitTreatment,
    appointment,
  };
}
