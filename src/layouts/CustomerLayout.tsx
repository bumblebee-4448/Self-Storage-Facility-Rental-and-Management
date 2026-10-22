import { useState } from 'react'
import {
  Box,
  CalendarDays,
  CircleUserRound,
  LogOut,
  Menu,
  UserRound,
  X,
} from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getPublicErrorMessage } from '@/api/error-message'
import { LoginRedirectNotice } from '@/components/auth/LoginRedirectNotice'
import { useAuthStore } from '@/stores/auth-store'

export function CustomerLayout() {
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  async function handleSignOut() {
    setLogoutError('')
    const result = await signOut()
    if (result.success) navigate('/auth/login', { replace: true })
    else setLogoutError(getPublicErrorMessage(result.error))
  }
  return (
    <div className="min-h-screen bg-[#f9faf7] text-[#202521]">
      <header className="border-b border-[#e8ebe5] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-10">
          <Link to="/account" className="flex items-center gap-3 font-semibold">
            <Box className="text-[#31583f]" size={21} /> Haven Storage
          </Link>
          <nav
            aria-label="Tài khoản"
            className="hidden items-center gap-4 sm:flex"
          >
            <Link
              to="/account/profile"
              className="hover:text-primary inline-flex items-center gap-2 text-sm text-[#667069]"
            >
              <UserRound size={17} /> Hồ sơ
            </Link>
            <Link
              to="/account/reservations"
              className="hover:text-primary inline-flex items-center gap-2 text-sm text-[#667069]"
            >
              <CalendarDays size={17} /> Đặt chỗ của tôi
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="inline-flex items-center gap-2 rounded-full border border-[#dfe5dd] px-4 py-2 text-sm text-[#46534a] hover:bg-[#f6f8f5]"
            >
              <LogOut size={15} /> Đăng xuất
            </button>
          </nav>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full border border-[#dfe5dd] sm:hidden"
            aria-label={menuOpen ? 'Đóng menu tài khoản' : 'Mở menu tài khoản'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {menuOpen && (
          <nav className="space-y-1 border-t border-[#e8ebe5] bg-white px-5 py-3 sm:hidden">
            <Link
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm hover:bg-[#f4f6f2]"
              to="/account/profile"
            >
              Hồ sơ · {user?.name ?? user?.email}
            </Link>
            <Link
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm hover:bg-[#f4f6f2]"
              to="/account/reservations"
            >
              Đặt chỗ của tôi
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="w-full rounded-xl px-4 py-3 text-left text-sm hover:bg-[#f4f6f2]"
            >
              Đăng xuất
            </button>
          </nav>
        )}
      </header>
      {logoutError && (
        <p
          role="alert"
          className="mx-auto max-w-7xl px-6 pt-4 text-sm text-red-700"
        >
          {logoutError}
        </p>
      )}
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-10 sm:py-12">
        <LoginRedirectNotice
          key={`${location.pathname}${location.search}${location.hash}`}
        />
        <Outlet />
      </main>
      <footer className="border-t border-[#e8ebe5] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-6 py-5 text-xs text-[#758078] sm:px-10">
          <CircleUserRound size={15} /> Tài khoản Haven Storage
        </div>
      </footer>
    </div>
  )
}
