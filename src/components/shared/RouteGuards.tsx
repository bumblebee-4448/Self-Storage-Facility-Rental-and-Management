import type { ReactNode } from 'react'
import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { getPublicErrorMessage } from '@/api/error-message'
import { useAuthStore } from '@/stores/auth-store'
import type { Role } from '@/models/auth'
import { internalRoles, roleHome } from '@/config/roles'

function getKnownInternalRoles(
  roles: readonly Role[] = [],
): Exclude<Role, 'CUSTOMER'>[] {
  return roles.filter(
    (role): role is Exclude<Role, 'CUSTOMER'> =>
      role !== 'CUSTOMER' && internalRoles.includes(role),
  )
}

function AuthPending() {
  return (
    <main className="grid min-h-[55vh] place-items-center p-6">
      <div
        role="status"
        aria-label="Đang kiểm tra phiên"
        className="flex items-center gap-3 rounded-2xl border border-[#e5e9e2] bg-white px-5 py-4 text-sm text-[#526057]"
      >
        <LoaderCircle className="animate-spin" size={18} /> Đang kiểm tra phiên
        đăng nhập…
      </div>
    </main>
  )
}

function AuthRetry() {
  const retry = useAuthStore((state) => state.retryBootstrap)
  const error = useAuthStore((state) => state.error)
  return (
    <main className="mx-auto grid min-h-[55vh] max-w-lg place-items-center p-6 text-center">
      <section className="rounded-3xl border border-[#e5e9e2] bg-white p-8">
        <AlertCircle className="mx-auto text-[#b87925]" />
        <h1 className="mt-4 text-xl font-semibold">Chưa thể kiểm tra phiên</h1>
        <p className="mt-2 text-sm text-[#758078]">
          {error
            ? getPublicErrorMessage(error)
            : 'Kết nối máy chủ để tiếp tục.'}
        </p>
        <Button className="mt-5" onClick={() => void retry()}>
          <RefreshCw size={16} /> Thử lại
        </Button>
      </section>
    </main>
  )
}

export function AccessDenied() {
  const user = useAuthStore((state) => state.user)
  const userInternalRoles = getKnownInternalRoles(user?.roles)
  const destination =
    userInternalRoles.length === 1
      ? roleHome[userInternalRoles[0]]
      : userInternalRoles.length > 1
        ? '/portal'
        : user?.roles.includes('CUSTOMER')
          ? '/account'
          : '/portal/login'
  return (
    <main className="mx-auto grid min-h-[55vh] max-w-lg place-items-center p-6 text-center">
      <section className="rounded-3xl border border-[#e5e9e2] bg-white p-8">
        <p className="text-xs font-semibold tracking-widest text-[#778179] uppercase">
          403 · Không có quyền
        </p>
        <h1 className="mt-3 text-2xl font-semibold">
          Khu vực này không dành cho tài khoản của bạn
        </h1>
        <p className="mt-2 text-sm text-[#758078]">
          Quyền điều hướng ở đây chỉ hỗ trợ trải nghiệm; máy chủ vẫn là nơi xác
          thực quyền truy cập.
        </p>
        <Link
          to={destination}
          className="bg-primary text-primary-foreground mt-6 inline-flex rounded-full px-5 py-3 text-sm font-medium"
        >
          Về khu vực của tôi
        </Link>
      </section>
    </main>
  )
}

interface RequireAuthProps {
  allowedRoles?: Role[]
  children?: ReactNode
  keepAuthenticatedShellDuringCheck?: boolean
}
export function RequireAuth({
  allowedRoles,
  children,
  keepAuthenticatedShellDuringCheck = false,
}: RequireAuthProps) {
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const userHasAllowedRole =
    user &&
    (!allowedRoles || user.roles.some((role) => allowedRoles.includes(role)))
  if (status === 'idle' || status === 'checking') {
    if (keepAuthenticatedShellDuringCheck && userHasAllowedRole) {
      return children ? <>{children}</> : <Outlet />
    }
    return <AuthPending />
  }
  if (status === 'error') {
    if (keepAuthenticatedShellDuringCheck && userHasAllowedRole) {
      return children ? <>{children}</> : <Outlet />
    }
    return <AuthRetry />
  }
  if (status !== 'authenticated' || !user) {
    const loginPath = location.pathname.startsWith('/portal')
      ? '/portal/login'
      : '/auth/login'
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }
  if (allowedRoles && !userHasAllowedRole) return <AccessDenied />
  return children ? <>{children}</> : <Outlet />
}

export function RoleHomeRedirect() {
  const user = useAuthStore((state) => state.user)
  const roles = getKnownInternalRoles(user?.roles)
  if (roles.length === 1) return <Navigate to={roleHome[roles[0]]} replace />
  if (roles.length === 0) return <Navigate to="/portal/login" replace />

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">
        Chọn khu vực làm việc
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Tài khoản của bạn có nhiều vai trò. Chọn không gian cần mở.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {roles.map((role) => (
          <Link
            key={role}
            to={roleHome[role]}
            className="border-border bg-card hover:border-primary/40 hover:bg-secondary rounded-2xl border p-5 font-medium transition"
          >
            {roleTitle[role]}
          </Link>
        ))}
      </div>
    </section>
  )
}

const roleTitle: Record<Role, string> = {
  CUSTOMER: 'Khách hàng',
  SYSTEM_ADMIN: 'Quản trị hệ thống',
  BUSINESS_OPS_MANAGER: 'Vận hành doanh nghiệp',
  FACILITY_MANAGER: 'Quản lý cơ sở',
  FACILITY_STAFF: 'Nhân viên cơ sở',
}
