# 04 — Frontend Architecture and Routes
FE monorepo pnpm/Turborepo: `apps/web` Next.js App Router, `apps/mobile` Expo Router/React Native, `packages/shared` DTO/enums/schemas/helpers. Web dùng React/TypeScript, Tailwind, next-intl (vi/en), TanStack Query, Zustand, Axios, RHF/Zod. Mobile dùng Expo/React Native, NativeWind, TanStack Query, Zustand, Axios/Secure Store.

Web route groups: public landing/login/register; business-ops dashboard, amenities, approvals, facilities, facility amenities, offerings, unit types; facility-manager dashboard/contracts/detail/requests/reservations/storage-units; facility-staff dashboard/contracts/detail; system-admin dashboard/audit-logs/users. Mobile hiện có browse facilities/detail, reservations/detail/payment, contracts/detail và auth/tab flows.

Web Axios gọi `/api` qua Next rewrite; `withCredentials`, refresh queue. `next.config.ts` fallback backend hosted nếu env thiếu. Middleware bảo vệ prefix facility-manager và facility-staff, không bảo vệ business-ops/system-admin; decode JWT payload client-side để điều hướng, không xác minh chữ ký. UI middleware không thay RBAC BE.

Source map: `apps/web/app`, `apps/web/features`, `apps/web/lib/api/axios.ts`, `apps/web/middleware.ts`, `apps/web/next.config.ts`; `apps/mobile/app`, `apps/mobile/features`, `apps/mobile/lib/api`; `packages/shared/src`.
