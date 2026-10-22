import { useState } from 'react'
import {
  Box,
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getPublicErrorMessage } from '@/api/error-message'
import { useAuthStore } from '@/stores/auth-store'
import type { Role } from '@/models/auth'

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
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const role = user?.roles[0]
  const visibleItems = navItems.filter((item) => item.role === role)
  async function handleSignOut() {
    setLogoutError('')
    const result = await signOut()
    if (result.success) navigate('/portal/login', { replace: true })
    else setLogoutError(getPublicErrorMessage(result.error))
  }
  function navigation(className = '') {
    return (
      <nav aria-label="Điều hướng cổng nội bộ" className={className}>
        {visibleItems.map(({ label, to, icon: Icon }) => {
          const active =
            to === '/portal'
              ? location.pathname === to
              : location.pathname === to ||
                location.pathname.startsWith(`${to}/`)
          return (
            <Link
              key={to}
              onClick={() => setMenuOpen(false)}
              to={to}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active ? 'bg-[#edf3ed] font-medium text-[#244431]' : 'text-[#68736b] hover:bg-[#f7f8f6]'}`}
            >
              <Icon size={17} strokeWidth={1.8} />
              {label}
            </Link>
          )
        })}
      </nav>
    )
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
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-medium">
                {user?.name ?? user?.email}
              </span>
              <span className="text-muted-foreground text-xs">
                {role ? roleLabels[role] : ''}
              </span>
            </span>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="hidden items-center gap-2 rounded-full border border-[#dfe5dd] px-4 py-2 text-sm text-[#46534a] transition hover:bg-[#f6f8f5] sm:inline-flex"
            >
              <LogOut size={15} /> Đăng xuất
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Đóng điều hướng' : 'Mở điều hướng'}
              aria-expanded={menuOpen}
              className="grid size-10 place-items-center rounded-full border border-[#dfe5dd] lg:hidden"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </header>
        {menuOpen && (
          <div className="border-b border-[#e5e9e2] bg-white p-4 lg:hidden">
            {navigation('space-y-1')}
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm"
            >
              <LogOut size={17} /> Đăng xuất
            </button>
          </div>
        )}
        {logoutError && (
          <p role="alert" className="px-6 pt-4 text-sm text-red-700">
            {logoutError}
          </p>
        )}
        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-10 sm:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
