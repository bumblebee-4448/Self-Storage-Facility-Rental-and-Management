import { describe, expect, it } from 'vitest'
import { reservationDraftSchema } from '@/features/customer/reservations/schemas/reservation-schema'

const valid = {
  facilityId: 'facility-1',
  storageUnitId: 'unit-1',
  facilityUnitTypeOfferingId: 'offering-1',
  checkInDate: '2026-11-03',
  checkInTimeSlot: 'Morning',
  rentalDuration: 30,
}

describe('reservation draft validation', () => {
  it('accepts the required backend reservation selection', () => {
    expect(reservationDraftSchema.safeParse(valid).success).toBe(true)
  })

  it('requires a selected unit, available time slot, and positive integer duration', () => {
    expect(reservationDraftSchema.safeParse({ ...valid, storageUnitId: '' }).success).toBe(false)
    expect(reservationDraftSchema.safeParse({ ...valid, checkInTimeSlot: '' }).success).toBe(false)
    expect(reservationDraftSchema.safeParse({ ...valid, rentalDuration: 0 }).success).toBe(false)
    expect(reservationDraftSchema.safeParse({ ...valid, rentalDuration: 1.5 }).success).toBe(false)
  })

  it('rejects dates before the current Vietnam date', () => {
    expect(reservationDraftSchema.safeParse({ ...valid, checkInDate: '2020-01-01' }).success).toBe(false)
  })
})
