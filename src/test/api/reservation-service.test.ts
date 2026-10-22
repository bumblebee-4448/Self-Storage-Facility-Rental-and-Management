import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/server'
import {
  cancelReservation,
  createReservation,
  getAvailableTimeSlots,
  getReservations,
  parseReservationStatus,
  reservationErrorMessage,
} from '@/features/customer/reservations/api/reservation-service'

const envelope = (data: unknown) => ({
  success: true,
  statusCode: 200,
  messageCode: 'OK',
  message: 'ok',
  data,
})

const reservation = {
  id: 'reservation-1',
  reservationCode: 'RSV-001',
  status: 'pending_payment',
}

describe('reservation API service', () => {
  it('sends only the backend-supported create fields and uses the shared client', async () => {
    let body: unknown
    server.use(
      http.post('*/reservations', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(envelope(reservation), { status: 201 })
      }),
    )
    await createReservation({
      facilityId: 'facility-1',
      storageUnitId: 'unit-1',
      facilityUnitTypeOfferingId: 'offering-1',
      checkInDate: '2026-11-03',
      checkInTimeSlot: 'Morning',
      rentalDuration: 30,
    })
    expect(body).toEqual({
      facilityId: 'facility-1',
      storageUnitId: 'unit-1',
      facilityUnitTypeOfferingId: 'offering-1',
      checkInDate: '2026-11-02T17:00:00.000Z',
      checkInTimeSlot: 'Morning',
      rentalDuration: 30,
    })
  })

  it('lists reservations with backend wire status and reservationCode filters', async () => {
    let requestedUrl = ''
    server.use(
      http.get('*/reservations', ({ request }) => {
        requestedUrl = request.url
        return HttpResponse.json(envelope({
          items: [reservation],
          pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
        }))
      }),
    )
    await expect(getReservations({ page: 1, status: 'pending_payment', reservationCode: 'RSV-001' })).resolves.toMatchObject({
      items: [{ id: 'reservation-1' }],
      pagination: { totalItems: 1 },
    })
    const query = new URL(requestedUrl).searchParams
    expect(query.get('status')).toBe('pending_payment')
    expect(query.get('reservationCode')).toBe('RSV-001')
    expect(query.has('search')).toBe(false)
    expect(query.has('customerId')).toBe(false)
  })

  it('keeps the exact backend enum wire values while preserving FE status labels', () => {
    expect(parseReservationStatus('pending_payment')).toBe('pending_payment')
    expect(parseReservationStatus('PENDING_PAYMENT')).toBeUndefined()
    expect(parseReservationStatus('unknown')).toBeUndefined()
  })

  it('queries date-specific time slots using the supported date parameter', async () => {
    let requestedUrl = ''
    server.use(
      http.get('*/facility-time-slots/facility/facility-1/available', ({ request }) => {
        requestedUrl = request.url
        return HttpResponse.json(envelope([]))
      }),
    )
    await expect(getAvailableTimeSlots('facility-1', '2026-11-03T00:00:00.000Z')).resolves.toEqual([])
    expect(new URL(requestedUrl).searchParams.get('date')).toBe('2026-11-03T00:00:00.000Z')
  })

  it('cancels with the required reason and returns the server result', async () => {
    let body: unknown
    server.use(
      http.post('*/reservations/reservation-1/cancel', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(envelope({ ...reservation, status: 'cancelled' }))
      }),
    )
    await expect(cancelReservation('reservation-1', 'Không còn nhu cầu')).resolves.toMatchObject({ status: 'cancelled' })
    expect(body).toEqual({ cancellationReason: 'Không còn nhu cầu' })
  })

  it('maps common reservation API failures to user-facing messages', () => {
    expect(reservationErrorMessage({ response: { status: 400, data: { message: 'Bad request' } } })).toBe('Bad request')
    expect(reservationErrorMessage({ response: { status: 401 } })).toContain('Phiên đăng nhập')
    expect(reservationErrorMessage({ response: { status: 403 } })).toContain('không được phép')
    expect(reservationErrorMessage({ response: { status: 404 } })).toContain('Không tìm thấy')
    expect(reservationErrorMessage({ response: { status: 503 } })).toContain('Máy chủ')
    expect(reservationErrorMessage({ code: 'ETIMEDOUT' })).toContain('quá thời gian')
    expect(reservationErrorMessage(new Error('offline'))).toContain('Không thể kết nối')
  })
})
