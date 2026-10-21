import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, CreditCard, RefreshCw, X } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getAvailableUnits, getFacilityDetail } from '@/features/customer/api/customer-discovery-api'
import { cancelReservation, createReservation, getAvailableTimeSlots, getReservation, getReservations, parseReservationStatus, reservationErrorMessage } from '../api/reservation-service'
import type { Reservation, ReservationDraft, ReservationStatus } from '../types'
import { DRAFT_KEY } from './NewReservationPage'

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
const billing = { day: 'ngày', month: 'tháng', one_time: 'một lần' }
const statuses: Record<ReservationStatus, { label: string; style: string }> = {
  pending_payment: { label: 'Chờ thanh toán cọc', style: 'bg-amber-100 text-amber-800' },
  payment_successful: { label: 'Đã thanh toán cọc', style: 'bg-blue-100 text-blue-800' },
  confirmed: { label: 'Đã xác nhận', style: 'bg-green-100 text-green-800' },
  completed: { label: 'Hoàn tất', style: 'bg-slate-100 text-slate-700' },
  cancelled: { label: 'Đã hủy', style: 'bg-red-100 text-red-800' },
  expired: { label: 'Hết hạn', style: 'bg-slate-100 text-slate-700' },
  overdue: { label: 'Quá hạn check-in', style: 'bg-orange-100 text-orange-800' },
}

function dateLabel(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' }).format(parsed)
}

function StatusBadge({ status }: { status: ReservationStatus }) {
  const item = statuses[status] ?? { label: status, style: 'bg-muted text-foreground' }
  return <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${item.style}`}>{item.label}</span>
}

export function ReservationReviewPage() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<ReservationDraft | null>(null)
  const [facilityName, setFacilityName] = useState('')
  const [unitLabel, setUnitLabel] = useState('')
  const [price, setPrice] = useState<{ base: number; deposit: number; billingUnit: 'day' | 'month' | 'one_time' } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      const parsed = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null') as ReservationDraft | null
      if (!parsed) throw new Error('draft-missing')
      if (active) setDraft(parsed)
      return Promise.all([getFacilityDetail(parsed.facilityId), getAvailableUnits(parsed.facilityId)]).then(([detail, units]) => ({ parsed, detail, units }))
    }).then(({ parsed, detail, units }) => {
        if (!active) return
        const unit = units.find((item) => item.id === parsed.storageUnitId)
        const offering = detail.unitTypeOfferings.find((item) => item.id === parsed.facilityUnitTypeOfferingId && item.status === 'active')
        if (!unit || !offering) { setError('Phòng kho hoặc giá thuê đã thay đổi. Vui lòng quay lại và chọn lại.'); return }
        setFacilityName(`${detail.facility.name} · ${detail.facility.address}, ${detail.facility.city}`)
        setUnitLabel(`${unit.unitNumber} · ${unit.unitType?.name ?? offering.unitType.name} · Tầng ${unit.floor}${unit.zone ? ` · Khu ${unit.zone}` : ''}`)
        setPrice({ base: offering.pricePerUnit, deposit: offering.pricePerUnit * offering.depositMultiplier, billingUnit: offering.billingUnit })
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error && reason.message === 'draft-missing' ? 'Không tìm thấy bản nháp đặt chỗ. Vui lòng chọn lại phòng kho.' : reservationErrorMessage(reason)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function confirm() {
    if (!draft || submitting) return
    setSubmitting(true); setError('')
    try {
      const [available, detail, slots] = await Promise.all([getAvailableUnits(draft.facilityId), getFacilityDetail(draft.facilityId), getAvailableTimeSlots(draft.facilityId, new Date(`${draft.checkInDate}T00:00:00+07:00`).toISOString())])
      const unit = available.find((item) => item.id === draft.storageUnitId)
      const offering = detail.unitTypeOfferings.find((item) => item.id === draft.facilityUnitTypeOfferingId && item.status === 'active')
      if (!unit || !offering) { setError('Phòng kho vừa hết chỗ hoặc giá thuê đã thay đổi. Chọn lại một phòng còn trống.'); return }
      if (!slots.some((slot) => slot.isAvailable && slot.slotName === draft.checkInTimeSlot)) { setError('Khung giờ vừa hết chỗ. Quay lại để chọn thời gian khác.'); return }
      const reservation = await createReservation(draft)
      sessionStorage.removeItem(DRAFT_KEY)
      navigate(`/account/reservations/${reservation.id}`, { replace: true, state: { created: true } })
    } catch (reason) { setError(reservationErrorMessage(reason)) } finally { setSubmitting(false) }
  }

  if (loading) return <main className="mx-auto max-w-3xl px-5 py-14"><p role="status" className="rounded-2xl border border-border bg-card p-7">Đang kiểm tra lại thông tin…</p></main>
  return <main className="mx-auto max-w-4xl px-5 py-10 sm:px-10"><Link to={draft ? `/reservations/new?facilityId=${draft.facilityId}&storageUnitId=${draft.storageUnitId}` : '/storage-units'} className="inline-flex items-center gap-2 text-sm font-medium text-primary"><ArrowLeft size={16}/> Chỉnh sửa lựa chọn</Link><p className="mt-7 text-xs font-semibold tracking-[.16em] text-primary uppercase">Bước cuối trước khi gửi</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Xem lại đặt chỗ</h1><p className="mt-3 text-sm text-muted-foreground">Máy chủ sẽ xác nhận lại tình trạng phòng và tính toán khoản cọc khi bạn gửi.</p><div className="mt-7 rounded-3xl border border-border bg-card p-6 sm:p-8"><dl className="grid gap-6 sm:grid-cols-2"><div><dt className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Cơ sở</dt><dd className="mt-2 font-medium">{facilityName}</dd></div><div><dt className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Phòng kho</dt><dd className="mt-2 font-medium">{unitLabel}</dd></div><div><dt className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Ngày nhận kho</dt><dd className="mt-2 flex items-center gap-2 font-medium"><CalendarDays size={17} className="text-primary"/>{draft?.checkInDate}</dd></div><div><dt className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Khung giờ</dt><dd className="mt-2 flex items-center gap-2 font-medium"><Clock3 size={17} className="text-primary"/>{draft?.checkInTimeSlot}</dd></div><div><dt className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Thời lượng</dt><dd className="mt-2 font-medium">{draft?.rentalDuration} ngày</dd></div></dl><div className="mt-7 rounded-2xl bg-secondary/70 p-5"><div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">Giá thuê niêm yết</span><span>{price ? `${currency.format(price.base)} / ${billing[price.billingUnit]}` : '—'}</span></div><div className="mt-3 flex justify-between gap-4 text-sm font-semibold"><span>Tiền cọc dự kiến</span><span>{price ? currency.format(price.deposit) : 'Được xác nhận khi gửi'}</span></div><p className="mt-3 text-xs leading-5 text-muted-foreground">Tiền cọc dự kiến theo giá thuê và hệ số cọc hiện tại. Số tiền chính thức do máy chủ trả về sau khi tạo đặt chỗ.</p></div></div>{error && <p role="alert" className="mt-5 rounded-2xl border border-destructive/20 bg-card p-4 text-sm text-destructive">{error}</p>}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link to={draft ? `/reservations/new?facilityId=${draft.facilityId}&storageUnitId=${draft.storageUnitId}` : '/storage-units'} className="rounded-full border border-border px-6 py-3 text-center text-sm font-semibold">Quay lại chỉnh sửa</Link><button onClick={() => void confirm()} disabled={!draft || submitting || Boolean(error)} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{submitting ? 'Đang gửi yêu cầu…' : 'Xác nhận đặt giữ chỗ'} <ArrowRight size={16}/></button></div></main>
}

export function MyReservationsPage() {
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState<Reservation[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const status = params.get('status') ?? ''
  const reservationCode = params.get('reservationCode') ?? ''
  const page = Number(params.get('page') ?? 1) || 1

  const load = useCallback(() => {
    setLoading(true)
    void getReservations({ page, limit: 10, status: parseReservationStatus(status || null), reservationCode: reservationCode || undefined }).then((result) => { setItems(result.items); setPagination(result.pagination); setError('') }).catch((reason: unknown) => setError(reservationErrorMessage(reason))).finally(() => setLoading(false))
  }, [page, status, reservationCode])
  useEffect(() => { void Promise.resolve().then(load) }, [load])

  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  return <section><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold tracking-[.16em] text-primary uppercase">Khách hàng</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Đặt chỗ của tôi</h1><p className="mt-2 text-sm text-muted-foreground">Theo dõi tình trạng và thông tin các lượt đặt kho.</p></div><button onClick={load} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm"><RefreshCw size={15}/> Làm mới</button></div><div className="mt-6 grid gap-3 sm:grid-cols-[1fr_240px]"><input aria-label="Tìm theo mã đặt chỗ" value={reservationCode} onChange={(event) => update('reservationCode', event.target.value)} placeholder="Tìm theo mã đặt chỗ" className="rounded-xl border border-input bg-card px-4 py-3 text-sm"/><select aria-label="Lọc theo trạng thái" value={status} onChange={(event) => update('status', event.target.value)} className="rounded-xl border border-input bg-card px-4 py-3 text-sm"><option value="">Tất cả trạng thái</option>{Object.entries(statuses).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></div>{loading && <p role="status" className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Đang tải đặt chỗ…</p>}{error && <div role="alert" className="mt-6 rounded-2xl border border-destructive/20 bg-card p-6"><p className="text-sm text-destructive">{error}</p><button onClick={load} className="mt-3 text-sm font-semibold text-primary">Thử lại</button></div>}{!loading && !error && items.length === 0 && <div className="mt-6 rounded-3xl border border-dashed border-border bg-card p-10 text-center"><h2 className="font-semibold">Chưa có đặt chỗ phù hợp</h2><p className="mt-2 text-sm text-muted-foreground">Khi bạn gửi yêu cầu đặt giữ chỗ, thông tin sẽ hiển thị ở đây.</p><Link to="/facilities" className="mt-4 inline-block text-sm font-semibold text-primary">Khám phá cơ sở</Link></div>}{!loading && !error && items.length > 0 && <div className="mt-6 space-y-4">{items.map((item) => <article key={item.id} className="rounded-3xl border border-border bg-card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">Mã đặt chỗ</p><h2 className="mt-1 font-semibold">{item.reservationCode}</h2><p className="mt-2 text-sm text-muted-foreground">{item.facility?.name ?? 'Cơ sở'} · Phòng {item.storageUnit?.unitNumber ?? '—'}</p></div><StatusBadge status={item.status}/></div><div className="mt-5 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-3"><p><span className="text-muted-foreground">Ngày tạo: </span>{dateLabel(item.createdAt)}</p><p><span className="text-muted-foreground">Nhận kho: </span>{dateLabel(item.checkInDate)} · {item.checkInTimeSlot}</p><p><span className="text-muted-foreground">Hạn giữ chỗ: </span>{item.expiresAt ? dateLabel(item.expiresAt) : '—'}</p></div><Link to={`/account/reservations/${item.id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">Chi tiết đặt chỗ <ArrowRight size={15}/></Link></article>)}</div>}{!loading && !error && pagination.totalPages > 1 && <div className="mt-6 flex items-center justify-center gap-4"><button disabled={!pagination.hasPrevPage} onClick={() => update('page', String(page - 1))} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40">Trước</button><span className="text-sm text-muted-foreground">{pagination.page} / {pagination.totalPages}</span><button disabled={!pagination.hasNextPage} onClick={() => update('page', String(page + 1))} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40">Tiếp</button></div>}</section>
}

export function ReservationDetailsPage() {
  const { reservationId = '' } = useParams()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [reason, setReason] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  const refresh = useCallback(async (background = false) => {
    if (background) setRefreshing(true); else setLoading(true)
    try { setReservation(await getReservation(reservationId)); setError('') }
    catch (cause) { setError(reservationErrorMessage(cause)) }
    finally { setLoading(false); setRefreshing(false) }
  }, [reservationId])
  useEffect(() => { void Promise.resolve().then(() => refresh()) }, [refresh])

  useEffect(() => {
    const expires = reservation?.expiresAt
    if (!expires || reservation.status !== 'pending_payment') return
    const target = new Date(expires).getTime()
    let refreshedAtDeadline = false
    const tick = () => {
      const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining === 0 && !refreshedAtDeadline) { refreshedAtDeadline = true; void refresh(true) }
    }
    void Promise.resolve().then(tick)
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [reservation?.expiresAt, reservation?.status, refresh])

  async function submitCancel(event: React.FormEvent) {
    event.preventDefault()
    if (!reservation || reason.trim().length < 3) { setCancelError('Vui lòng nhập lý do gồm ít nhất 3 ký tự.'); return }
    setCancelling(true); setCancelError('')
    try { setReservation(await cancelReservation(reservation.id, reason.trim())); setShowCancel(false); setReason('') }
    catch (cause) { setCancelError(reservationErrorMessage(cause)) }
    finally { setCancelling(false) }
  }

  const canCancel = reservation && ['pending_payment', 'payment_successful', 'confirmed'].includes(reservation.status)
  const countdown = secondsLeft === null ? '' : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`

  if (loading) return <p role="status" className="rounded-2xl border border-border bg-card p-6 text-sm">Đang tải thông tin đặt chỗ…</p>
  if (error || !reservation) return <div className="rounded-2xl border border-border bg-card p-8"><h1 className="text-xl font-semibold">Không thể tải đặt chỗ</h1><p role="alert" className="mt-2 text-sm text-muted-foreground">{error || 'Không tìm thấy đặt chỗ.'}</p><button onClick={() => void refresh()} className="mt-4 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground">Thử lại</button><Link to="/account/reservations" className="ml-4 text-sm text-primary">Về danh sách</Link></div>

  return <section><Link to="/account/reservations" className="inline-flex items-center gap-2 text-sm font-medium text-primary"><ArrowLeft size={16}/> Đặt chỗ của tôi</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold tracking-[.16em] text-primary uppercase">Mã đặt chỗ</p><h1 className="mt-2 text-3xl font-semibold">{reservation.reservationCode}</h1></div><div className="flex items-center gap-2"><StatusBadge status={reservation.status}/><button aria-label="Làm mới đặt chỗ" onClick={() => void refresh(true)} className="grid size-9 place-items-center rounded-full border border-border"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''}/></button></div></div><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]"><div className="space-y-5"><article className="rounded-3xl border border-border bg-card p-6"><h2 className="font-semibold">Thông tin đặt chỗ</h2><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Cơ sở</dt><dd className="mt-1 font-medium">{reservation.facility?.name ?? '—'}<br/><span className="font-normal text-muted-foreground">{reservation.facility?.address}{reservation.facility?.city ? `, ${reservation.facility.city}` : ''}</span></dd></div><div><dt className="text-muted-foreground">Phòng kho</dt><dd className="mt-1 font-medium">{reservation.storageUnit?.unitNumber ?? '—'}{reservation.storageUnit ? ` · Tầng ${reservation.storageUnit.floor}${reservation.storageUnit.zone ? ` · Khu ${reservation.storageUnit.zone}` : ''}` : ''}</dd></div><div><dt className="text-muted-foreground">Ngày và giờ nhận kho</dt><dd className="mt-1 font-medium">{dateLabel(reservation.checkInDate)} · {reservation.checkInTimeSlot}</dd></div><div><dt className="text-muted-foreground">Thời lượng</dt><dd className="mt-1 font-medium">{reservation.rentalDuration} {billing[reservation.billingUnit]}</dd></div><div><dt className="text-muted-foreground">Ngày tạo</dt><dd className="mt-1 font-medium">{dateLabel(reservation.createdAt)}</dd></div><div><dt className="text-muted-foreground">Hạn giữ chỗ</dt><dd className="mt-1 font-medium">{reservation.expiresAt ? new Date(reservation.expiresAt).toLocaleString('vi-VN') : '—'}</dd></div></dl>{(reservation.unitChangeHistory ?? []).length > 0 && <div className="mt-5 border-t border-border pt-4"><h3 className="text-sm font-semibold">Cập nhật phòng kho</h3>{(reservation.unitChangeHistory ?? []).map((change, index) => <p key={`${change.changedAt}-${index}`} className="mt-2 text-sm text-muted-foreground">{dateLabel(change.changedAt)} · {change.fromUnit?.unitNumber ?? '—'} → {change.toUnit?.unitNumber ?? '—'} · {change.reason}</p>)}</div>}</article><article className="rounded-3xl border border-border bg-card p-6"><h2 className="font-semibold">Tình trạng</h2><div className="mt-5 flex gap-3"><span className="mt-1 size-2.5 shrink-0 rounded-full bg-primary"/><div><p className="text-sm font-medium">{statuses[reservation.status].label}</p><p className="mt-1 text-sm text-muted-foreground">Cập nhật lần cuối {dateLabel(reservation.updatedAt)}.</p></div></div>{reservation.status === 'pending_payment' && <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900"><div className="flex items-center gap-2 font-semibold"><CreditCard size={16}/> Đang chờ thanh toán cọc</div>{countdown && <p className="mt-2">Thời gian còn lại theo hạn máy chủ: <strong>{countdown}</strong></p>}<p className="mt-2 text-xs leading-5">Hạn máy chủ: {reservation.expiresAt ? new Date(reservation.expiresAt).toLocaleString('vi-VN') : 'Chưa có hạn được cung cấp'}.</p></div>}</article></div><aside className="h-fit rounded-3xl border border-border bg-card p-6"><p className="text-xs font-semibold tracking-wider text-primary uppercase">Khoản tiền</p><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><span className="text-muted-foreground">Giá thuê niêm yết</span><span>{currency.format(reservation.basePrice)} / {billing[reservation.billingUnit]}</span></div><div className="flex justify-between gap-3 font-semibold"><span>Tiền cọc</span><span>{currency.format(reservation.depositAmount)}</span></div><div className="flex justify-between gap-3"><span className="text-muted-foreground">Tổng cần thanh toán</span><span>{currency.format(reservation.totalAmount)}</span></div>{reservation.paidAmount != null && <div className="flex justify-between gap-3"><span className="text-muted-foreground">Đã thanh toán</span><span>{currency.format(reservation.paidAmount)}</span></div>}{reservation.refundAmount > 0 && <div className="flex justify-between gap-3"><span className="text-muted-foreground">Hoàn tiền (máy chủ)</span><span>{currency.format(reservation.refundAmount)}</span></div>}</div>{reservation.status === 'pending_payment' && <div className="mt-5 rounded-2xl bg-secondary/70 p-4 text-xs leading-5">Thanh toán sẽ được triển khai ở giai đoạn tiếp theo. Trang này chưa tạo thanh toán hoặc hiển thị QR.</div>}{canCancel && <button onClick={() => setShowCancel(true)} className="mt-5 w-full rounded-full border border-destructive/30 px-5 py-3 text-sm font-semibold text-destructive hover:bg-destructive/5">Hủy đặt chỗ</button>}{!canCancel && <p className="mt-5 text-xs text-muted-foreground">Trạng thái hiện tại không hỗ trợ hủy từ tài khoản khách hàng.</p>}</aside></div>
    {showCancel && <div role="presentation" className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form role="dialog" aria-modal="true" aria-labelledby="cancel-title" onSubmit={(event) => void submitCancel(event)} className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><h2 id="cancel-title" className="text-xl font-semibold">Hủy đặt chỗ {reservation.reservationCode}?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Máy chủ sẽ xác định khả năng hủy và khoản hoàn tiền theo trạng thái và thời điểm check-in. Không thể khôi phục yêu cầu sau khi hủy.</p></div><button type="button" aria-label="Đóng" onClick={() => setShowCancel(false)} className="rounded-full p-2 hover:bg-muted"><X size={18}/></button></div><label className="mt-5 block text-sm font-medium">Lý do hủy<textarea required minLength={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-input bg-background p-3 text-sm" placeholder="Chia sẻ lý do hủy"/></label>{cancelError && <p role="alert" className="mt-3 text-sm text-destructive">{cancelError}</p>}<div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setShowCancel(false)} className="rounded-full border border-border px-5 py-3 text-sm">Quay lại</button><button disabled={cancelling || reason.trim().length < 3} className="rounded-full bg-destructive px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{cancelling ? 'Đang hủy…' : 'Xác nhận hủy'}</button></div></form></div>}
  </section>
}

