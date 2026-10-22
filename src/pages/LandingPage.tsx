import { useEffect, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, Box, ChevronDown, Clock3, MapPin, Search, ShieldCheck, Sparkles, Warehouse } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import heroImage from '@/assets/storage-unit-hero.png'
import { FacilityCard } from '@/features/customer/components/FacilityCard'
import { getFacilities, getFacilityDetail, publicApiError } from '@/features/customer/api/customer-discovery-api'
import type { Facility, UnitTypeOffering } from '@/features/customer/api/types'

const steps = [
  { title: 'Tìm cơ sở phù hợp', detail: 'Khám phá các địa điểm và xem thông tin từng cơ sở.', icon: MapPin },
  { title: 'Chọn loại kho', detail: 'So sánh diện tích, kích thước và giá niêm yết.', icon: Warehouse },
  { title: 'Chọn phòng còn trống', detail: 'Xem thông tin phòng kho khả dụng theo cơ sở.', icon: Box },
  { title: 'Đặt kho', detail: 'Quy trình đặt chỗ sẽ sớm được cập nhật trên hệ thống.', icon: Clock3 },
]

const benefits = [
  { title: 'Lựa chọn linh hoạt', detail: 'Xem loại kho và thông tin kích thước theo từng cơ sở.', icon: Sparkles },
  { title: 'Thông tin rõ ràng', detail: 'Tham khảo giá và điều kiện thuê được công bố.', icon: ShieldCheck },
  { title: 'Dễ dàng so sánh', detail: 'Khám phá các địa điểm phù hợp với nhu cầu của bạn.', icon: MapPin },
]

const faqs = [
  ['Làm thế nào để tìm phòng kho?', 'Chọn cơ sở bạn quan tâm, xem các loại kho đang được cung cấp, sau đó lọc danh sách phòng còn trống theo loại, tầng hoặc khu vực.'],
  ['Kích thước kho được thể hiện như thế nào?', 'Mỗi loại kho hiển thị kích thước dài, rộng, cao cùng diện tích và thể tích theo thông tin do cơ sở cung cấp.'],
  ['Làm thế nào để xem tiện ích của một cơ sở?', 'Mở trang chi tiết cơ sở để xem các tiện ích và dịch vụ đã được công bố, kèm trạng thái miễn phí hoặc mức giá nếu có.'],
  ['Giá thuê hiển thị đã là tổng thanh toán chưa?', 'Giá được trình bày theo đơn vị tính ghi trên từng thông tin loại kho. Đây chưa phải tổng thanh toán cuối cùng.'],
]

export function LandingPage() {
  const navigate = useNavigate()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [unitTypes, setUnitTypes] = useState<UnitTypeOffering[]>([])
  const [homeError, setHomeError] = useState('')
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)

  useEffect(() => {
    let active = true
    getFacilities({ limit: 6, page: 1, sortBy: 'createdAt', sortOrder: 'desc' }).then(async (result) => {
      if (!active) return
      setFacilities(result.items.slice(0, 3))
      const details = await Promise.all(result.items.slice(0, 3).map((facility) => getFacilityDetail(facility.id).catch(() => null)))
      if (active) setUnitTypes(details.flatMap((detail) => detail?.unitTypeOfferings ?? []).slice(0, 4))
    }).catch((error: unknown) => { if (active) setHomeError(publicApiError(error)) })
    return () => { active = false }
  }, [])

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (city.trim()) params.set('city', city.trim())
    navigate(`/facilities${params.size ? `?${params}` : ''}`)
  }

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_10%,rgba(217,231,212,.7),transparent_40%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pt-10 pb-14 sm:px-10 sm:pt-16 sm:pb-20 lg:grid-cols-[1fr_.94fr]">
          <div className="relative z-10 max-w-2xl motion-safe:animate-[fade-up_.65s_ease-out_both]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/85 px-3.5 py-2 text-xs font-medium text-muted-foreground"><span className="size-1.5 rounded-full bg-primary"/> Không gian lưu trữ linh hoạt, dễ tìm</div>
            <h1 className="max-w-[760px] text-[clamp(2.8rem,7vw,5.6rem)] leading-[1.02] font-medium tracking-[-.065em] text-foreground">Không Gian Lưu Trữ <span className="font-serif text-primary italic">Linh Hoạt</span> Cho Mọi Nhu Cầu</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">Tìm cơ sở, so sánh loại kho và chọn không gian phù hợp với nhịp sống của bạn.</p>
            <form onSubmit={submitSearch} className="mt-8 grid gap-2 rounded-[1.4rem] border border-border bg-card p-2 shadow-[0_20px_60px_-45px_rgba(20,50,31,.4)] sm:grid-cols-[1fr_190px_auto]">
              <label className="flex min-w-0 items-center gap-3 px-3 py-3"><Search size={18} className="shrink-0 text-primary"/><span className="sr-only">Tìm cơ sở theo tên hoặc địa chỉ</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên cơ sở hoặc địa chỉ" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"/></label>
              <label className="flex items-center gap-2 border-t border-border px-3 py-3 sm:border-t-0 sm:border-l"><MapPin size={17} className="shrink-0 text-primary"/><span className="sr-only">Thành phố</span><input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Thành phố" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"/></label>
              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Tìm kho phù hợp <ArrowRight size={16}/></button>
            </form>
            <div className="mt-5 flex flex-wrap items-center gap-4"><Link to="/facilities" className="inline-flex items-center gap-2 rounded-full bg-[#ed8a48] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#df7835]">Khám phá cơ sở <ArrowUpRight size={16}/></Link><span className="text-sm text-muted-foreground">Duyệt thông tin cơ sở công khai</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-[600px] lg:ml-auto motion-safe:animate-[fade-up_.8s_.12s_ease-out_both]"><figure className="aspect-[1.13] overflow-hidden rounded-[2rem] bg-secondary shadow-[0_32px_75px_-45px_rgba(38,54,40,.48)] sm:aspect-[1.2]"><img src={heroImage} alt="Không gian lưu trữ gọn gàng" className="size-full object-cover object-[65%_center]"/></figure><div className="absolute -bottom-5 left-4 max-w-[245px] rounded-2xl border border-border bg-card p-4 shadow-lg sm:-left-6 sm:bottom-8"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary"><Warehouse size={19}/></span><div><p className="text-sm font-semibold">Tìm đúng không gian</p><p className="mt-0.5 text-xs text-muted-foreground">Từ cơ sở đến phòng kho</p></div></div></div></div>
        </div>
      </section>
      <section id="how-it-works" className="border-y border-border bg-card/80"><div className="mx-auto max-w-7xl px-5 py-12 sm:px-10 sm:py-16"><div className="max-w-2xl"><p className="text-xs font-semibold tracking-[.18em] text-primary uppercase">Cách hoạt động</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Tìm kho theo cách đơn giản</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Từng bước rõ ràng để khám phá các lựa chọn lưu trữ phù hợp.</p></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{steps.map(({ title, detail, icon: Icon }, index) => <article key={title} className="relative rounded-3xl border border-border bg-background p-5"><div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-secondary text-primary"><Icon size={19}/></span><span className="font-serif text-3xl text-primary/30">0{index + 1}</span></div><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p></article>)}</div></div></section>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-10 sm:py-20"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold tracking-[.18em] text-primary uppercase">Địa điểm</p><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Khám phá các cơ sở</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Thông tin địa điểm và lựa chọn kho theo dữ liệu cơ sở công bố.</p></div><Link to="/facilities" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">Xem tất cả cơ sở <ArrowRight size={16}/></Link></div>{homeError && facilities.length === 0 && <p role="status" className="mt-6 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">{homeError} <Link className="font-semibold text-primary" to="/facilities">Mở danh sách cơ sở</Link></p>}{!homeError && facilities.length === 0 && <p role="status" className="mt-6 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">Đang tải danh sách cơ sở…</p>}{facilities.length > 0 && <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{facilities.map((facility) => <FacilityCard key={facility.id} facility={facility}/>)}</div>}</section>
      <section className="bg-[#eef3ed]"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-10 sm:py-20"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold tracking-[.18em] text-primary uppercase">Kích thước kho</p><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Chọn theo không gian cần dùng</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Thông số và giá được lấy từ loại kho đang được cung cấp tại các cơ sở.</p></div><Link to="/facilities" className="text-sm font-semibold text-primary">Khám phá loại kho <ArrowRight className="inline" size={16}/></Link></div>{unitTypes.length === 0 ? <p className="mt-6 rounded-2xl border border-border bg-card/80 p-5 text-sm text-muted-foreground">{facilities.length ? 'Các loại kho sẽ hiển thị khi có thông tin cung cấp từ cơ sở.' : 'Đang tải thông tin loại kho…'}</p> : <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{unitTypes.map((offering) => <article key={offering.id} className="rounded-3xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none"><span className="grid size-11 place-items-center rounded-2xl bg-secondary text-primary"><Box size={20}/></span><h3 className="mt-4 font-semibold">{offering.unitType.name}</h3><p className="mt-2 text-sm text-muted-foreground">{offering.unitType.dimensions.length} × {offering.unitType.dimensions.width} × {offering.unitType.dimensions.height} m</p><p className="mt-1 text-xs text-muted-foreground">{offering.unitType.area} m² · {offering.unitType.volume} m³</p><p className="mt-4 text-sm leading-6 text-muted-foreground">Không gian phù hợp để bạn tham khảo theo kích thước đồ cần lưu trữ.</p><Link to={`/facilities/${offering.facilityId}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Xem cơ sở <ArrowRight size={14}/></Link></article>)}</div>}</div></section>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-10 sm:py-20"><div className="grid gap-6 md:grid-cols-3">{benefits.map(({ title, detail, icon: Icon }) => <article key={title} className="rounded-3xl border border-border bg-card p-6"><span className="grid size-11 place-items-center rounded-2xl bg-secondary text-primary"><Icon size={19}/></span><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p></article>)}</div></section>
      <section className="border-y border-border bg-card/70"><div className="mx-auto max-w-4xl px-5 py-14 sm:px-10 sm:py-20"><p className="text-xs font-semibold tracking-[.18em] text-primary uppercase">Câu hỏi thường gặp</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Thông tin bạn cần biết</h2><div className="mt-7 divide-y divide-border">{faqs.map(([question, answer], index) => <article key={question} className="py-5"><button type="button" aria-expanded={expandedFaq === index} onClick={() => setExpandedFaq(expandedFaq === index ? null : index)} className="flex w-full items-center justify-between gap-4 text-left font-medium"><span>{question}</span><ChevronDown size={18} className={`shrink-0 text-primary transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`}/></button>{expandedFaq === index && <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{answer}</p>}</article>)}</div></div></section>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-10 sm:py-20"><div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground sm:px-12 sm:py-14"><div className="absolute -top-24 right-0 size-72 rounded-full bg-white/5 blur-2xl"/><div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold tracking-[.18em] text-white/65 uppercase">Bắt đầu hành trình</p><h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Tìm thêm không gian cho điều quan trọng</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/75">Khám phá cơ sở và xem những lựa chọn kho đang được cung cấp.</p></div><Link to="/facilities" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#ed8a48] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#df7835]">Tìm kho phù hợp <ArrowRight size={16}/></Link></div></div><a href="#how-it-works" className="mx-auto mt-8 flex w-fit items-center gap-2 text-xs text-muted-foreground">Về đầu trang <ArrowDown size={14} className="rotate-180"/></a></section>
    </main>
  )
}
