import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { ArrowRight, Clock3, MapPin, Ruler, Warehouse } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getAvailableUnits, getFacilityDetail } from '@/features/customer/api/customer-discovery-api'
import type { FacilityPublicDetail, StorageUnit } from '@/features/customer/api/types'
import { getAvailableTimeSlots, reservationErrorMessage, type AvailableTimeSlot } from '../api/reservation-service'
import { reservationDraftSchema } from '../schemas/reservation-schema'
import type { ReservationDraft } from '../types'

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
const billingLabels = { day: 'ngày', month: 'tháng', one_time: 'một lần' }
const DRAFT_KEY = 'haven-reservation-draft'

function todayInVietnam() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
}

export function NewReservationPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const facilityId = params.get('facilityId') ?? ''
  const storageUnitId = params.get('storageUnitId') ?? ''
  const [detail, setDetail] = useState<FacilityPublicDetail | null>(null)
  const [unit, setUnit] = useState<StorageUnit | null>(null)
  const [slots, setSlots] = useState<AvailableTimeSlot[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState('')
  const [slotError, setSlotError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const form = useForm<ReservationDraft>({
    resolver: zodResolver(reservationDraftSchema),
    defaultValues: {
      facilityId,
      storageUnitId,
      facilityUnitTypeOfferingId: '',
      checkInDate: '',
      checkInTimeSlot: '',
      rentalDuration: 1,
    },
  })
  const checkInDate = useWatch({ control: form.control, name: 'checkInDate' })
  const offering = useMemo(() => detail?.unitTypeOfferings.find((item) => item.unitTypeId === unit?.unitTypeId && item.status === 'active'), [detail, unit])

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      if (!facilityId || !storageUnitId) throw new Error('missing-selection')
      return Promise.all([getFacilityDetail(facilityId), getAvailableUnits(facilityId)])
    }).then(([facilityDetail, available]) => {
      if (!active) return
      const selected = available.find((item) => item.id === storageUnitId)
      setDetail(facilityDetail); setUnit(selected ?? null)
      if (!selected) setError('Phòng kho này hiện không còn khả dụng. Vui lòng quay lại danh sách để chọn phòng khác.')
      else {
        const match = facilityDetail.unitTypeOfferings.find((item) => item.unitTypeId === selected.unitTypeId && item.status === 'active')
        if (match) { form.setValue('facilityUnitTypeOfferingId', match.id); form.setValue('rentalDuration', Math.max(1, match.minRentalDays)) }
        else setError('Chưa có thông tin giá thuê đang áp dụng cho phòng kho này.')
      }
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error && reason.message === 'missing-selection' ? 'Thiếu thông tin cơ sở hoặc phòng kho. Vui lòng chọn lại phòng còn trống.' : reservationErrorMessage(reason)) }).finally(() => { if (active) setLoadingData(false) })
    return () => { active = false }
  }, [facilityId, storageUnitId, form])

  useEffect(() => {
    let active = true
    if (!facilityId || !checkInDate) return () => { active = false }
    void getAvailableTimeSlots(facilityId, new Date(`${checkInDate}T00:00:00+07:00`).toISOString()).then((result) => {
      if (!active) return
      setSlots(result); setSlotError('')
      if (!result.some((slot) => slot.isAvailable && slot.slotName === form.getValues('checkInTimeSlot'))) form.setValue('checkInTimeSlot', '')
    }).catch((reason: unknown) => { if (active) { setSlots([]); setSlotError(reservationErrorMessage(reason)) } }).finally(() => { if (active) setLoadingSlots(false) })
    return () => { active = false }
  }, [facilityId, checkInDate, form])

  async function goToReview(values: ReservationDraft) {
    setSubmitError('')
    const valid = reservationDraftSchema.safeParse(values)
    if (!valid.success) return
    try {
      const [available, latestDetail, latestSlots] = await Promise.all([getAvailableUnits(facilityId), getFacilityDetail(facilityId), getAvailableTimeSlots(facilityId, new Date(`${valid.data.checkInDate}T00:00:00+07:00`).toISOString())])
      const freshUnit = available.find((item) => item.id === storageUnitId)
      const freshOffering = latestDetail.unitTypeOfferings.find((item) => item.unitTypeId === freshUnit?.unitTypeId && item.status === 'active')
      if (!freshUnit || !freshOffering) { setSubmitError('Phòng kho không còn khả dụng hoặc không còn giá thuê. Hãy chọn phòng khác.'); return }
      if (!latestSlots.some((slot) => slot.isAvailable && slot.slotName === valid.data.checkInTimeSlot)) { setSubmitError('Khung giờ đã hết chỗ. Vui lòng quay lại và chọn khung giờ khác.'); return }
      const draft = { ...valid.data, facilityUnitTypeOfferingId: freshOffering.id }
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      navigate('/reservations/review')
    } catch (reason) { setSubmitError(reservationErrorMessage(reason)) }
  }

  if (loadingData) return <main className="mx-auto max-w-7xl px-5 py-12 sm:px-10"><p role="status" className="rounded-2xl border border-border bg-card p-7 text-sm text-muted-foreground">Đang xác minh phòng kho…</p></main>
  if (error || !detail || !unit || !offering) return <main className="mx-auto max-w-2xl px-5 py-16 text-center sm:px-10"><h1 className="text-3xl font-semibold">Không thể bắt đầu đặt chỗ</h1><p role="alert" className="mt-3 text-muted-foreground">{error || 'Không tìm thấy giá thuê cho phòng đã chọn.'}</p><Link to={facilityId ? `/storage-units?facilityId=${facilityId}` : '/storage-units'} className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Quay lại danh sách phòng</Link></main>

  return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-10 sm:py-12"><Link to={`/storage-units?facilityId=${facilityId}`} className="text-sm font-medium text-primary">← Quay lại chọn phòng</Link><div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]"><section><p className="text-xs font-semibold tracking-[.18em] text-primary uppercase">Thông tin đặt giữ chỗ</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Chọn ngày và thời lượng thuê</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Chúng tôi sẽ kiểm tra lại tình trạng phòng và giờ nhận kho trước khi gửi yêu cầu.</p>
    <div className="mt-7 rounded-3xl border border-border bg-card p-5 sm:p-7"><div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary text-primary"><MapPin size={20}/></span><div><h2 className="text-lg font-semibold">{detail.facility.name}</h2><p className="mt-1 text-sm text-muted-foreground">{detail.facility.address}, {detail.facility.city}</p>{detail.facility.phone && <a href={`tel:${detail.facility.phone}`} className="mt-2 inline-block text-sm font-medium text-primary">{detail.facility.phone}</a>}</div></div><div className="mt-5 border-t border-border pt-5"><div className="flex items-center gap-3"><Warehouse className="text-primary" size={19}/><h3 className="font-semibold">Phòng {unit.unitNumber}</h3></div><p className="mt-2 text-sm text-muted-foreground">{unit.unitType?.name} · Tầng {unit.floor}{unit.zone ? ` · Khu ${unit.zone}` : ''}</p>{unit.unitType && <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Ruler size={15}/>{unit.unitType.dimensions.length} × {unit.unitType.dimensions.width} × {unit.unitType.dimensions.height} m · {unit.unitType.area} m²</p>}</div></div>
    <form onSubmit={form.handleSubmit(goToReview)} className="mt-5 rounded-3xl border border-border bg-card p-5 sm:p-7"><h2 className="text-lg font-semibold">Lịch nhận kho</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium">Ngày nhận kho<input type="date" min={todayInVietnam()} aria-invalid={Boolean(form.formState.errors.checkInDate)} {...form.register('checkInDate', { onChange: () => { form.setValue('checkInTimeSlot', ''); setSlots([]); setLoadingSlots(true) } })} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm"/><span className="mt-1 block text-xs text-destructive">{form.formState.errors.checkInDate?.message}</span><span className="block text-xs font-normal text-muted-foreground">Ngày được kiểm tra theo giờ Việt Nam. Hệ thống sẽ xác nhận giới hạn đặt trước.</span></label><div><p className="text-sm font-medium">Thời gian nhận kho</p><div className="mt-2 grid gap-2">{!checkInDate && <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Chọn ngày trước để xem khung giờ thực tế.</p>}{checkInDate && loadingSlots && <p role="status" className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Đang tải khung giờ…</p>}{slotError && <p role="alert" className="rounded-xl bg-muted p-3 text-sm text-destructive">{slotError} <button type="button" onClick={() => { setLoadingSlots(true); void getAvailableTimeSlots(facilityId, new Date(`${checkInDate}T00:00:00+07:00`).toISOString()).then((value) => { setSlots(value); setSlotError('') }).catch((reason: unknown) => setSlotError(reservationErrorMessage(reason))).finally(() => setLoadingSlots(false)) }} className="font-semibold underline">Thử lại</button></p>}{checkInDate && !loadingSlots && !slotError && slots.length === 0 && <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Không có khung giờ được cấu hình cho ngày này.</p>}{slots.map((slot) => <label key={slot.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${slot.isAvailable ? 'border-border hover:border-primary' : 'cursor-not-allowed border-border opacity-50'}`}><input type="radio" disabled={!slot.isAvailable} value={slot.slotName} {...form.register('checkInTimeSlot')} className="accent-primary"/><Clock3 size={16} className="text-primary"/><span className="flex-1">{slot.slotName} <span className="text-muted-foreground">({slot.startTime}–{slot.endTime})</span></span><span className="text-xs text-muted-foreground">{slot.isAvailable ? `${slot.availableCapacity} chỗ` : 'Hết chỗ'}</span></label>)}<span className="text-xs text-destructive">{form.formState.errors.checkInTimeSlot?.message}</span></div></div></div><label className="mt-5 block max-w-sm text-sm font-medium">Thời lượng thuê (ngày)<input type="number" min={Math.max(1, offering.minRentalDays)} step={1} {...form.register('rentalDuration', { valueAsNumber: true })} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm"/><span className="mt-1 block text-xs text-muted-foreground">Thời hạn tối thiểu theo giá thuê này: {offering.minRentalDays} ngày.</span><span className="mt-1 block text-xs text-destructive">{form.formState.errors.rentalDuration?.message}</span></label>{submitError && <p role="alert" className="mt-5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{submitError}</p>}<button disabled={form.formState.isSubmitting} type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground disabled:opacity-50 sm:w-auto">{form.formState.isSubmitting ? 'Đang xác minh…' : 'Xem lại thông tin'} <ArrowRight size={16}/></button></form></section>
    <aside className="h-fit rounded-3xl border border-border bg-card p-6 lg:sticky lg:top-24"><p className="text-xs font-semibold tracking-[.16em] text-primary uppercase">Tóm tắt giá thuê</p><h2 className="mt-2 text-xl font-semibold">{offering.unitType.name}</h2><p className="mt-2 text-sm text-muted-foreground">{currency.format(offering.pricePerUnit)} / {billingLabels[offering.billingUnit]}</p><div className="mt-5 space-y-3 border-t border-border pt-5 text-sm"><div className="flex justify-between gap-3"><span className="text-muted-foreground">Tiền cọc dự kiến</span><strong>{currency.format(offering.pricePerUnit * offering.depositMultiplier)}</strong></div><div className="flex justify-between gap-3"><span className="text-muted-foreground">Hệ số cọc</span><span>{offering.depositMultiplier}×</span></div></div><p className="mt-5 rounded-2xl bg-secondary/70 p-4 text-xs leading-5 text-secondary-foreground">Tiền cọc và số tiền cần thanh toán sẽ được xác nhận bởi máy chủ khi tạo đặt chỗ. Chưa có khoản thanh toán nào được thực hiện.</p><p className="mt-4 text-xs text-muted-foreground">Yêu cầu giữ chỗ mặc định hết hạn sau 15 phút; thời hạn thực tế do máy chủ trả về và có thể cấu hình.</p></aside></div></main>
}

export { DRAFT_KEY }
