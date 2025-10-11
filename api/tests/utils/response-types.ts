/**
 * Response type factories for API tests.
 * These types help with maintaining consistency in tests.
 */

/**
 * Types for Customer API responses
 */
export interface CustomerResponse {
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    pets: Array<{ id: string; name: string; type: 'dog' | 'cat' }>;
  };
}

export interface CustomersListResponse {
  customers: Array<{
    id: string;
    name: string;
    pets: Array<{ id: string; name: string; type: 'dog' | 'cat' }>;
  }>;
}

/**
 * Types for Pet API responses
 */
export interface PetResponse {
  pet: {
    id: string;
    name: string;
    type: 'dog' | 'cat';
    gender: 'male' | 'female';
    customerId: string;
    breed: string | null;
    dateOfBirth: string | null;
    isSterilized: boolean | null;
    isCastrated: boolean | null;
  };
}

export interface PetsListResponse {
  pets: Array<{
    id: string;
    name: string;
    type: 'dog' | 'cat';
    customerId: string;
  }>;
}

/**
 * Types for Treatment API responses
 */
export interface TreatmentResponse {
  treatment: {
    id: string;
    name: string;
    defaultIntervalMonths: number | null;
    price: number | null;
  };
}

export interface TreatmentsListResponse {
  treatments: Array<{
    id: string;
    name: string;
    defaultIntervalMonths: number | null;
    price: number | null;
  }>;
}

/**
 * Types for Visit API responses
 */
export interface VisitResponse {
  visit: {
    id: string;
    petId: string;
    visitDate: string;
    summary: string;
    treatments: Array<{
      id: string;
      name: string;
      nextDueDate: string | null;
    }>;
  };
}

/**
 * Types for Appointment API responses
 */
export interface AppointmentResponse {
  appointment: {
    id: string;
    petId: string;
    customerId: string;
    startTime: string;
    endTime: string | null;
    title: string;
    notes: string | null;
  };
}

export interface AppointmentsListResponse {
  appointments: Array<{
    id: string;
    petId: string;
    customerId: string;
    startTime: string;
    endTime: string | null;
    title: string;
  }>;
}
