import { z } from 'zod'
import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { Reservation, ReservationDraft, ReservationPage, ReservationStatus } from '../types'

function unwrap<T>(value: unknown): T {
  const parsed = z.object({ success: z.literal(true), data: z.unknown() }).safeParse(value)
  if (!parsed.success) throw new Error('Phản hồi đặt chỗ từ máy chủ không hợp lệ.')
  return parsed.data.data as T
}

export async function createReservation(draft: ReservationDraft): Promise<Reservation> {
  const response = await apiClient.post<ApiResponse<Reservation>>('/reservations', {
    facilityId: draft.facilityId,
    storageUnitId: draft.storageUnitId,
    facilityUnitTypeOfferingId: draft.facilityUnitTypeOfferingId,
    checkInDate: new Date(`${draft.checkInDate}T00:00:00+07:00`).toISOString(),
    checkInTimeSlot: draft.checkInTimeSlot,
    rentalDuration: draft.rentalDuration,
  })
  return unwrap<Reservation>(response.data)
}

export interface ReservationListQuery {
  page?: number
  limit?: number
  status?: ReservationStatus
  reservationCode?: string
}

// ReservationStatusEnum uses uppercase member names but lowercase wire values.
export const reservationStatusApiValues = [
  'pending_payment',
  'payment_successful',
  'confirmed',
  'completed',
  'cancelled',
  'expired',
  'overdue',
] as const satisfies readonly ReservationStatus[]

export function parseReservationStatus(value: string | null): ReservationStatus | undefined {
  return reservationStatusApiValues.find((status) => status === value)
}

export async function getReservations(query: ReservationListQuery = {}): Promise<ReservationPage> {
  const response = await apiClient.get<ApiResponse<ReservationPage>>('/reservations', {
    params: query,
    authRefreshEligible: true,
  })
  return unwrap<ReservationPage>(response.data)
}

export async function getReservation(id: string): Promise<Reservation> {
  const response = await apiClient.get<ApiResponse<Reservation>>(`/reservations/${encodeURIComponent(id)}`, { authRefreshEligible: true })
  return unwrap<Reservation>(response.data)
}

export async function cancelReservation(id: string, cancellationReason: string): Promise<Reservation> {
  const response = await apiClient.post<ApiResponse<Reservation>>(
    `/reservations/${encodeURIComponent(id)}/cancel`,
    { cancellationReason },
  )
  return unwrap<Reservation>(response.data)
}

export async function getAvailableTimeSlots(facilityId: string, date: string): Promise<AvailableTimeSlot[]> {
  const response = await apiClient.get<ApiResponse<AvailableTimeSlot[]>>(
    `/facility-time-slots/facility/${encodeURIComponent(facilityId)}/available`,
    { params: { date } },
  )
  return unwrap<AvailableTimeSlot[]>(response.data)
}

export interface AvailableTimeSlot {
  id: string
  facilityId: string
  slotName: string
  startTime: string
  endTime: string
  maxCapacity: number
  bookedCount: number
  availableCapacity: number
  isAvailable: boolean
}

export function reservationErrorMessage(error: unknown): string {
  const status = typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { status?: number; data?: { message?: string } } }).response
    : undefined
  if (status?.status === 400) return status.data?.message || 'Thông tin chưa hợp lệ hoặc lựa chọn đã thay đổi. Vui lòng kiểm tra và thử lại.'
  if (status?.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status?.status === 403) return 'Bạn không được phép xem hoặc thay đổi đặt chỗ này.'
  if (status?.status === 404) return 'Không tìm thấy thông tin đặt chỗ hoặc cơ sở.'
  if (status?.status && status.status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
  if (typeof error === 'object' && error !== null && 'code' in error && ['ECONNABORTED', 'ETIMEDOUT'].includes(String((error as { code?: string }).code))) return 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.'
  return 'Không thể kết nối máy chủ. Kiểm tra kết nối rồi thử lại.'
}

