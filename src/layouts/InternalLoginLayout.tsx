import type { ReactNode } from 'react'
import { ArrowLeft, Box } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

interface InternalLoginLayoutProps {
  children?: ReactNode
}
export function InternalLoginLayout({ children }: InternalLoginLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f9faf7] text-[#202521]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-3 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-[#244431] text-white">
            <Box size={18} />
          </span>
          Haven <span className="font-normal text-[#8a938c]">Cổng nội bộ</span>
        </Link>
        <Link
          to="/"
          className="hover:text-primary inline-flex items-center gap-2 text-sm text-[#68736b]"
        >
          <ArrowLeft size={15} /> Trang chủ
        </Link>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-8 sm:px-10 sm:py-12">
        {children ?? <Outlet />}
      </main>
      <p className="text-muted-foreground pb-8 text-center text-xs">
        Chỉ dành cho nhân sự được cấp tài khoản hệ thống.
      </p>
    </div>
  )
}
