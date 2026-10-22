import { ArrowUpRight, Building2, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'

const internalTeams = [
  'Quản trị hệ thống',
  'Vận hành doanh nghiệp',
  'Quản lý cơ sở',
  'Nhân viên cơ sở',
]

export function PortalLoginPage() {
  return (
    <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-[#e0e7df] bg-white shadow-[0_32px_90px_-54px_rgba(36,68,49,0.42)] lg:min-h-[650px] lg:grid-cols-[1.02fr_0.98fr]">
      <section className="relative isolate flex min-h-[390px] flex-col justify-between overflow-hidden bg-[#244431] px-7 py-8 text-white sm:px-10 sm:py-10 lg:min-h-[650px] lg:px-14 lg:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-32 -z-10 size-[420px] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-16 -z-10 size-[290px] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 -z-10 size-72 rounded-full bg-[#6f9076]/20 blur-3xl"
        />

        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <Building2 aria-hidden="true" size={21} strokeWidth={1.7} />
          </span>
          <div>
            <p className="font-semibold tracking-tight">Haven Storage</p>
            <p className="text-xs text-white/65">Cổng làm việc nội bộ</p>
          </div>
        </div>

        <div className="relative max-w-xl py-12 lg:py-16">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.15em] text-[#d5e2d6] uppercase">
            <ShieldCheck aria-hidden="true" size={14} />
            Dành cho đội ngũ Haven
          </p>
          <h1 className="max-w-lg text-4xl leading-[1.08] font-semibold tracking-[-0.04em] sm:text-5xl">
            Mọi hoạt động, <span className="text-[#b9d1bc]">cùng một</span>{' '}
            không gian.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/72 sm:text-base">
            Đăng nhập bằng tài khoản được cấp để tiếp tục công việc tại Haven
            Storage.
          </p>
        </div>

        <div className="border-t border-white/15 pt-5">
          <p className="mb-3 text-xs font-medium text-white/55">
            Một cổng đăng nhập dành cho
          </p>
          <ul className="grid grid-cols-2 gap-x-5 gap-y-2.5 text-sm text-white/85 sm:max-w-lg">
            {internalTeams.map((team) => (
              <li key={team} className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-[#b9d1bc]"
                />
                {team}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-[#edf3ed] text-[#31583f]">
              <ShieldCheck aria-hidden="true" size={22} strokeWidth={1.8} />
            </span>
            <p className="text-xs font-semibold tracking-[0.14em] text-[#78937e] uppercase">
              Đăng nhập nhân viên
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#202521] sm:text-[2.1rem]">
              Chào mừng trở lại
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#758078]">
              Nhập thông tin tài khoản Haven của bạn. Hệ thống sẽ mở đúng khu
              vực làm việc theo tài khoản.
            </p>
          </div>

          <LoginForm entryPoint="internal" />

          <div className="mt-8 border-t border-[#edf0eb] pt-5 text-center">
            <p className="text-sm text-[#758078]">
              Bạn là khách hàng?{' '}
              <Link
                className="font-medium text-[#31583f] underline-offset-4 hover:underline"
                to="/auth/login"
              >
                Đăng nhập khách hàng
                <ArrowUpRight
                  aria-hidden="true"
                  className="ml-1 inline"
                  size={14}
                />
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
