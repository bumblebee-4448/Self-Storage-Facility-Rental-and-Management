import { ArrowLeft, ArrowUpRight, LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import heroImage from '@/assets/storage-unit-hero.png'
import { LoginForm } from '@/components/auth/LoginForm'

export function CustomerLoginPage() {
  return (
    <main className="mx-auto grid max-w-7xl gap-10 px-6 py-8 sm:px-10 sm:py-12 lg:min-h-[650px] lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-16 lg:py-16">
      <section className="relative isolate order-2 min-h-[260px] overflow-hidden rounded-[2rem] bg-[#244431] sm:min-h-[340px] lg:order-1 lg:min-h-[540px]">
        <img
          src={heroImage}
          alt="Không gian lưu trữ gọn gàng tại Haven Storage"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14291d]/90 via-[#14291d]/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-9 lg:p-11">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
            <LockKeyhole aria-hidden="true" size={14} />
            Không gian của riêng bạn
          </span>
          <h1 className="max-w-lg text-3xl leading-tight font-medium tracking-tight sm:text-4xl">
            Những điều quan trọng, luôn trong tầm tay.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/80 sm:text-base">
            Đăng nhập để tiếp tục quản lý không gian lưu trữ của bạn.
          </p>
        </div>
      </section>

      <section className="order-1 mx-auto w-full max-w-lg self-center lg:order-2">
        <Link
          to="/"
          className="hover:text-primary focus-visible:ring-ring mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#66736a] transition focus-visible:ring-2 focus-visible:outline-none"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Về trang chủ
        </Link>
        <p className="text-xs font-semibold tracking-[0.16em] text-[#78937e] uppercase">
          Haven Storage
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#202521] sm:text-4xl">
          Chào mừng trở lại
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#758078]">
          Nhập thông tin tài khoản để tiếp tục.
        </p>

        <div className="mt-8 rounded-2xl border border-[#e5e9e2] bg-white p-5 shadow-[0_18px_48px_-36px_rgba(36,68,49,0.38)] sm:p-7">
          <LoginForm entryPoint="customer" />
          <div className="mt-6 border-t border-[#edf0eb] pt-5 text-center text-sm text-[#758078]">
            <span>Chưa có tài khoản? </span>
            <Link
              className="text-primary font-medium underline-offset-4 hover:underline"
              to="/auth/register"
            >
              Tạo tài khoản
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-sm leading-6 text-[#758078]">
          Bạn là nhân viên Haven?{' '}
          <Link
            className="text-primary inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
            to="/portal/login"
          >
            Đăng nhập nội bộ <ArrowUpRight aria-hidden="true" size={14} />
          </Link>
        </p>
        <p className="mt-3 text-center text-xs leading-5 text-[#8a938c]">
          Tài khoản nhân viên đăng nhập tại đây sẽ được chuyển đến không gian
          làm việc phù hợp.
        </p>
      </section>
    </main>
  )
}
