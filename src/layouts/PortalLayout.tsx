import { useState } from 'react'
import {
  Box,
  Building2,
  LayoutDashboard,
  LogIn,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LoginRedirectNotice } from '@/components/auth/LoginRedirectNotice'
import { useAuthStore } from '@/stores/auth-store'
import type { NormalizedApiError } from '@/api/errors'

function logoutErrorMessage(error: NormalizedApiError): string {
  if (error.kind === 'network')
    return 'Không thể kết nối để đăng xuất. Phiên hiện tại vẫn được giữ.'
  if (error.kind === 'timeout')
    return 'Yêu cầu đăng xuất đã hết thời gian chờ. Phiên hiện tại vẫn được giữ.'
  if (error.kind === 'http' && error.status >= 500)
    return 'Máy chủ chưa thể hoàn tất đăng xuất. Phiên hiện tại vẫn được giữ.'
  return 'Không thể đăng xuất. Vui lòng thử lại.'
}

const navItems: {
  label: string
  to: string
  role: Role
  icon: typeof LayoutDashboard
}[] = [
  {
    label: 'Quản trị hệ thống',
    to: '/portal/admin',
    role: 'SYSTEM_ADMIN',
    icon: ShieldCheck,
  },
  {
    label: 'Vận hành doanh nghiệp',
    to: '/portal/ops',
    role: 'BUSINESS_OPS_MANAGER',
    icon: Building2,
  },
  {
    label: 'Quản lý cơ sở',
    to: '/portal/manager',
    role: 'FACILITY_MANAGER',
    icon: Building2,
  },
  {
    label: 'Nhân viên cơ sở',
    to: '/portal/staff',
    role: 'FACILITY_STAFF',
    icon: LayoutDashboard,
  },
]
const roleLabels: Record<Role, string> = {
  CUSTOMER: 'Khách hàng',
  SYSTEM_ADMIN: 'Quản trị hệ thống',
  BUSINESS_OPS_MANAGER: 'Quản lý vận hành',
  FACILITY_MANAGER: 'Quản lý cơ sở',
  FACILITY_STAFF: 'Nhân viên cơ sở',
}

export function PortalLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const [logoutPending, setLogoutPending] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  async function handleLogout() {
    if (logoutPending) return
    setLogoutPending(true)
    setLogoutError(null)
    try {
      const result = await signOut()
      if (result.success) {
        navigate('/portal/login', { replace: true })
      } else {
        setLogoutError(logoutErrorMessage(result.error))
      }
    } finally {
      setLogoutPending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f2] text-[#202521] lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-[#e5e9e2] bg-white px-5 py-6 lg:flex lg:flex-col">
        <Link
          to="/portal"
          className="mb-10 flex items-center gap-3 px-2 font-semibold"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-[#244431] text-white">
            <Box size={18} />
          </span>
          Haven <span className="font-normal text-[#8a938c]">Staff</span>
        </Link>
        <p className="mb-3 px-3 text-[11px] font-semibold tracking-[0.14em] text-[#9aa29b] uppercase">
          Không gian làm việc
        </p>
        {navigation('space-y-1')}
        <div className="mt-auto rounded-2xl bg-[#f4f6f2] p-4">
          <p className="text-sm font-medium">
            {role ? roleLabels[role] : 'Cổng nội bộ'}
          </p>
          <p className="mt-1 truncate text-xs text-[#778179]">
            {user?.name ?? user?.email}
          </p>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex min-h-[72px] items-center justify-between border-b border-[#e5e9e2] bg-white px-5 sm:px-10">
          <div>
            <p className="text-xs text-[#879188]">
              Haven Storage / Cổng nội bộ
            </p>
            <p className="mt-1 text-sm font-medium">
              {role ? roleLabels[role] : 'Không gian làm việc'}
            </p>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <span
                className="hidden max-w-48 truncate text-sm text-[#46534a] sm:block"
                title={user.email}
                aria-label="Tài khoản đang đăng nhập"
              >
                {user.name || user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutPending}
                aria-busy={logoutPending}
                className="inline-flex items-center gap-2 rounded-full border border-[#dfe5dd] px-4 py-2 text-sm text-[#46534a] transition hover:bg-[#f6f8f5] disabled:cursor-wait disabled:opacity-60"
              >
                <LogOut size={15} />
                {logoutPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
              </button>
            </div>
          ) : (
            <Link
              to="/portal/login"
              className="inline-flex items-center gap-2 rounded-full border border-[#dfe5dd] px-4 py-2 text-sm text-[#46534a] transition hover:bg-[#f6f8f5]"
            >
              <LogIn size={15} /> Đăng nhập <ArrowUpRight size={14} />
            </Link>
          )}
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
          {logoutError && (
            <p role="alert" className="mb-5 text-sm text-red-700">
              {logoutError}
            </p>
          )}
          <LoginRedirectNotice
            key={`${location.pathname}${location.search}${location.hash}`}
          />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
