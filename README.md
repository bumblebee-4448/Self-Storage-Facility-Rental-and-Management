# Self-Storage Management System — Frontend

Frontend foundation for the Self-Storage Management System, built with Vite, React 19, TypeScript, and pnpm.

## Requirements

- Node.js 20.19+ (or 22.12+)
- pnpm 10+

## Getting started

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

On PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

Set `VITE_API_BASE_URL` in `.env.local` to the backend application URL. The example currently points to the API host supplied in the project plan. Do not put credentials or secrets in frontend environment variables; Vite variables are included in the browser bundle.

## Available scripts

| Script              | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `pnpm dev`          | Run the local Vite development server      |
| `pnpm typecheck`    | Run TypeScript project checks              |
| `pnpm lint`         | Run ESLint                                 |
| `pnpm format`       | Format source files with Prettier          |
| `pnpm format:check` | Check formatting without changing files    |
| `pnpm test --run`   | Run Vitest once                            |
| `pnpm build`        | Typecheck and create the production bundle |

## Application areas

- Public and customer routes: `/`, `/facilities`, `/auth/login`, `/auth/register`, and `/account/*`
- Internal portal: `/portal/login`, `/portal`, `/portal/admin/*`, `/portal/ops/*`, `/portal/manager/*`, and `/portal/staff/*`

The routes currently render foundation placeholders where a full workflow is not part of Phase 1. Authentication, authorization, backend integration, and business modules are intentionally not implemented yet.

## Project structure

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for boundaries, route ownership, API conventions, and the implementation roadmap.
