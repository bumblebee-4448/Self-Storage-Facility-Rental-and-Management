# Frontend architecture

## Principles

- One React application hosts the public/customer experience and the internal portal.
- Routes and layouts establish separate areas without duplicating application setup.
- Feature modules own their types, UI, and eventual API integration; shared UI stays small.
- The API client sends cookies with requests. Browser storage is not used for authentication tokens.
- Frontend access checks are a usability layer. The backend remains responsible for authorization on every API and resource.
- Phase 1 contains no live authentication, mock user, mock business records, or fabricated claim of backend connectivity.

## Structure

```text
src/
├── app/
│   ├── layouts/             # Public, customer, and internal portal shells
│   └── router.tsx           # Application route tree
├── components/
│   ├── shared/              # Reusable application-level UI
│   └── ui/                  # shadcn/ui-compatible primitives
├── config/                  # Application configuration
├── features/
│   ├── auth/
│   │   ├── api/             # Auth API service and user normalization
│   │   └── types/           # Backend DTOs and normalized auth domain types
│   ├── customer/
│   ├── admin/
│   ├── operations/
│   ├── facility-manager/
│   ├── facility-staff/
│   └── landing/
├── hooks/
├── lib/api/                 # Axios client and shared response contracts
├── test/                    # Vitest setup and MSW server
└── types/
```

## API and environment

`src/lib/api/client.ts` creates the shared Axios instance using `VITE_API_BASE_URL` and `withCredentials: true`. Copy `.env.example` to `.env.local` for local development. Environment variables prefixed with `VITE_` are public; never put secrets there.

The backend authentication endpoints are `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, and `GET /auth/me`. API responses use `{ success, statusCode, messageCode, message, data }`; Axios exposes that envelope as `response.data`, with business payload in `response.data.data`. Login data is `{ user, tokens }`; refresh data is the token object directly; current-user data is the user object directly. Error envelopes carry `success: false`, status and message codes, message, optional validation errors, path, timestamp, and optional stack.

Authentication requests use the shared Axios client with `withCredentials: true`; the backend owns the HttpOnly cookie session. The frontend does not persist access or refresh tokens in browser storage. Login validates `{ user, tokens }` and returns only the normalized user; refresh validates the token object and resolves without exposing it. Call `GET /auth/me` separately to obtain the authenticated user after refresh. Automatic refresh/retry and session restoration are out of scope until TASK 02.2.

Backend DTOs stay separate from the frontend `AuthUser`. The adapter accepts only a valid string `id` or serialized string `_id`, validates email and role, maps the single lowercase backend role to one frontend role, and sets `permissions: []`. Unknown roles and missing identifiers are rejected. Optional name and `assignedFacilityId` are retained only when validated. Unknown backend fields are discarded. The backend currently has one role per account and does not provide a confirmed permission list; the frontend does not infer extra roles or permissions. Facility scope must be confirmed with the backend before any scoped access behavior is implemented.

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

1. Phase 1 — frontend foundation (current): app scaffold, route/layout shells, API client, quality tooling, and documentation.
2. TASK 02.2 — authentication session lifecycle: restore current user on app start, maintain session state, coordinate a single refresh/retry on eligible 401 responses, and connect login/logout actions to UI state. Keep tokens out of browser storage and confirm cookie/refresh failure behavior against BE.
3. Phase 3 — RBAC and protected routes: implement only after backend role, permission, and facility-scope contracts are agreed.
4. Phase 4 — authentication experiences: customer and internal forms plus recovery flows.
5. Phase 5 — broader QA and repository/CI preparation.
