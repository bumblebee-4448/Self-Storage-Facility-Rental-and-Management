# Frontend architecture

## Principles

- One React application hosts the public/customer experience and the internal portal.
- Routes and layouts establish separate areas without duplicating application setup.
- Feature modules own their types, UI, and eventual API integration; shared UI stays small.
- The API client sends cookies with requests. Browser storage is not used for authentication tokens.
- Frontend access checks are a usability layer. The backend remains responsible for authorization on every API and resource.
- Authentication core uses the real backend session API; authentication UI, RBAC, mock users, and business data remain outside this scope.

## Structure

```text
src/
├── api/                     # Axios client, contracts, auth services, refresh lifecycle
├── components/
│   ├── providers/           # Application providers
│   ├── shared/              # Reusable application-level UI
│   └── ui/                  # shadcn/ui-compatible primitives
├── config/                  # Application configuration
├── layouts/                 # Public, customer, and internal portal shells
├── lib/utils.ts             # shadcn/ui class-name helper
├── models/                  # AuthUser and backend authentication DTOs
├── pages/                   # Page-level React components
├── routes/                  # React Router definitions
├── stores/                  # Zustand stores and session state
├── test/
│   ├── api/                  # API client, contracts, and auth service tests
│   ├── pages/                # Page rendering tests
│   ├── routes/               # Route and layout tests
│   ├── stores/               # Store and session lifecycle tests
│   ├── handlers.ts           # MSW handlers
│   ├── server.ts             # MSW server
│   └── setup.ts              # Vitest setup
├── types/                   # Vite environment declarations
└── utils/                   # User normalization and shared transformations
```

All `*.test.ts` and `*.test.tsx` files live under `src/test/`; test infrastructure also stays there. Domain feature folders are introduced when a domain has enough implementation to own its logic, rather than being created as empty placeholders.

## API and environment

`src/api/client.ts` creates the shared Axios instance using `VITE_API_BASE_URL` and `withCredentials: true`. Copy `.env.example` to `.env.local` for local development. Environment variables prefixed with `VITE_` are public; never put secrets there.

The backend authentication endpoints are `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, and `GET /auth/me`. API responses use `{ success, statusCode, messageCode, message, data }`; Axios exposes that envelope as `response.data`, with business payload in `response.data.data`. Login data is `{ user, tokens }`; refresh data is the token object directly; current-user data is the user object directly. Error envelopes carry `success: false`, status and message codes, message, optional validation errors, path, timestamp, and optional stack.

Authentication requests use the shared Axios client with `withCredentials: true`; the backend owns the HttpOnly cookie session. The frontend does not persist access tokens, refresh tokens, or authenticated user state in browser storage. Login validates `{ user, tokens }` and returns only the normalized user; refresh validates the token object and resolves without exposing it. The `/auth/me` request separately obtains the user after refresh.

Backend DTOs stay separate from the frontend `AuthUser`. The adapter accepts only a valid string `id` or serialized string `_id`, validates email and role, maps the single lowercase backend role to one frontend role, and sets `permissions: []`. Unknown roles and missing identifiers are rejected. Optional name and `assignedFacilityId` are retained only when validated. Unknown backend fields are discarded. The backend currently has one role per account and does not provide a confirmed permission list; the frontend does not infer extra roles or permissions. Facility scope must be confirmed with the backend before any scoped access behavior is implemented.

## Session lifecycle

The Zustand auth store keeps `user`, `status`, and normalized `error` in memory. Status moves through `idle`, `checking`, `authenticated`, `guest`, and `error`. The application initializer starts bootstrap without holding up public route rendering. Bootstrap calls `/auth/me`; an eligible 401 is handled by the shared Axios refresh coordinator, which refreshes and retries the original GET once. A final 401 becomes `guest`; network, timeout, malformed-response, and server failures become retryable `error` states. `retryBootstrap()` reruns the same flow.

Only requests explicitly marked `authRefreshEligible` can trigger refresh, and only GET, HEAD, or OPTIONS requests qualify. Login, logout, refresh, registration, OTP, and send-OTP paths are excluded. 403, other statuses, network failures, and timeouts never trigger refresh. Concurrent eligible 401s share one refresh promise. Each original request is replayed no more than once. POST, PATCH, and DELETE are never replayed automatically, even if a caller sets the eligibility option.

Login, logout, and session invalidation advance a shared session generation. It identifies the active authentication session and prevents work started for an older account from refreshing, replaying, or changing the current session. Axios snapshots the generation when each request is dispatched. If it changes before a 401 is handled, while refresh is pending, or immediately before retry dispatch, the old request is rejected. A request dispatched while a sign-in/sign-out transition is running is also ineligible for refresh. Bootstrap requests use the same generation boundary, are deduplicated for StrictMode, skip while an auth action is in progress, and do not refetch after the store is already authenticated.

Session generation and refresh revision have separate jobs. Generation changes when the active session changes. Refresh revision advances after each successful refresh, and every request snapshots its revision at dispatch. If an older, delayed request returns 401 after a refresh already succeeded, its older revision lets it reuse that result without issuing another refresh. A new request dispatched after that refresh captures the newer revision; if it later gets 401, it can start the next refresh. Concurrent 401s dispatched at the same revision share one in-flight refresh. These rules avoid both duplicate refreshes for late responses and permanently suppressing refresh for later expirations in the same session.

Each eligible original request is retried at most once, and a retry retains the original generation and refresh revision. The interceptor checks the generation again immediately before dispatch. If the session changed, it rejects the retry instead of replaying it under a newer account. A definitive refresh HTTP 401 invalidates the Zustand session only when its generation is still current, producing guest state. Network failures, timeouts, and 5xx refresh failures do not claim that logout succeeded or clear the authenticated user. Confirmed logout and expired-session 401 clear local state. A network or non-401 server error during logout leaves the prior user in memory with status `error` so the UI does not claim server logout succeeded; the caller can retry.

`signIn()` and `signOut()` resolve with a discriminated result: `{ success: true, value }` or `{ success: false, error }`. Failed login results preserve normalized HTTP status and backend message code, including the distinction between 401 and 403. Logout HTTP 401 counts as successful local cleanup of an expired session; network and other server errors return failure. Neither result contains credentials or tokens.

Generation checks protect frontend state and request replay decisions, but an already in-flight backend response may still apply a `Set-Cookie` header after logout or a newer sign-in. The browser controls cookie application; the frontend cannot cancel a response that the server has already produced. This limitation also applies to an older in-flight refresh response: the client can ignore its application-level result, but cannot prevent the browser from processing a `Set-Cookie` header already sent by the server.

Cookie behavior depends on the backend CORS policy allowing credentials for the exact frontend origin, and on cookie domain, `SameSite`, and `Secure` attributes matching the deployment topology. The frontend does not read cookies or attach bearer tokens. Validate cross-origin cookie behavior in the deployed environment before relying on persistent sessions.

## Route map

| Area     | Route                                                                      | Phase 1 behavior                        |
| -------- | -------------------------------------------------------------------------- | --------------------------------------- |
| Public   | `/`                                                                        | Static landing page                     |
| Public   | `/facilities`                                                              | Placeholder                             |
| Customer | `/auth/login`, `/auth/register`                                            | Placeholders                            |
| Customer | `/account/*`                                                               | Customer shell with placeholder content |
| Internal | `/portal/login`                                                            | Shared staff login placeholder          |
| Internal | `/portal`                                                                  | Internal workspace placeholder          |
| Internal | `/portal/admin/*`, `/portal/ops/*`, `/portal/manager/*`, `/portal/staff/*` | Role-area placeholders                  |

## Roadmap boundary

1. Phase 1 — frontend foundation: app scaffold, route/layout shells, API client, quality tooling, and documentation.
2. TASK 02.1 — authentication API contracts and services.
3. TASK 02.2 — cookie-based session lifecycle and refresh coordination.
4. TASK 02.R — frontend folder organization (current).
5. TASK 02.3 — verify browser cookie/CORS behavior against the deployed frontend/backend origins, including credentialed requests and cookie attributes.
6. Phase 3 — RBAC and protected routes, only after backend roles, permissions, and facility-scope contracts are agreed.
7. Phase 4 — customer and internal authentication UI, recovery and verification flows, and UI feedback for pending/error/retry states.
8. Later QA — broader integration coverage and repository/CI preparation.
