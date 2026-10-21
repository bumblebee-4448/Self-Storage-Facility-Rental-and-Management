import { ArrowUpRight, Box } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#f9faf7] text-[#202521]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
        <Link
          to="/"
          className="flex items-center gap-3 font-semibold tracking-tight"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-[#244431] text-white">
            <Box size={19} strokeWidth={1.8} />
          </span>
          <span className="text-lg">
            Haven<span className="text-[#78937e]">.</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-[#667069] md:flex">
          <Link className="transition hover:text-[#244431]" to="/facilities">
            Cơ sở lưu trữ
          </Link>
          <a className="transition hover:text-[#244431]" href="#how-it-works">
            Cách hoạt động
          </a>
          <a className="transition hover:text-[#244431]" href="#about">
            Về chúng tôi
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/auth/login"
            className="hidden px-3 py-2 text-sm font-medium text-[#46534a] sm:inline-flex"
          >
            Đăng nhập
          </Link>
          <Link
            to="/facilities"
            className="inline-flex items-center gap-2 rounded-full bg-[#244431] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#31583f]"
          >
            Tìm kho <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <Outlet />
      <footer id="about" className="border-t border-[#e8ebe5]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-[#758078] sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <Link to="/" className="font-semibold text-[#244431]">
            Haven Storage
          </Link>
          <p>Không gian của bạn, được chăm sóc chu đáo.</p>
          <Link to="/portal/login" className="transition hover:text-[#244431]">
            Dành cho nhân viên
          </Link>
        </div>
      </footer>
    </div>
  )
}
