import { useState } from 'react'
import {
  Box,
  Building2,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Sparkles,
  Users,
  Warehouse,
  X,
} from 'lucide-react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { LoginRedirectNotice } from '@/components/auth/LoginRedirectNotice'
import { SafeErrorBoundary } from '@/components/shared/SafeErrorBoundary'
import { useAuthStore } from '@/stores/auth-store'
import type { NormalizedApiError } from '@/api/errors'
import type { Role } from '@/models/auth'

function logoutErrorMessage(error: NormalizedApiError): string {
  if (error.kind === 'network')
    return 'Không thể kết nối để đăng xuất. Phiên hiện tại vẫn được giữ.'
  if (error.kind === 'timeout')
    return 'Yêu cầu đăng xuất đã hết thời gian chờ. Phiên hiện tại vẫn được giữ.'
  if (error.kind === 'http' && error.status >= 500)
    return 'Máy chủ chưa thể hoàn tất đăng xuất. Phiên hiện tại vẫn được giữ.'
  return 'Không thể đăng xuất. Vui lòng thử lại.'
}

const roleLabels: Record<Role, string> = {
  CUSTOMER: 'Khách hàng',
  SYSTEM_ADMIN: 'Quản trị hệ thống',
  BUSINESS_OPS_MANAGER: 'Quản lý vận hành',
  FACILITY_MANAGER: 'Quản lý cơ sở',
  FACILITY_STAFF: 'Nhân viên cơ sở',
}

const portalNoticeDefaultPaths: Record<string, string> = {
  '/portal/admin': '/portal/admin/users',
  '/portal/ops': '/portal/ops/facilities',
  '/portal/manager': '/portal/manager/storage-units',
  '/portal/staff': '/portal/staff/contracts',
}

const navItems: {
  label: string
  to: string
  role: Role
  icon: typeof LayoutDashboard
}[] = [
  {
    label: 'Người dùng',
    to: '/portal/admin/users',
    role: 'SYSTEM_ADMIN',
    icon: Users,
  },
  {
    label: 'Nhật ký hệ thống',
    to: '/portal/admin/audit-logs',
    role: 'SYSTEM_ADMIN',
    icon: FileText,
  },
  {
    label: 'Cơ sở',
    to: '/portal/ops/facilities',
    role: 'BUSINESS_OPS_MANAGER',
    icon: Building2,
  },
  {
    label: 'Loại kho',
    to: '/portal/ops/unit-types',
    role: 'BUSINESS_OPS_MANAGER',
    icon: Package,
  },
  {
    label: 'Tiện ích',
    to: '/portal/ops/amenities',
    role: 'BUSINESS_OPS_MANAGER',
    icon: Sparkles,
  },
  {
    label: 'Gói dịch vụ',
    to: '/portal/ops/offerings',
    role: 'BUSINESS_OPS_MANAGER',
    icon: Warehouse,
  },
  {
    label: 'Tiện ích cơ sở',
    to: '/portal/ops/facility-amenities',
    role: 'BUSINESS_OPS_MANAGER',
    icon: Building2,
  },
  {
    label: 'Duyệt yêu cầu',
    to: '/portal/ops/approvals',
    role: 'BUSINESS_OPS_MANAGER',
    icon: ClipboardCheck,
  },
  {
    label: 'Phòng kho',
    to: '/portal/manager/storage-units',
    role: 'FACILITY_MANAGER',
    icon: Warehouse,
  },
  {
    label: 'Đặt chỗ',
    to: '/portal/manager/reservations',
    role: 'FACILITY_MANAGER',
    icon: ClipboardCheck,
  },
  {
    label: 'Hợp đồng',
    to: '/portal/manager/contracts',
    role: 'FACILITY_MANAGER',
    icon: FileText,
  },
  {
    label: 'Yêu cầu',
    to: '/portal/manager/requests',
    role: 'FACILITY_MANAGER',
    icon: LayoutDashboard,
  },
  {
    label: 'Hợp đồng',
    to: '/portal/staff/contracts',
    role: 'FACILITY_STAFF',
    icon: FileText,
  },
  {
    label: 'Phòng kho',
    to: '/portal/staff/storage-units',
    role: 'FACILITY_STAFF',
    icon: Warehouse,
  },
]

function PortalNavigation({
  roles,
  onNavigate,
}: {
  roles: Role[]
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="Điều hướng nội bộ" className="space-y-1">
      {navItems
        .filter((item) => roles.includes(item.role))
        .map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground/75 hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
    </nav>
  )
}

export function PortalLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const authStatus = useAuthStore((state) => state.status)
  const signOut = useAuthStore((state) => state.signOut)
  const [logoutPending, setLogoutPending] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)

  async function handleLogout() {
    if (logoutPending) return
    setLogoutPending(true)
    setLogoutError(null)
    try {
      const result = await signOut()
      if (result.success) navigate('/portal/login', { replace: true })
      else setLogoutError(logoutErrorMessage(result.error))
    } finally {
      setLogoutPending(false)
    }
  }

  const userRoles = user?.roles.filter((role) => role !== 'CUSTOMER') ?? []
  const roleLabel = userRoles.map((role) => roleLabels[role]).join(' · ')
  const identity = user?.name?.trim() || user?.email || 'Tài khoản nội bộ'
  const noticePath =
    portalNoticeDefaultPaths[location.pathname] ?? location.pathname

  return (
    <div className="bg-muted/60 text-foreground min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="border-border bg-card hidden border-r px-5 py-6 lg:flex lg:flex-col">
        <Link
          to="/portal"
          className="mb-9 flex items-center gap-3 px-2 font-semibold"
        >
          <span className="bg-primary text-primary-foreground grid size-10 place-items-center rounded-xl">
            <Box aria-hidden="true" size={19} />
          </span>
          <span>
            Haven{' '}
            <span className="text-muted-foreground font-normal">Staff</span>
          </span>
        </Link>
        <p className="text-muted-foreground mb-3 px-3 text-[11px] font-semibold tracking-[0.14em] uppercase">
          Không gian làm việc
        </p>
        <PortalNavigation roles={userRoles} />
        <div className="bg-muted mt-auto rounded-2xl p-4">
          <p className="text-sm font-medium">{roleLabel || 'Cổng nội bộ'}</p>
          <p
            className="text-muted-foreground mt-1 truncate text-xs"
            title={user?.email}
          >
            {identity}
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-border bg-card flex min-h-[72px] items-center justify-between border-b px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="border-border text-foreground hover:bg-muted grid size-10 place-items-center rounded-xl border lg:hidden"
              aria-label={
                mobileNavigationOpen ? 'Đóng điều hướng' : 'Mở điều hướng'
              }
              aria-expanded={mobileNavigationOpen}
              aria-controls="portal-mobile-navigation"
              onClick={() => setMobileNavigationOpen((open) => !open)}
            >
              {mobileNavigationOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link
              to="/portal"
              className="flex items-center gap-2 font-semibold lg:hidden"
            >
              <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg">
                <Box aria-hidden="true" size={16} />
              </span>
              Haven Staff
            </Link>
            <div className="hidden lg:block">
              <p className="text-muted-foreground text-xs">
                Haven Storage / Cổng nội bộ
              </p>
              <p className="mt-1 text-sm font-medium">
                {roleLabel || 'Không gian làm việc'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-foreground/75 hidden max-w-56 truncate text-sm sm:block"
              title={user?.email}
              aria-label="Tài khoản đang đăng nhập"
            >
              {identity}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutPending}
              aria-busy={logoutPending}
              aria-label={logoutPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
              className="border-border text-foreground/80 hover:bg-muted inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm transition disabled:cursor-wait disabled:opacity-60"
            >
              <LogOut aria-hidden="true" size={15} />
              <span className="hidden sm:inline">
                {logoutPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
              </span>
              <span className="sm:hidden">Thoát</span>
            </button>
          </div>
        </header>

        {mobileNavigationOpen && (
          <div
            id="portal-mobile-navigation"
            className="border-border bg-card border-b p-4 lg:hidden"
          >
            <PortalNavigation
              roles={userRoles}
              onNavigate={() => setMobileNavigationOpen(false)}
            />
            <p className="border-border text-muted-foreground mt-4 truncate border-t pt-4 text-xs">
              {roleLabel} · {identity}
            </p>
          </div>
        )}

        <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10">
          {logoutError && (
            <p
              role="alert"
              className="border-destructive/25 bg-destructive/5 text-destructive mb-5 rounded-xl border px-4 py-3 text-sm"
            >
              {logoutError}
            </p>
          )}
          <LoginRedirectNotice
            key={`${noticePath}${location.search}${location.hash}`}
          />
          <SafeErrorBoundary key={location.pathname}>
            {authStatus === 'error' && logoutError ? (
              <p
                role="status"
                className="border-border bg-card text-muted-foreground rounded-xl border p-4 text-sm"
              >
                Nội dung nghiệp vụ được ẩn trong khi bạn có thể thử đăng xuất
                lại.
              </p>
            ) : (
              <Outlet />
            )}
          </SafeErrorBoundary>
        </main>
      </div>
    </div>
  )
}
