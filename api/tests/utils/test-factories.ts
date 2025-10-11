/**
 * Test factory functions to create test data with sensible defaults.
 * This makes tests more readable and reduces duplication.
 */

/**
 * Type for user data properties
 */
export type UserDataProps = {
  email?: string;
  name?: string;
  googleId?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
};

/**
 * Creates user data with sensible defaults.
 */
export function createUserData(overrides: UserDataProps = {}) {
  return {
    email: `user-${Date.now()}@example.com`,
    name: 'Test User',
    ...overrides,
  };
}

/**
 * Type for customer data properties
 */
export type CustomerDataProps = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

/**
 * Creates customer data with sensible defaults.
 */
export function createCustomerData(overrides: CustomerDataProps = {}) {
  return {
    name: 'Test Customer',
    email: 'customer@example.com',
    phone: null,
    address: null,
    ...overrides,
  };
}

/**
 * Type for pet data properties
 */
export type PetDataProps = {
  name?: string;
  type?: 'dog' | 'cat';
  gender?: 'male' | 'female';
  breed?: string | null;
  dateOfBirth?: Date | null;
  isSterilized?: boolean;
  isCastrated?: boolean;
};

/**
 * Creates pet data with sensible defaults.
 */
export function createPetData(overrides: PetDataProps = {}) {
  return {
    name: 'Test Pet',
    type: 'dog' as const,
    gender: 'male' as const,
    breed: null,
    dateOfBirth: null,
    isSterilized: false,
    isCastrated: false,
    ...overrides,
  };
}

/**
 * Type for treatment data properties
 */
export type TreatmentDataProps = {
  name?: string;
  defaultIntervalMonths?: number;
  price?: number;
};

/**
 * Creates treatment data with sensible defaults.
 */
export function createTreatmentData(overrides: TreatmentDataProps = {}) {
  return {
    name: 'Test Treatment',
    defaultIntervalMonths: 6,
    price: 5000, // $50.00
    ...overrides,
  };
}

/**
 * Type for visit data properties
 */
export type VisitDataProps = {
  visitDate?: Date;
  summary?: string;
};

/**
 * Creates visit data with sensible defaults.
 */
export function createVisitData(overrides: VisitDataProps = {}) {
  return {
    visitDate: new Date(),
    summary: 'Routine checkup',
    ...overrides,
  };
}

/**
 * Type for appointment data properties
 */
export type AppointmentDataProps = {
  startTime?: Date;
  endTime?: Date;
  title?: string;
  notes?: string | null;
};

/**
 * Creates appointment data with sensible defaults.
 */
export function createAppointmentData(overrides: AppointmentDataProps = {}) {
  const startTime = new Date();
  startTime.setDate(startTime.getDate() + 1);

  const endTime = new Date(startTime);
  endTime.setHours(startTime.getHours() + 1);

  return {
    startTime,
    endTime,
    title: 'Follow-up Appointment',
    notes: null,
    ...overrides,
  };
}
