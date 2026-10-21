import type { ReactNode } from 'react'
import { Box } from 'lucide-react'
import { Link } from 'react-router-dom'

interface InternalLoginLayoutProps {
  children: ReactNode
}

export function InternalLoginLayout({ children }: InternalLoginLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f9faf7] text-[#202521]">
      <header className="mx-auto flex max-w-7xl items-center px-6 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-3 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-[#244431] text-white">
            <Box size={18} />
          </span>
          Haven <span className="font-normal text-[#8a938c]">Staff</span>
        </Link>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-14">
        {children}
      </main>
    </div>
  )
}
