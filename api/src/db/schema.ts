import { pgTable, text, timestamp, uuid, boolean, date, pgEnum, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  googleId: text('google_id').unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  phone: text('phone').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  customers: many(customers),
  treatments: many(treatments),
}));

// Domain enums
export const petTypeEnum = pgEnum('pet_type', ['dog', 'cat']);
export const petGenderEnum = pgEnum('pet_gender', ['male', 'female']);

// Customers
export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    customersUserPhoneUnique: uniqueIndex('customers_user_id_phone_unique').on(table.userId, table.phone),
  };
});

// Pets
export const pets = pgTable('pets', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id),
  name: text('name').notNull(),
  type: petTypeEnum('type').notNull(),
  dateOfBirth: date('date_of_birth'),
  breed: text('breed'),
  gender: petGenderEnum('gender').notNull(),
  isSterilized: boolean('is_sterilized'),
  isCastrated: boolean('is_castrated'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  pets: many(pets),
}));

export const petsRelations = relations(pets, ({ one }) => ({
  customer: one(customers, {
    fields: [pets.customerId],
    references: [customers.id],
  }),
}));

// Treatments (e.g., vaccines, medications)
export const treatments = pgTable('treatments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  defaultIntervalMonths: integer('default_interval_months'),
  price: integer('price'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    treatmentsUserNameUnique: uniqueIndex('treatments_user_id_name_unique').on(table.userId, table.name),
  };
});

// Visits
export const visits = pgTable('visits', {
  id: uuid('id').defaultRandom().primaryKey(),
  petId: uuid('pet_id')
    .notNull()
    .references(() => pets.id),
  visitDate: date('visit_date').notNull(),
  summary: text('summary').notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Visit <-> Treatments (junction) with next due date
export const visitTreatments = pgTable('visit_treatments', {
  id: uuid('id').defaultRandom().primaryKey(),
  visitId: uuid('visit_id')
    .notNull()
    .references(() => visits.id),
  treatmentId: uuid('treatment_id')
    .notNull()
    .references(() => treatments.id),
  nextDueDate: date('next_due_date'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Appointments
export const appointments = pgTable('appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  petId: uuid('pet_id')
    .notNull()
    .references(() => pets.id),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  title: text('title').notNull(),
  notes: text('notes'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations for new tables
export const treatmentsRelations = relations(treatments, ({ one, many }) => ({
  user: one(users, {
    fields: [treatments.userId],
    references: [users.id],
  }),
  visitTreatments: many(visitTreatments),
}));

export const visitsRelations = relations(visits, ({ one, many }) => ({
  pet: one(pets, {
    fields: [visits.petId],
    references: [pets.id],
  }),
  visitTreatments: many(visitTreatments),
}));

export const visitTreatmentsRelations = relations(visitTreatments, ({ one }) => ({
  visit: one(visits, {
    fields: [visitTreatments.visitId],
    references: [visits.id],
  }),
  treatment: one(treatments, {
    fields: [visitTreatments.treatmentId],
    references: [treatments.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  pet: one(pets, {
    fields: [appointments.petId],
    references: [pets.id],
  }),
  customer: one(customers, {
    fields: [appointments.customerId],
    references: [customers.id],
  }),
}));

// Extend existing entity relations
export const petsExtendedRelations = relations(pets, ({ many }) => ({
  visits: many(visits),
  appointments: many(appointments),
}));

export const customersExtendedRelations = relations(customers, ({ many }) => ({
  appointments: many(appointments),
}));
