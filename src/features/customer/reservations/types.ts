import type { PaginatedData } from '@/features/customer/api/types'

export type ReservationStatus = 'pending_payment' | 'payment_successful' | 'confirmed' | 'completed' | 'cancelled' | 'expired' | 'overdue'
export type RefundStatus = 'none' | 'pending' | 'refunded'

export interface Reservation {
  id: string
  reservationCode: string
  customerId: string
  facilityId: string
  facilityUnitTypeOfferingId: string
  storageUnitId?: string | null
  startDate: string
  checkInDate: string
  checkInTimeSlot: string
  rentalDuration: number
  billingUnit: 'day' | 'month' | 'one_time'
  basePrice: number
  depositAmount: number
  totalAmount: number
  status: ReservationStatus
  expiresAt?: string | null
  graceExpiresAt?: string | null
  refundAmount: number
  forfeitedAmount: number
  refundStatus: RefundStatus
  paidAt?: string | null
  paidAmount?: number | null
  paymentId?: string | null
  notes?: string | null
  facility?: { id: string; name: string; city: string; address: string; phone?: string | null } | null
  storageUnit?: { id: string; unitNumber: string; floor: number; zone?: string | null; status: string } | null
  offering?: { id: string; billingUnit: string; pricePerUnit: number; depositMultiplier?: number | null; minRentalDays?: number | null } | null
  unitChangeHistory?: Array<{ fromUnitId: string; toUnitId: string; reason: string; changedAt: string; fromUnit?: { unitNumber: string } | null; toUnit?: { unitNumber: string } | null }>
  createdAt: string
  updatedAt: string
}

export type ReservationPage = PaginatedData<Reservation>

export interface ReservationDraft {
  facilityId: string
  storageUnitId: string
  facilityUnitTypeOfferingId: string
  checkInDate: string
  checkInTimeSlot: string
  rentalDuration: number
}

