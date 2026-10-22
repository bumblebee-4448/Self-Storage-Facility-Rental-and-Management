import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, MapPin, Ruler, Warehouse } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { getAvailableUnits, getFacilities, getFacilityOfferings, publicApiError } from '@/features/customer/api/customer-discovery-api'
import type { Facility, StorageUnit, UnitTypeOffering } from '@/features/customer/api/types'

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
const billingLabels = { day: 'ngày', month: 'tháng', one_time: 'một lần' }

export function StorageDiscoveryPage() {
  const [params, setParams] = useSearchParams()
  const facilityId = params.get('facilityId') ?? ''
  const unitTypeId = params.get('unitTypeId') ?? ''
  const floor = params.get('floor') ?? ''
  const zone = params.get('zone') ?? ''
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [offerings, setOfferings] = useState<UnitTypeOffering[]>([])
  const [units, setUnits] = useState<StorageUnit[]>([])
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [loadingFacilities, setLoadingFacilities] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const selectedUnit = units.find((unit) => unit.id === selectedUnitId)
  const offeringByType = useMemo(() => new Map(offerings.map((offering) => [offering.unitTypeId, offering])), [offerings])

  useEffect(() => {
    let active = true
    getFacilities({ limit: 100, page: 1, sortBy: 'name', sortOrder: 'asc' }).then((result) => { if (active) setFacilities(result.items) }).catch((reason: unknown) => { if (active) setError(publicApiError(reason)) }).finally(() => { if (active) setLoadingFacilities(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    if (!facilityId) return () => { active = false }
    void Promise.resolve().then(() => Promise.all([getFacilityOfferings(facilityId), getAvailableUnits(facilityId, { unitTypeId: unitTypeId || undefined, floor: floor ? Number(floor) : undefined, zone: zone || undefined })])).then(([offeringResult, available]) => {
      if (!active) return
      const activeOfferings = offeringResult.items.filter((item) => item.status === 'active')
      const offeringTypes = new Set(activeOfferings.map((item) => item.unitTypeId))
      setOfferings(activeOfferings)
      setUnits(available.filter((unit) => offeringTypes.has(unit.unitTypeId)))
    }).catch((reason: unknown) => { if (active) setError(publicApiError(reason)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [facilityId, unitTypeId, floor, zone])

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key === 'facilityId') { next.delete('unitTypeId'); next.delete('floor'); next.delete('zone') }
    setParams(next)
  }

  const floors = Array.from(new Set(units.map((unit) => unit.floor))).sort((a, b) => a - b)
  const zones = Array.from(new Set(units.map((unit) => unit.zone).filter((value): value is string => Boolean(value)))).sort()
  const currentFacility = facilities.find((facility) => facility.id === facilityId)

  return (
    <main>
      <section className="bg-primary text-primary-foreground"><div className="mx-auto max-w-7xl px-5 py-12 sm:px-10 sm:py-16"><p className="text-xs font-semibold tracking-[.18em] text-white/70 uppercase">Không gian của riêng bạn</p><h1 className="mt-3 max-w-3xl text-4xl font-medium tracking-tight sm:text-5xl">Tìm phòng kho phù hợp</h1><p className="mt-4 max-w-2xl text-base leading-7 text-white/75">Chọn cơ sở, xem loại kho và lựa chọn phòng còn trống theo thông tin hiện có.</p></div></section>
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-10 sm:py-14">
        <div className="grid gap-3 rounded-3xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
          <label className="text-xs font-semibold text-muted-foreground">Cơ sở<select aria-label="Chọn cơ sở" disabled={loadingFacilities} value={facilityId} onChange={(event) => updateParam('facilityId', event.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm font-normal text-foreground"><option value="">Chọn cơ sở lưu trữ</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name} · {facility.city}</option>)}</select></label>
          <label className="text-xs font-semibold text-muted-foreground">Loại kho<select aria-label="Lọc theo loại kho" disabled={!facilityId} value={unitTypeId} onChange={(event) => updateParam('unitTypeId', event.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm font-normal text-foreground"><option value="">Tất cả loại kho</option>{offerings.map((item) => <option key={item.unitTypeId} value={item.unitTypeId}>{item.unitType.name}</option>)}</select></label>
          <label className="text-xs font-semibold text-muted-foreground">Tầng<select aria-label="Lọc theo tầng" disabled={!facilityId} value={floor} onChange={(event) => updateParam('floor', event.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm font-normal text-foreground"><option value="">Tất cả tầng</option>{floors.map((value) => <option key={value} value={value}>Tầng {value}</option>)}</select></label>
          <label className="text-xs font-semibold text-muted-foreground">Khu vực<select aria-label="Lọc theo khu vực" disabled={!facilityId} value={zone} onChange={(event) => updateParam('zone', event.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm font-normal text-foreground"><option value="">Tất cả khu vực</option>{zones.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        </div>
        {currentFacility && <div className="mt-7 flex flex-wrap items-center justify-between gap-3"><div><p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin size={15} className="text-primary"/>{currentFacility.address}, {currentFacility.city}</p><h2 className="mt-1 text-2xl font-semibold">{currentFacility.name}</h2></div><Link to={`/facilities/${currentFacility.id}`} className="text-sm font-semibold text-primary">Thông tin cơ sở <ArrowRight className="inline" size={15}/></Link></div>}
        {!facilityId && !loadingFacilities && <div className="mt-8 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center"><Warehouse className="mx-auto text-primary" size={30}/><h2 className="mt-4 text-xl font-semibold">Bắt đầu bằng cách chọn cơ sở</h2><p className="mt-2 text-sm text-muted-foreground">Danh sách phòng kho còn trống sẽ hiển thị sau khi bạn chọn địa điểm.</p></div>}
        {loading && <div role="status" className="mt-8 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">Đang tìm phòng kho còn trống…</div>}
        {error && <div role="alert" className="mt-8 rounded-2xl border border-destructive/20 bg-card p-8 text-center"><h2 className="font-semibold">Chưa thể tải phòng kho</h2><p className="mt-2 text-sm text-muted-foreground">{error}</p><button onClick={() => updateParam('facilityId', facilityId)} className="mt-4 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground">Thử lại</button></div>}
        {!loading && !error && facilityId && units.length === 0 && <div className="mt-8 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center"><Warehouse className="mx-auto text-muted-foreground" size={30}/><h2 className="mt-4 text-xl font-semibold">Chưa có phòng kho phù hợp</h2><p className="mt-2 text-sm text-muted-foreground">Thử thay đổi bộ lọc hoặc xem cơ sở khác.</p></div>}
        {!loading && !error && units.length > 0 && <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{units.map((unit) => {
          const offering = offeringByType.get(unit.unitTypeId)
          const selected = unit.id === selectedUnitId
          return <button type="button" aria-pressed={selected} onClick={() => setSelectedUnitId(unit.id)} key={unit.id} className={`group rounded-3xl border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-primary ${selected ? 'border-primary ring-2 ring-primary/15' : 'border-border'}`}><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-secondary text-primary"><Warehouse size={20}/></span><span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-primary"><span className="size-1.5 rounded-full bg-primary"/> Còn trống</span></div><div className="mt-5 flex items-center justify-between gap-3"><div><p className="text-xs text-muted-foreground">Phòng kho</p><h3 className="mt-1 text-2xl font-semibold">{unit.unitNumber}</h3></div>{selected && <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Check size={17}/></span>}</div><p className="mt-3 text-sm font-medium text-foreground">{unit.unitType?.name ?? offering?.unitType.name ?? 'Loại kho'}</p>{unit.unitType && <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Ruler size={15}/>{unit.unitType.dimensions.length} × {unit.unitType.dimensions.width} × {unit.unitType.dimensions.height} m · {unit.unitType.area} m²</p>}<p className="mt-2 text-xs text-muted-foreground">Tầng {unit.floor}{unit.zone ? ` · Khu ${unit.zone}` : ''}</p>{offering && <p className="mt-4 border-t border-border pt-4 text-base font-semibold text-primary">{currency.format(offering.pricePerUnit)} <span className="text-xs font-normal text-muted-foreground">/ {billingLabels[offering.billingUnit]}</span></p>}</button>
        })}</div>}
        {selectedUnit && <aside aria-live="polite" className="fixed right-4 bottom-4 left-4 z-30 mx-auto max-w-3xl rounded-3xl border border-primary/20 bg-card p-5 shadow-[0_20px_80px_-30px_rgba(20,50,31,.5)] sm:right-8 sm:bottom-8 sm:left-auto sm:w-[min(100%-4rem,38rem)]"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold tracking-wider text-primary uppercase">Đã chọn phòng kho</p><h2 className="mt-1 text-lg font-semibold">{selectedUnit.unitNumber} · {selectedUnit.unitType?.name ?? offeringByType.get(selectedUnit.unitTypeId)?.unitType.name}</h2><p className="mt-1 text-sm text-muted-foreground">{offeringByType.get(selectedUnit.unitTypeId) ? `${currency.format(offeringByType.get(selectedUnit.unitTypeId)!.pricePerUnit)} / ${billingLabels[offeringByType.get(selectedUnit.unitTypeId)!.billingUnit]}` : 'Chưa có thông tin giá công bố'}</p></div><Link to={`/reservations/new?facilityId=${encodeURIComponent(selectedUnit.facilityId)}&storageUnitId=${encodeURIComponent(selectedUnit.id)}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Tiếp tục đặt kho <ArrowRight size={16}/></Link></div></aside>}
      </section>
    </main>
  )
}
