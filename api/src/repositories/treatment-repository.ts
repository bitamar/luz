import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { treatments } from '../db/schema.js';

export type TreatmentRecord = (typeof treatments)['$inferSelect'];
export type TreatmentInsert = (typeof treatments)['$inferInsert'];

export async function findActiveTreatmentsByUserId(userId: string) {
  return db.query.treatments.findMany({
    where: and(eq(treatments.userId, userId), eq(treatments.isDeleted, false)),
    orderBy: desc(treatments.updatedAt),
  });
}

export async function findTreatmentByIdForUser(userId: string, treatmentId: string) {
  return db.query.treatments.findFirst({
    where: and(
      eq(treatments.id, treatmentId),
      eq(treatments.userId, userId),
      eq(treatments.isDeleted, false)
    ),
  });
}

export async function createTreatment(values: TreatmentInsert) {
  const rows = await db.insert(treatments).values(values).returning();
  return rows[0] ?? null;
}

export async function updateTreatmentById(
  treatmentId: string,
  userId: string,
  updates: Partial<TreatmentInsert>
) {
  const rows = await db
    .update(treatments)
    .set(updates)
    .where(
      and(
        eq(treatments.id, treatmentId),
        eq(treatments.userId, userId),
        eq(treatments.isDeleted, false)
      )
    )
    .returning();
  return rows[0] ?? null;
}

export async function softDeleteTreatmentById(treatmentId: string, userId: string) {
  const rows = await db
    .update(treatments)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(
      and(
        eq(treatments.id, treatmentId),
        eq(treatments.userId, userId),
        eq(treatments.isDeleted, false)
      )
    )
    .returning({ id: treatments.id });
  return rows[0] ?? null;
}
