import { ArrowUpRight, Layers3 } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="rounded-3xl border border-[#e5e9e2] bg-white p-7 shadow-[0_8px_32px_-24px_rgba(30,50,35,0.24)] sm:p-10">
      <span className="mb-7 grid size-12 place-items-center rounded-2xl bg-[#edf3ed] text-[#31583f]">
        <Layers3 size={22} strokeWidth={1.7} />
      </span>
      <p className="text-xs font-semibold tracking-[0.16em] text-[#849087] uppercase">
        Frontend foundation
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#202521]">
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[#758078]">
        Khu vực này đã được định tuyến và bố trí trong codebase. Tính năng
        nghiệp vụ sẽ được triển khai ở phase tương ứng.
      </p>
      <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f4f6f2] px-4 py-2 text-xs font-medium text-[#627067]">
        Sẵn sàng mở rộng <ArrowUpRight size={14} />
      </div>
    </section>
  )
}
