export const queryKeys = {
  me: () => ['me'] as const,
  settings: () => ['settings'] as const,
  treatments: () => ['treatments'] as const,
  customers: () => ['customers'] as const,
  customer: (customerId: string) => ['customer', customerId] as const,
  pets: (customerId: string) => ['pets', customerId] as const,
};

export type QueryKey = ReturnType<(typeof queryKeys)[keyof typeof queryKeys]>;
