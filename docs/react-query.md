# Frontend React Query Conventions

## Query Keys

All data fetching hooks use the typed helpers in `front/src/lib/queryKeys.ts`:

- `queryKeys.me()` – current authenticated user session information.
- `queryKeys.settings()` – application/user settings payload.
- `queryKeys.treatments()` – list of treatments.
- `queryKeys.customers()` – list of customers.
- `queryKeys.customer(customerId)` – individual customer details.
- `queryKeys.pets(customerId)` – pets that belong to a customer. Pet detail queries extend this key by appending the pet id (e.g. `[...queryKeys.pets(customerId), petId]`).

When adding new queries, prefer extending the existing key segments instead of inventing ad-hoc strings so that partial invalidation continues to work.

## Invalidation Rules

- Treatments mutations invalidate `queryKeys.treatments()`.
- Customer create/update/delete mutations invalidate `queryKeys.customers()`.
- Pet mutations invalidate both `queryKeys.pets(customerId)` and `queryKeys.customer(customerId)` to keep customer summaries (such as pet counts) fresh.
- Settings updates set the fresh value in `queryKeys.settings()` and invalidate `queryKeys.me()` so auth context picks up changes.
- Logout clears `queryKeys.me()` and removes cached settings queries.

When multiple related resources are affected by a mutation, invalidate all impacted keys to keep derived UI consistent. Prefer `queryClient.invalidateQueries` for broad refreshes and `queryClient.setQueryData` when you already have the updated payload.
