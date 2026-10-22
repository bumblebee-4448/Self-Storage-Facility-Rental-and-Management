import { ArrowUpRight, Building2, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'

export function PortalLoginPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 sm:px-10 lg:grid-cols-[0.9fr_1fr] lg:items-center lg:gap-20">
      <section className="max-w-xl py-4 lg:py-10">
        <span className="mb-6 inline-grid size-12 place-items-center rounded-2xl bg-[#edf3ed] text-[#31583f]">
          <Building2 aria-hidden="true" size={22} strokeWidth={1.8} />
        </span>
        <p className="text-xs font-semibold tracking-[0.16em] text-[#78937e] uppercase">
          Haven Storage · Team
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-[#202521] sm:text-4xl">
          Không gian làm việc nội bộ
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-7 text-[#758078] sm:text-base">
          Một cổng đăng nhập chung dành cho đội ngũ quản trị, vận hành và nhân
          viên tại các cơ sở.
        </p>
        <div className="mt-8 flex items-start gap-3 border-t border-[#e5e9e2] pt-6">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#55745e] ring-1 ring-[#e5e9e2]">
            <ShieldCheck aria-hidden="true" size={17} strokeWidth={1.8} />
          </span>
          <p className="text-sm leading-6 text-[#758078]">
            Khu vực và quyền truy cập được xác định từ tài khoản của bạn sau khi
            đăng nhập.
          </p>
        </div>
        <Link
          to="/"
          className="text-primary mt-8 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
        >
          Về trang Haven Storage <ArrowUpRight aria-hidden="true" size={14} />
        </Link>
      </section>

      <section className="w-full max-w-lg justify-self-center rounded-[1.75rem] border border-[#e5e9e2] bg-white p-5 shadow-[0_22px_64px_-44px_rgba(36,68,49,0.42)] sm:p-8 lg:p-10">
        <p className="text-xs font-semibold tracking-[0.14em] text-[#78937e] uppercase">
          Đăng nhập nhân viên
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#202521] sm:text-3xl">
          Tiếp tục đến workspace
        </h2>
        <p className="mt-3 mb-7 text-sm leading-6 text-[#758078]">
          Dùng tài khoản Haven được cấp cho bạn. Hệ thống sẽ đưa bạn đến khu vực
          phù hợp với tài khoản.
        </p>
        <LoginForm entryPoint="internal" />
        <p className="mt-6 border-t border-[#edf0eb] pt-5 text-center text-sm leading-6 text-[#758078]">
          Bạn là khách hàng?{' '}
          <Link
            className="text-primary font-medium underline-offset-4 hover:underline"
            to="/auth/login"
          >
            Đăng nhập khách hàng
          </Link>
        </p>
      </section>
    </div>
  )
}
