import { Box, CircleUserRound } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export function CustomerLayout() {
  return (
    <div className="min-h-screen bg-[#f9faf7] text-[#202521]">
      <header className="flex items-center justify-between border-b border-[#e8ebe5] bg-white px-6 py-4 sm:px-10">
        <Link to="/" className="flex items-center gap-3 font-semibold">
          <Box className="text-[#31583f]" size={21} /> Haven Storage
        </Link>
        <Link
          to="/auth/login"
          className="flex items-center gap-2 text-sm text-[#667069]"
        >
          <CircleUserRound size={18} /> Tài khoản
        </Link>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-12 sm:px-10">
        <Outlet />
      </main>
    </div>
  )
}
