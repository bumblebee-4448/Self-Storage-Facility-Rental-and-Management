import {
  ArrowUpRight,
  Box,
  Building2,
  LayoutDashboard,
  LogIn,
  ShieldCheck,
} from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { LoginRedirectNotice } from '@/components/auth/LoginRedirectNotice'

const navItems = [
  { label: 'Tổng quan', to: '/portal', icon: LayoutDashboard },
  { label: 'Quản trị hệ thống', to: '/portal/admin', icon: ShieldCheck },
  { label: 'Vận hành doanh nghiệp', to: '/portal/ops', icon: Building2 },
]

export function PortalLayout() {
  const location = useLocation()

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
        <nav className="space-y-1">
          {navItems.map(({ label, to, icon: Icon }) => {
            const active =
              to === '/portal'
                ? location.pathname === to
                : location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active ? 'bg-[#edf3ed] font-medium text-[#244431]' : 'text-[#68736b] hover:bg-[#f7f8f6]'}`}
              >
                <Icon size={17} strokeWidth={1.8} />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-[#f4f6f2] p-4">
          <p className="text-sm font-medium">Giao diện nền tảng</p>
          <p className="mt-1 text-xs leading-5 text-[#778179]">
            Các công cụ nghiệp vụ sẽ được bổ sung trong những giai đoạn tiếp
            theo.
          </p>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-[72px] items-center justify-between border-b border-[#e5e9e2] bg-white px-6 sm:px-10">
          <div>
            <p className="text-xs text-[#879188]">
              Haven Storage / Internal Portal
            </p>
            <p className="mt-1 text-sm font-medium">Workspace</p>
          </div>
          <Link
            to="/portal/login"
            className="inline-flex items-center gap-2 rounded-full border border-[#dfe5dd] px-4 py-2 text-sm text-[#46534a] transition hover:bg-[#f6f8f5]"
          >
            <LogIn size={15} /> Đăng nhập <ArrowUpRight size={14} />
          </Link>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
          <LoginRedirectNotice
            key={`${location.pathname}${location.search}${location.hash}`}
          />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
