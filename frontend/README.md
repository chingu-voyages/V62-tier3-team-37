# HealthHub — Frontend

Next.js 16 App Router frontend for HealthHub. Talks to a Laravel API over Sanctum
cookie authentication.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then edit the API URL
npm run dev                        # http://localhost:3000
```

The Laravel API must be running and must list this app's origin in
`SANCTUM_STATEFUL_DOMAINS` (e.g. `localhost:3000`), otherwise Sanctum rejects the
forwarded session cookie with a `401` that looks like a bad login.

| Script          | Purpose                                  |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Dev server                               |
| `npm run build` | Production build                         |
| `npm start`     | Serve the production build               |
| `npm run lint`  | ESLint                                   |

Formatting and lint autofixes run through Biome from the repo root
(`npm run check`, `npm run format`), wired into `lint-staged`.

## Environment

| Variable                | Where it is used | Purpose                                     |
| ----------------------- | ---------------- | ------------------------------------------- |
| `API_URL`               | server only      | Laravel base URL for Server Components      |
| `NEXT_PUBLIC_API_URL`   | browser + server | Laravel base URL for client-side requests   |

Both fall back to `http://localhost:8000`.

## Architecture

The rule that shapes everything below: **components never call `fetch` directly.**

```
components/  ──►  hooks/ (client mutations)  ──►  lib/api/*-client.ts  ──┐
                                                                      ├──► Laravel
app/ (server)  ──►  lib/dal/*  ──►  lib/api/server-client.ts  ──────────┘
```

### `lib/api/` — transports

One module per boundary. They never contain business logic, only transport.

| File                | Runs on           | Notes                                                                                   |
| ------------------- | ----------------- | --------------------------------------------------------------------------------------- |
| `response.ts`       | both              | `ApiError`, `NetworkError`, JSON/error parsing. Guarantees a Laravel 422 becomes the same shape either side of the boundary. |
| `client.ts`         | browser           | Sanctum CSRF handshake, `credentials: "include"`, one automatic retry on `419`.           |
| `server-client.ts`  | Server Components | Forwards cookies and sends `Origin`/`Referer` — **required**, see below.                  |
| `auth-client.ts`    | browser           | Register / login / OTP / logout.                                                         |
| `hcp-client.ts`     | browser           | HCP onboarding submission (multipart).                                                    |
| `hcp-profile-client.ts` | browser        | `PATCH`/`PUT`/`DELETE` for `/api/hcp/profile`, plus photo upload and delete.              |

`server-client.ts` sends the request's own origin because Laravel Sanctum's
`EnsureFrontendRequestsAreStateful` only promotes a request to the cookie-based
stack when it carries a matching `Origin` or `Referer`. Without it, Sanctum falls
back to token auth and answers `401 Unauthenticated` even though the forwarded
session cookie is valid.

`multipart/form-data` bodies deliberately never set `Content-Type` — the browser
must generate the boundary.

### `lib/dal/` — data access

Server-only. This is the **authoritative** gate for anything that renders data.

| File               | Exports                                                                             |
| ------------------ | ----------------------------------------------------------------------------------- |
| `auth.ts`          | `getOptionalUser`, `requireUser`, `requireGuest`, `requireRole`                       |
| `hcp.ts`           | One reader per profile section (`getHcpProfileIdentity`, `getHcpAvailability`, …)     |
| `hcp-mappers.ts`   | Wire types → display models. The only place snake_case becomes UI data.                |

Reads are memoised per request with React `cache`, so ten components asking for the
current user cost one `GET /api/user`, not ten.

`hcp.ts` fans a single `GET /api/hcp/profile` out to five parallel-route slots
through `cache`. The split exists for independent `loading.tsx` / `error.tsx` per
section, not to reduce upstream calls — there is only one upstream endpoint.

### Route guards: proxy **and** DAL

`proxy.ts` runs before render and redirects coarse paths. It is **not** the
authoritative check:

- it caches `/api/user` for a few seconds, so it can admit a request whose session
  has since been revoked;
- it only runs for paths its matcher covers.

So every protected area also calls a DAL guard, which re-reads the session:

| Route group            | Guard                                    |
| ---------------------- | ---------------------------------------- |
| `app/(hcp)/hcp/*`      | `requireRole("HCP")` in the layout        |
| `app/(patient)/patient/*` | `requireRole("PATIENT")` in the layout  |
| `app/(auth)/auth`      | `requireGuest()` on the page              |
| `app/(auth)/auth/otp`  | `requireUser()` — a session is required, verification is not |
| `app/(auth)/auth/hcp/verification` | `requireRole("HCP")`     |

The shared `(auth)` layout carries no guard on purpose: it wraps both the
guest-only sign-in screen and the screens that *require* a session, so the guard
belongs on the pages.

### Data fetching and cache invalidation

Profile sections are Server Components. After a successful mutation the hooks call
`router.refresh()`, which re-runs the server components and re-reads the DAL. There
is deliberately **no** React Query cache entry for profile data — seeding one would
mean two sources of truth, and nothing would read it anyway.

React Query is used for mutations only, plus the current user.

## Folder layout

```
app/
  (auth)/auth/…            sign-in, OTP, HCP verification
  (hcp)/hcp/…              provider area; profile uses parallel routes
  (patient)/patient/…      patient area
components/
  features/<domain>/…      feature components, grouped by domain
  layout/…                 shells: AppShell, AuthSplitShell, Navbar
  ui/…                     primitives (shadcn-style, no business logic)
hooks/                     "use client" mutation hooks, one per endpoint group
lib/
  api/                     transports
  auth/                    role + journey policy, pure
  constants/               ROUTES and navigation, the single source for hrefs
  dal/                     server-only data access
  format.ts                date/number formatting
  query-keys.ts            the only keys a query actually reads
  validation/              pure validators, DOM-free and testable
proxy.ts                   coarse redirect gate (not authorisation)
store/                     Zustand stores for client-only UI state
types/                     wire types (`*-api.ts`) and view models
```

Conventions worth knowing:

- **Route groups** `(auth)` `(hcp)` `(patient)` organise files without touching URLs.
  A folder named in lowercase is a URL; a route group is not.
- **`types/*-api.ts`** holds wire types, kept separate from view models. A backend
  rename then touches one mapper instead of five components.
- **Barrels** exist only where a folder is a coherent public surface
  (`components/features/*/…/shared`, `layouts`). Not everywhere — a barrel per
  folder is indirection with no payoff.
- **`lib/validation/`** is pure and DOM-free so rules like OTP paste distribution
  can be tested directly.

## Profile page: parallel routes

`app/(hcp)/hcp/profile/` renders five sections at once, each its own slot with
independent `loading.tsx`, `error.tsx` and `retry()`:

| Slot           | Section                     | DAL reader                    |
| -------------- | --------------------------- | ----------------------------- |
| `@overview`    | Identity + photo            | `getHcpProfileIdentity`       |
| `@verification`| Verification status         | `getHcpVerificationSummary`   |
| `@professional`| Professional information    | `getHcpProfessionalSection`   |
| `@details`     | Languages / types / bio     | `getHcpProfessionalPreferences` |
| `@availability`| Availability schedule       | `getHcpAvailability`          |

Because all five project from one endpoint, a failure hits all five. Each boundary
isolates the *retry affordance*, not partial data — the backend has no
section-scoped read to isolate. This is stated rather than hidden.

## API endpoints used

| Method   | Path                                       | Notes                                   |
| -------- | ------------------------------------------ | --------------------------------------- |
| `POST`   | `/register/hcp`, `/register/patient`       | web routes, no `/api` prefix            |
| `POST`   | `/login`, `/logout`                        |                                         |
| `POST`   | `/email/otp/verify`, `/email/otp/resend`   |                                         |
| `GET`    | `/api/user`                                | session probe                           |
| `POST`   | `/hcp/onboarding`                          | multipart                               |
| `GET`    | `/api/hcp/profile`                         | read via the DAL only                   |
| `PATCH`  | `/api/hcp/profile`                         | partial; rejects identity/licence fields |
| `PUT`    | `/api/hcp/profile/availability`            | replaces the whole schedule             |
| `DELETE` | `/api/hcp/profile/availability/{slot}`     | one slot, by id                         |
| `POST`   | `/api/profile/photo`                       | multipart, field `photo`                |
| `DELETE` | `/api/profile/photo`                       |                                         |

Laravel's `routes/api.php` is auto-prefixed with `/api`; `routes/web.php` (auth) is
not. That is why the two families of paths look inconsistent, and it is not a bug.

## Adding a field to the profile

1. Add it to the wire type in `types/hcp-profile-api.ts`.
2. Map it in `lib/dal/hcp-mappers.ts`, and add it to `toEditableProfile` if the API
   accepts it in `PATCH`.
3. Render it in the owning section component.
4. If it is editable, add the input to the matching `Edit*Form` and to
   `PROFILE_LIMITS`.

If the API **rejects** the field, do not add an input for it — an input that can
only ever produce a 422 is worse than a read-only row that explains why.