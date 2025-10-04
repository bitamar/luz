## Architecture Improvements (DO NOW)

### Backend Critical
- [ ] add request/response validation (Zod or similar) - currently using manual validation
- [ ] centralized error handling middleware - errors are handled inconsistently
- [ ] move sessions from in-memory to database - will lose all sessions on restart
- [ ] add database transactions for multi-step operations (create customer + pets)
- [ ] API request/response schemas shared with frontend (tRPC or shared types)
- [ ] structured logging with context (request IDs, user IDs)
- [ ] global error handler in Fastify (currently errors bubble up inconsistently)

### Frontend Critical
- [ ] add state management library (React Query/TanStack Query) - currently no caching
- [ ] centralized error handling and toast notifications - errors just throw
- [ ] loading states coordination - currently each component manages its own
- [ ] optimistic updates for better UX - currently wait for server on every action
- [ ] proper error boundaries for React - currently errors crash the app
- [ ] abort pending requests on navigation - currently requests keep running

### DevOps / Infrastructure (DO NOW)
- [ ] support PR environments - OAuth redirects to prod instead of staying on PR env (e.g., front-luz-pr-1.up.railway.app/login redirects to prod)

### Security & Data Integrity (DO NOW)
- [ ] add rate limiting middleware (fastify-rate-limit)
- [ ] validate user ownership in middleware - currently each route does it manually
- [ ] add indexes on foreign keys (petId, customerId, userId) - currently slow queries
- [ ] add database constraints for data integrity (CHECK constraints)
- [ ] sanitize user inputs (prevent XSS, SQL injection via ORM)
- [ ] add CSRF protection for state-changing operations

### Code Organization
- [ ] separate validation logic from route handlers (create validation schemas)
- [ ] create service layer - currently business logic in route handlers
- [ ] create repository layer - currently direct DB access in routes
- [ ] shared TypeScript types between frontend/backend (monorepo with shared package)

## MVP / Core Features
- [ ] pets view
- [ ] allow to record/schedule a visit to a pet
- [ ] create an invoice for a visit
- [ ] all visits view for the user, with a calendar
- [ ] make sure all queries can only return data belonging to the current user (Auth)

## Phase 1 - Polish & Essential Features

### UI/UX Polish
- [x] only show the delete button when hovering over a card
- [ ] make sure loading spinner behaviour is consistent
- [ ] slide animation between customers > customer > pets
- [x] confirmation dialogs for destructive actions (delete customer, pet, visit)
- [ ] error states (empty states when no data, error messages)
- [ ] toast notifications for success/error actions

### Search & Filtering
- [ ] search in customers view - by pet name, phone number etc
- [ ] search in pets view
- [ ] filter/sort customers (by date added, name, recent visits)
- [ ] filter/sort visits (by date, status, customer)

### Data Management
- [ ] edit customer details
- [ ] edit pet details
- [ ] edit/cancel visits
- [ ] edit/update treatment records

## Phase 2 - Advanced Features

### Visits & Scheduling
- [ ] on a visit, allow to tick a reminder option
- [ ] send automated reminders (email/SMS)
- [ ] recurring visit scheduling
- [ ] visit status tracking (scheduled, completed, cancelled)

### Billing & Exports
- [ ] export visit details / invoice
- [ ] export customer/pet data (CSV/PDF)
- [ ] payment tracking (paid/unpaid status)
- [ ] pricing management for treatments

### File Management
- [ ] upload/attach files to pets (medical records, photos)
- [ ] upload files to visits (x-rays, test results)
- [ ] image preview/gallery for pet photos

### Dashboard & Analytics
- [ ] dashboard with key stats (visits this week, revenue, upcoming appointments)
- [ ] charts for visit trends
- [ ] recent activity feed

## Phase 3 - LLM Features
- [ ] connect the api to a llm
- [ ] generate a unique icon for each pet and customer
- [ ] auto-generate visit summaries from notes
- [ ] treatment recommendations based on symptoms

## Phase 4 - Advanced Admin & Polish

### Auth & Security
- [ ] allow the admin to impersonate users
- [ ] user profile management
- [ ] password reset flow
- [ ] session timeout handling

### Settings & Configuration
- [ ] business settings (clinic name, logo, contact info)
- [ ] customizable invoice templates
- [ ] notification preferences
- [ ] timezone settings

### Technical Improvements
- [ ] error logging/monitoring (Sentry or similar)
- [ ] API rate limiting
- [ ] database backup automation
- [ ] mobile responsiveness improvements
- [ ] accessibility improvements (keyboard nav, ARIA labels)
- [ ] performance optimization (lazy loading, caching)

## Future / Nice to Have
- [ ] bulk operations (import customers, bulk delete)
- [ ] mobile app (iOS/Android)
- [ ] multi-user/clinic support
- [ ] inventory management for medications
- [ ] integrated SMS/email client
- [ ] client portal (customers can view their pet's records)
