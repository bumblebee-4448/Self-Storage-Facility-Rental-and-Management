import {
  ArrowDown,
  ArrowRight,
  Check,
  LockKeyhole,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import heroImage from '@/assets/storage-unit-hero.png'

const benefits = [
  {
    title: 'An tâm từ ngày đầu',
    detail: 'Quy trình rõ ràng, thông tin lưu trữ được bảo vệ.',
    icon: LockKeyhole,
  },
  {
    title: 'Dễ dàng bắt đầu',
    detail: 'Tìm lựa chọn phù hợp với nhu cầu và lịch trình của bạn.',
    icon: Sparkles,
  },
  {
    title: 'Hỗ trợ tận tâm',
    detail: 'Đội ngũ sẵn sàng đồng hành trong suốt quá trình.',
    icon: Check,
  },
]

export function LandingPage() {
  return (
    <main>
      <section className="relative mx-auto grid max-w-7xl items-center gap-12 overflow-hidden px-6 pt-12 pb-20 sm:px-10 md:pt-20 md:pb-28 lg:grid-cols-[1.04fr_0.96fr]">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#e0e7dd] bg-white/70 px-3.5 py-2 text-xs font-medium text-[#53645a]">
            <span className="size-1.5 rounded-full bg-[#699176]" />
            Không gian lưu trữ, theo cách nhẹ nhàng hơn
          </div>
          <h1 className="max-w-[720px] text-[clamp(3.1rem,7vw,5.8rem)] leading-[0.99] font-medium tracking-[-0.065em] text-[#1f2a22]">
            Chỗ cho những điều{' '}
            <span className="font-serif text-[#66816e] italic">
              quan trọng.
            </span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[#727d74] sm:text-lg sm:leading-8">
            Một cách đơn giản và an tâm để có thêm không gian. Tìm lựa chọn lưu
            trữ phù hợp với nhịp sống của bạn.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              to="/facilities"
              className="inline-flex items-center gap-3 rounded-full bg-[#244431] px-6 py-4 text-sm font-medium text-white shadow-[0_12px_28px_-18px_rgba(36,68,49,0.75)] transition hover:-translate-y-0.5 hover:bg-[#31583f]"
            >
              Khám phá cơ sở <ArrowRight size={17} />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-3 py-3 text-sm font-medium text-[#66736a] transition hover:text-[#244431]"
            >
              Tìm hiểu thêm <ArrowDown size={15} />
            </a>
          </div>
          <div className="mt-14 flex items-center gap-3 border-t border-[#e5e9e2] pt-6 text-sm text-[#7a857d]">
            <span className="size-2 rounded-full bg-[#71937a]" />
            <span>Linh hoạt theo nhu cầu lưu trữ</span>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[570px] lg:ml-auto">
          <figure className="aspect-[1.3] overflow-hidden rounded-[2rem] bg-[#e5e9df] shadow-[0_28px_70px_-42px_rgba(38,54,40,.42)]">
            <img
              src={heroImage}
              alt="Không gian lưu trữ gọn gàng với thùng đồ và ghế bành"
              className="size-full object-cover object-[65%_center]"
            />
          </figure>
        </div>
      </section>
      <section
        id="how-it-works"
        className="border-y border-[#e8ebe5] bg-white/70"
      >
        <div className="mx-auto grid max-w-7xl gap-7 px-6 py-11 sm:grid-cols-3 sm:px-10 sm:py-14">
          {benefits.map(({ title, detail, icon: Icon }) => (
            <article key={title} className="flex gap-4 sm:gap-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#edf3ed] text-[#55745e]">
                <Icon size={19} strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[#334238]">
                  {title}
                </h2>
                <p className="mt-1.5 max-w-xs text-sm leading-6 text-[#7a857d]">
                  {detail}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
