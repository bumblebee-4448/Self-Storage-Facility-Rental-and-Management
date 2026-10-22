import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Clock3, MapPin, Phone, Ruler, Warehouse } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getFacilityDetail, publicApiError } from '@/features/customer/api/customer-discovery-api'
import type { FacilityPublicDetail } from '@/features/customer/api/types'

const fallbackImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85'
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
const billingLabels = { day: 'ngày', month: 'tháng', one_time: 'một lần' }

export function FacilityDetailPage() {
  const { facilityId = '' } = useParams()
  const [detail, setDetail] = useState<FacilityPublicDetail | null>(null)
  const [imageIndex, setImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    void getFacilityDetail(facilityId).then((data) => { if (active) { setDetail(data); setImageIndex(0); setError('') } }).catch((reason: unknown) => { if (active) setError(publicApiError(reason)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [facilityId])
  const facility = detail?.facility
  const images = facility?.images.length ? facility.images : [fallbackImage]

  if (loading) return <main className="mx-auto max-w-7xl px-5 py-14 sm:px-10"><p role="status" className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">Đang tải thông tin cơ sở…</p></main>
  if (error || !detail || !facility) return <main className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-10"><h1 className="text-3xl font-semibold">{error.includes('Không tìm thấy') ? 'Không tìm thấy cơ sở' : 'Chưa thể tải thông tin cơ sở'}</h1><p role="alert" className="mt-3 text-muted-foreground">{error || 'Vui lòng thử lại sau.'}</p><button onClick={() => { setLoading(true); setError(''); void getFacilityDetail(facilityId).then(setDetail).catch((reason: unknown) => setError(publicApiError(reason))).finally(() => setLoading(false)) }} className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Thử lại</button><div><Link to="/facilities" className="mt-4 inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft size={16}/> Về danh sách cơ sở</Link></div></main>

  return (
    <main>
      <section className="mx-auto max-w-7xl px-5 pt-7 sm:px-10 sm:pt-10">
        <Link to="/facilities" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft size={16}/> Tất cả cơ sở</Link>
        <div className="mt-6 grid gap-3 md:grid-cols-[1.5fr_1fr] md:grid-rows-2">
          <div className="relative row-span-2 min-h-64 overflow-hidden rounded-[1.75rem] bg-muted md:min-h-[440px]"><img src={images[imageIndex]} alt={`Không gian tại ${facility.name}`} className="size-full object-cover"/><button type="button" aria-label="Ảnh trước" onClick={() => setImageIndex((index) => (index - 1 + images.length) % images.length)} className="absolute top-1/2 left-4 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-primary shadow"><ArrowLeft size={18}/></button><button type="button" aria-label="Ảnh tiếp theo" onClick={() => setImageIndex((index) => (index + 1) % images.length)} className="absolute top-1/2 right-4 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-primary shadow"><ArrowRight size={18}/></button></div>
          {images.slice(1, 3).map((image, index) => <button type="button" onClick={() => setImageIndex(index + 1)} key={`${image}-${index}`} aria-label={`Xem ảnh ${index + 2}`} className="hidden min-h-48 overflow-hidden rounded-[1.4rem] bg-muted md:block"><img src={image} alt={`Ảnh ${index + 2} của ${facility.name}`} className="size-full object-cover"/></button>)}
          {images.length < 2 && <div className="hidden rounded-[1.4rem] bg-secondary md:grid md:place-items-center"><Warehouse size={38} className="text-primary/50"/></div>}
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <p className="text-xs font-semibold tracking-[.18em] text-primary uppercase">Cơ sở lưu trữ · {facility.city}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{facility.name}</h1>
            <p className="mt-4 flex items-start gap-2 text-base leading-7 text-muted-foreground"><MapPin size={19} className="mt-1 shrink-0 text-primary"/>{facility.address}, {facility.city}</p>
            {facility.description && <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">{facility.description}</p>}
            <div className="mt-8 flex flex-wrap gap-3">{facility.phone && <a href={`tel:${facility.phone}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm"><Phone size={16} className="text-primary"/> {facility.phone}</a>}{facility.operatingHours && <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm text-muted-foreground"><Clock3 size={16} className="text-primary"/> {facility.operatingHours.open} – {facility.operatingHours.close}</span>}</div>
          </div>
          <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-sm"><p className="text-sm text-muted-foreground">Bắt đầu khám phá</p><h2 className="mt-1 text-xl font-semibold">Chọn kho phù hợp</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Xem loại kho và các phòng đang có sẵn tại cơ sở này.</p><Link to={`/storage-units?facilityId=${encodeURIComponent(facility.id)}`} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Xem phòng kho còn trống <ArrowRight size={17}/></Link></aside>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-10 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold tracking-[.18em] text-primary uppercase">Các lựa chọn lưu trữ</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Loại kho tại cơ sở</h2></div><Link to={`/storage-units?facilityId=${encodeURIComponent(facility.id)}`} className="text-sm font-semibold text-primary">Xem kho trống <ArrowRight className="inline" size={16}/></Link></div>
        {detail.unitTypeOfferings.length === 0 ? <p className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">Hiện chưa có thông tin loại kho được công bố.</p> : <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{detail.unitTypeOfferings.map((offering) => <article key={offering.id} className="rounded-3xl border border-border bg-card p-6"><div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary"><Warehouse size={20}/></div><h3 className="mt-4 text-xl font-semibold">{offering.unitType.name}</h3><p className="mt-2 text-sm text-muted-foreground">{offering.unitType.dimensions.length} × {offering.unitType.dimensions.width} × {offering.unitType.dimensions.height} m</p><div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Ruler size={16}/> {offering.unitType.area} m² · {offering.unitType.volume} m³</div><p className="mt-5 text-xl font-semibold text-primary">{currency.format(offering.pricePerUnit)} <span className="text-sm font-normal text-muted-foreground">/ {billingLabels[offering.billingUnit]}</span></p><p className="mt-2 text-xs text-muted-foreground">Thời hạn tối thiểu: {offering.minRentalDays} ngày</p><p className="mt-4 text-xs text-muted-foreground">{offering.availableUnitsCount} kho còn trống</p></article>)}</div>}
      </section>
      <section className="border-y border-border bg-card/70"><div className="mx-auto max-w-7xl px-5 py-12 sm:px-10"><p className="text-xs font-semibold tracking-[.18em] text-primary uppercase">Tiện ích & dịch vụ</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Thông tin tại cơ sở</h2>{detail.amenityOfferings.length === 0 ? <p className="mt-5 text-sm text-muted-foreground">Chưa có thông tin tiện ích được công bố tại cơ sở này.</p> : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{detail.amenityOfferings.map((item) => <article key={item.id} className="rounded-2xl border border-border bg-background p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{item.amenity.name}</h3><span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-primary">{item.amenity.type === 'physical' ? 'Tiện ích cơ sở' : 'Dịch vụ'}</span></div>{item.amenity.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.amenity.description}</p>}<p className="mt-4 text-sm font-medium">{currency.format(item.pricePerUnit)} / {billingLabels[item.billingUnit]}</p></article>)}</div>}</div></section>
    </main>
  )
}
