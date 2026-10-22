import type { ReactNode } from 'react'
import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { getPublicErrorMessage } from '@/api/error-message'
import { useAuthStore } from '@/stores/auth-store'
import type { Role } from '@/models/auth'
import { roleHome } from '@/config/roles'

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
  const destination = user ? roleHome[user.roles[0]] : '/'
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
}
export function RequireAuth({ allowedRoles, children }: RequireAuthProps) {
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  if (status === 'idle' || status === 'checking') return <AuthPending />
  if (status === 'error') return <AuthRetry />
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
  if (allowedRoles && !user.roles.some((role) => allowedRoles.includes(role)))
    return <AccessDenied />
  return children ? <>{children}</> : <Outlet />
}

export function RoleHomeRedirect() {
  const role = useAuthStore((state) => state.user?.roles[0])
  return role ? (
    <Navigate to={roleHome[role]} replace />
  ) : (
    <Navigate to="/portal/login" replace />
  )
}

export function RoleDashboard({
  role,
  title,
  description,
}: {
  role: Role
  title: string
  description: string
}) {
  const user = useAuthStore((state) => state.user)
  if (!user?.roles.includes(role)) return <AccessDenied />
  return (
    <section className="rounded-3xl border border-[#e5e9e2] bg-white p-7 sm:p-10">
      <p className="text-xs font-semibold tracking-[0.16em] text-[#849087] uppercase">
        Không gian làm việc
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#758078]">
        {description}
      </p>
      <div className="mt-8 rounded-2xl border border-dashed border-[#d9e1d8] bg-[#f9faf7] p-5 text-sm text-[#758078]">
        Các dữ liệu và nghiệp vụ sẽ hiển thị khi backend hỗ trợ và được tích
        hợp. Hiện chưa có số liệu vận hành để hiển thị.
      </div>
    </section>
  )
}
