import type { ReactNode } from 'react'
import { Box, LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'

interface InternalLoginLayoutProps {
  children?: ReactNode
}
export function InternalLoginLayout({ children }: InternalLoginLayoutProps) {
  return (
    <div className="min-h-dvh bg-[#f4f6f2] text-[#202521]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 sm:py-5 lg:px-10">
        <Link to="/" className="flex items-center gap-3 font-semibold">
          <span className="grid size-10 place-items-center rounded-xl bg-[#244431] text-white shadow-sm">
            <Box size={18} />
          </span>
          <span>
            Haven <span className="font-normal text-[#8a938c]">Staff</span>
          </span>
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#e1e7df] bg-white/75 px-3 py-2 text-xs font-medium text-[#617067]">
          <LockKeyhole aria-hidden="true" size={14} />
          Cổng nhân sự
        </span>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-8 sm:px-8 sm:pb-12 lg:px-10">
        {children}
      </main>
      <p className="text-muted-foreground pb-8 text-center text-xs">
        Chỉ dành cho nhân sự được cấp tài khoản hệ thống.
      </p>
    </div>
  )
}
