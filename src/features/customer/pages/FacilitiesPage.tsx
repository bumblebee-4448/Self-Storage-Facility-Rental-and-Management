import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, MapPin, Search, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { FacilityCard } from '@/features/customer/components/FacilityCard'
import { getFacilities, publicApiError } from '@/features/customer/api/customer-discovery-api'
import type { Facility, Pagination } from '@/features/customer/api/types'

const emptyPagination: Pagination = { page: 1, limit: 9, totalItems: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false }

export function FacilitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cities, setCities] = useState<string[]>([])
  const search = searchParams.get('search') ?? ''
  const city = searchParams.get('city') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
  const sortBy = (searchParams.get('sortBy') ?? 'createdAt') as 'name' | 'city' | 'createdAt'
  const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc'
  const query = useMemo(() => ({ search: search || undefined, city: city || undefined, page, limit: 9, sortBy, sortOrder }), [search, city, page, sortBy, sortOrder])

  useEffect(() => {
    let active = true
    const load = () => getFacilities(query).then((result) => {
      if (!active) return
      setError(''); setFacilities(result.items); setPagination(result.pagination)
      setCities((current) => Array.from(new Set([...current, ...result.items.map((item) => item.city)])).sort())
    }).catch((reason: unknown) => { if (active) setError(publicApiError(reason)) }).finally(() => { if (active) setLoading(false) })
    void Promise.resolve().then(load)
    return () => { active = false }
  }, [query])

  const updateQuery = (values: Record<string, string>) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key))
    if (Object.keys(values).some((key) => key !== 'page')) next.delete('page')
    setSearchParams(next)
  }

  return (
    <main>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-10 sm:py-16">
          <p className="text-xs font-semibold tracking-[.18em] text-white/70 uppercase">Haven · Mạng lưới cơ sở</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-medium tracking-tight sm:text-5xl">Tìm cơ sở phù hợp với bạn</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">Khám phá thông tin địa điểm và lựa chọn loại kho phù hợp với nhu cầu lưu trữ.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-10 sm:py-14">
        <div className="rounded-[1.5rem] border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
            <label className="flex items-center gap-3 rounded-xl border border-input bg-background px-4 py-3">
              <Search size={18} className="text-muted-foreground" />
              <span className="sr-only">Tìm theo tên hoặc địa chỉ</span>
              <input value={search} onChange={(event) => updateQuery({ search: event.target.value })} placeholder="Tên cơ sở hoặc địa chỉ" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-input bg-background px-4 py-3">
              <MapPin size={17} className="text-muted-foreground" /><span className="sr-only">Lọc theo thành phố</span>
              <select aria-label="Lọc theo thành phố" value={city} onChange={(event) => updateQuery({ city: event.target.value })} className="w-full bg-transparent text-sm outline-none">
                <option value="">Tất cả thành phố</option>{cities.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-input bg-background px-4 py-3">
              <SlidersHorizontal size={17} className="text-muted-foreground" /><span className="sr-only">Sắp xếp cơ sở</span>
              <select aria-label="Sắp xếp cơ sở" value={`${sortBy}:${sortOrder}`} onChange={(event) => { const [nextSort, nextOrder] = event.target.value.split(':'); updateQuery({ sortBy: nextSort, sortOrder: nextOrder }) }} className="w-full bg-transparent text-sm outline-none">
                <option value="createdAt:desc">Mới cập nhật</option><option value="name:asc">Tên A–Z</option><option value="name:desc">Tên Z–A</option><option value="city:asc">Thành phố A–Z</option>
              </select>
            </label>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-sm text-muted-foreground">Khám phá điểm lưu trữ</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Các cơ sở của chúng tôi</h2></div>
          {!loading && !error && <p className="text-sm text-muted-foreground">{pagination.totalItems} cơ sở</p>}
        </div>
        {loading && <div role="status" className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="animate-pulse overflow-hidden rounded-3xl border border-border bg-card"><div className="aspect-[1.65] bg-muted"/><div className="space-y-3 p-6"><div className="h-3 w-1/3 rounded bg-muted"/><div className="h-5 w-2/3 rounded bg-muted"/><div className="h-4 rounded bg-muted"/></div></div>)}</div>}
        {error && <div role="alert" className="mt-8 rounded-2xl border border-destructive/20 bg-card p-8 text-center"><h2 className="text-lg font-semibold">Chưa thể tải danh sách cơ sở</h2><p className="mt-2 text-sm text-muted-foreground">{error}</p><button className="mt-5 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground" onClick={() => { setLoading(true); setError(''); void getFacilities(query).then((result) => { setFacilities(result.items); setPagination(result.pagination) }).catch((reason: unknown) => setError(publicApiError(reason))).finally(() => setLoading(false)) }}>Thử lại</button></div>}
        {!loading && !error && facilities.length === 0 && <div className="mt-8 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center"><MapPin className="mx-auto text-muted-foreground"/><h2 className="mt-3 text-lg font-semibold">Chưa tìm thấy cơ sở phù hợp</h2><p className="mt-2 text-sm text-muted-foreground">Thử thay đổi từ khóa hoặc thành phố.</p></div>}
        {!loading && !error && facilities.length > 0 && <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{facilities.map((facility) => <FacilityCard key={facility.id} facility={facility}/>)}</div>}
        {!loading && !error && pagination.totalPages > 1 && <nav aria-label="Phân trang cơ sở" className="mt-10 flex items-center justify-center gap-4"><button disabled={!pagination.hasPrevPage} onClick={() => updateQuery({ page: String(page - 1) })} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40"><ArrowLeft size={16}/> Trang trước</button><span className="text-sm text-muted-foreground">Trang {pagination.page} / {pagination.totalPages}</span><button disabled={!pagination.hasNextPage} onClick={() => updateQuery({ page: String(page + 1) })} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40">Trang sau <ArrowRight size={16}/></button></nav>}
      </section>
    </main>
  )
}
