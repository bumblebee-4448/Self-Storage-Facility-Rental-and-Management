import { lazy, Suspense } from 'react'

const LoginPage = lazy(() =>
  import('@/pages/CustomerLoginPage').then((module) => ({
    default: module.CustomerLoginPage,
  })),
)
const InternalLoginPage = lazy(() =>
  import('@/pages/PortalLoginPage').then((module) => ({
    default: module.PortalLoginPage,
  })),
)
const RegisterPage = lazy(() =>
  import('@/pages/auth/AuthPages').then((module) => ({
    default: module.RegisterPage,
  })),
)
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/AuthPages').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
)
const ResetPasswordPage = lazy(() =>
  import('@/pages/auth/AuthPages').then((module) => ({
    default: module.ResetPasswordPage,
  })),
)
const AccountHomePage = lazy(() =>
  import('@/pages/account/AccountPages').then((module) => ({
    default: module.AccountHomePage,
  })),
)
const ProfilePage = lazy(() =>
  import('@/pages/account/AccountPages').then((module) => ({
    default: module.ProfilePage,
  })),
)
const ChangePasswordPage = lazy(() =>
  import('@/pages/account/AccountPages').then((module) => ({
    default: module.ChangePasswordPage,
  })),
)
const FacilitiesPage = lazy(() =>
  import('@/features/customer/pages/FacilitiesPage').then((module) => ({
    default: module.FacilitiesPage,
  })),
)
const FacilityDetailPage = lazy(() =>
  import('@/features/customer/pages/FacilityDetailPage').then((module) => ({
    default: module.FacilityDetailPage,
  })),
)
const StorageDiscoveryPage = lazy(() =>
  import('@/features/customer/pages/StorageDiscoveryPage').then((module) => ({
    default: module.StorageDiscoveryPage,
  })),
)
const NewReservationPage = lazy(() =>
  import('@/features/customer/reservations/pages/NewReservationPage').then(
    (module) => ({ default: module.NewReservationPage }),
  ),
)
const ReservationReviewPage = lazy(() =>
  import('@/features/customer/reservations/pages/ReservationPages').then(
    (module) => ({ default: module.ReservationReviewPage }),
  ),
)
const MyReservationsPage = lazy(() =>
  import('@/features/customer/reservations/pages/ReservationPages').then(
    (module) => ({ default: module.MyReservationsPage }),
  ),
)
const ReservationDetailsPage = lazy(() =>
  import('@/features/customer/reservations/pages/ReservationPages').then(
    (module) => ({ default: module.ReservationDetailsPage }),
  ),
)

function PageLoading() {
  return (
    <main className="grid min-h-[40vh] place-items-center p-6">
      <p
        role="status"
        className="rounded-2xl border border-[#e5e9e2] bg-white px-5 py-4 text-sm text-[#526057]"
      >
        Đang tải trang…
      </p>
    </main>
  )
}

export function LoginRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <LoginPage />
    </Suspense>
  )
}
export function InternalLoginRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <InternalLoginPage />
    </Suspense>
  )
}
export function RegisterRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <RegisterPage />
    </Suspense>
  )
}
export function ForgotPasswordRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ForgotPasswordPage />
    </Suspense>
  )
}
export function ResetPasswordRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ResetPasswordPage />
    </Suspense>
  )
}
export function AccountHomeRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AccountHomePage />
    </Suspense>
  )
}
export function ProfileRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ProfilePage />
    </Suspense>
  )
}
export function ChangePasswordRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ChangePasswordPage />
    </Suspense>
  )
}
export function FacilitiesRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <FacilitiesPage />
    </Suspense>
  )
}
export function FacilityDetailRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <FacilityDetailPage />
    </Suspense>
  )
}
export function StorageDiscoveryRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <StorageDiscoveryPage />
    </Suspense>
  )
}
export function NewReservationRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <NewReservationPage />
    </Suspense>
  )
}
export function ReservationReviewRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ReservationReviewPage />
    </Suspense>
  )
}
export function MyReservationsRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <MyReservationsPage />
    </Suspense>
  )
}
export function ReservationDetailsRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ReservationDetailsPage />
    </Suspense>
  )
}
