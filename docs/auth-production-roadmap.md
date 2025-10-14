## Auth Production Roadmap

This document lists the changes needed to move the current Google OAuth login flow to a production-grade setup.

### Overview (Current vs Target)
- Current [Done]: SPA → API (/auth/google) → Google → API (/auth/google/callback) → SPA. API creates an HttpOnly cookie-based session (in-memory store), SPA hydrates via `/me`.
- Target [Planned]: Same redirect chain, but sessions are persisted in Postgres (via Drizzle) so they survive API restarts. SPA continues to hydrate via `/me`.

---

### Must-haves (Backend)
1) Issue secure session on OAuth callback
   - Current [Done]: Create session (opaque `sessionId`) and set cookie `session` with HttpOnly, `SameSite=Lax`, `Secure=true`, `Path=/`, `Max-Age=7d`. Clear temporary `oidc` cookie.
   - Current limitation [Pending]: Session store is in-memory; sessions are lost on API restart.
   - Target [Planned]: Persist sessions in Postgres (Drizzle) with rolling TTL (e.g., 7d) and idle timeout. Schema example: `{ id, userId, createdAt, lastAccessedAt, expiresAt, userAgent, ip }`.

2) Add auth endpoints
   - `GET /me` → returns `{ user }` if session cookie valid, else `401`. [Done]
   - `POST /auth/logout` → invalidates server session and clears cookie. [Done]

3) Return path handling
   - Support `returnTo` on start: `/auth/google?returnTo=/dashboard`.
   - Store `returnTo` in a signed temporary cookie with `state/nonce` and validate on callback (or whitelist + sign to prevent open redirects).
   - On success, redirect to `APP_ORIGIN + (returnTo || '/')`.

4) PKCE and OIDC hardening
   - Add PKCE (S256) to the authorization code flow.
   - Keep `state` and `nonce` (already present) and validate strictly.
   - Never expose tokens to the SPA; keep tokens server-side.

5) Cookie/CORS
   - For SPA and API on subdomains of the same site (same eTLD+1), `SameSite=Lax; Secure=true; HttpOnly` works and is simpler. [Configured]
   - If truly cross-site (different eTLD+1), use `SameSite=None; Secure; HttpOnly` and strict CORS (`origin: APP_ORIGIN`, `credentials: true`).
   - Prefer same-site topology when possible to reduce CORS surface.

6) CSRF strategy (for state-changing endpoints)
   - With `SameSite=Lax` and same-site SPA/API, cross-site POSTs from third-party sites are mitigated by default. Still recommend CSRF tokens for sensitive mutations. [Planned]

7) Error handling and logging
   - Map OAuth failures to redirects with a short `reason` code (e.g., `/login?error=oauth_exchange_failed`).
   - Structured logging (request id, user id after login, provider error codes) and redact PII.

8) Rate limiting and abuse protections
   - Add IP + user-based rate limits for `/auth/*` and `/me`.
   - Consider bot detection headers or challenges for excessive auth attempts.

9) Secrets and configuration
   - Store secrets in a secure manager (not `.env` in prod): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `DATABASE_URL`.
   - Validate env with strong schema (already using `zod`). Add session TTL if/when session persistence is implemented.

---

### Must-haves (Frontend)
1) Auth hydration
   - On app start, call `GET /me` with `credentials: 'include'` to populate auth state. [Done]
   - Show a lightweight loading state during hydration. [Done]

2) Route protection
   - Redirect unauthenticated users to `/login` (and later to `/login?returnTo=<currentPath>`). [Partially Done]
   - After successful OAuth, SPA re-hydrates from `/me`. [Done]

3) Logout
   - Call `POST /auth/logout` (with credentials) and clear local state; redirect to `/login`. [Done]

4) Environment management
   - Use `front/.env.*` with `VITE_API_BASE_URL` only (no code fallbacks). [Done]
   - Documented in `front/.env.example`. [Done]

---

### Nice-to-haves
- Session rotation on privilege changes and periodic re-auth (re-Prompt) policies.
- Soft-delete vs delete for users; audit trail of sign-ins.
- Organization/tenant support and role-based access checks.
- Add a small user avatar/menu with logout and account link.

---

### Ops & Observability
- Health/Readiness
  - `/health` (exists) + `/ready` that pings DB and Redis.
- Metrics
  - Counters for `auth_started`, `auth_success`, `auth_failed_by_cause`, `sessions_active`.
- Alerts
  - High failure rates on `/auth/google/callback`, Redis saturation, cookie domain/flag misconfig.

---

### Testing
- Unit tests: state/nonce handling, PKCE, cookie serialization, error mapping.
- Integration: full callback path with mocked OIDC provider; session creation and `/me`.
- E2E (Playwright/Cypress): SPA login -> Google mock -> redirect -> hydrated dashboard.
- Security checks: CSRF flow, CORS, cookie flags, open-redirect prevention.

---

### Suggested API changes (high-level)
- Add session module (Redis client, session repo, cookie helpers).
- Update `/auth/google/callback` to create session and redirect to SPA return path.
- Add `GET /me`, `POST /auth/logout`.
- Tighten CORS and cookie options based on deployment topology (same vs cross-origin).

---

### Environment variables (example)
Backend (`api/.env`):
```
URL=http://localhost:3000
APP_ORIGIN=http://localhost:5173
# Allow multiple frontends (prod + PR envs). Comma-separated host list; one '*' wildcard for digits.
# Examples:
#   front-kalimere.up.railway.app,front-kalimere-pr-*.up.railway.app,localhost:5173
ALLOWED_APP_ORIGINS=localhost:5173
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_SECRET=change_me_32_chars_min
DATABASE_URL=postgres://...
# Optional if/when session persistence is added
# SESSION_TTL_SECONDS=604800
```

Frontend (`front/.env.*`):
```
VITE_API_BASE_URL=http://localhost:3000
```

---

### Acceptance criteria
- After OAuth success, user is redirected to SPA and `/me` returns current user. [Done]
- Session cookie is HttpOnly, `SameSite=Lax`, `Secure=true`, scoped correctly, and (once persistence is added) survives API restarts and browser refresh until TTL. [Partially Done]
- `/auth/logout` terminates the session server-side and clears cookie. [Done]
- No tokens are stored client-side; only server-side session is used. [Done]
- Cross-origin/same-site flow works reliably with proper cookie attributes (or same-origin is used). [Done]
