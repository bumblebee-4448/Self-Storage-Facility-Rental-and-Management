import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, delay } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { server } from '@/test/server'
import { DRAFT_KEY } from '@/features/customer/reservations/pages/NewReservationPage'
import { MyReservationsPage, ReservationDetailsPage, ReservationReviewPage } from '@/features/customer/reservations/pages/ReservationPages'

const envelope = (data: unknown) => ({ success: true, statusCode: 200, messageCode: 'OK', message: 'ok', data })
const pagination = { page: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false }
const reservation = (overrides: Record<string, unknown> = {}) => ({
  id: 'reservation-1', reservationCode: 'RSV-001', customerId: 'customer-1', facilityId: 'facility-1',
  facilityUnitTypeOfferingId: 'offering-1', storageUnitId: 'unit-1', startDate: '2026-11-03T00:00:00.000Z',
  checkInDate: '2026-11-03T00:00:00.000Z', checkInTimeSlot: 'Morning', rentalDuration: 30, billingUnit: 'month',
  basePrice: 100000, depositAmount: 100000, totalAmount: 100000, status: 'pending_payment', expiresAt: null,
  refundAmount: 0, forfeitedAmount: 0, refundStatus: 'none', createdAt: '2026-10-21T10:00:00.000Z',
  updatedAt: '2026-10-21T10:00:00.000Z', facility: { id: 'facility-1', name: 'Haven', city: 'Hà Nội', address: '1 Main St' },
  storageUnit: { id: 'unit-1', unitNumber: 'A-01', floor: 1, status: 'available' }, ...overrides,
})

function renderAt(path: string, element: React.ReactNode) {
  const routePath = path.startsWith('/account/reservations/')
    ? '/account/reservations/:reservationId'
    : path.startsWith('/account/reservations')
      ? '/account/reservations'
      : '*'
  const router = createMemoryRouter([{ path: routePath, element }], { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

afterEach(() => vi.useRealTimers())

describe('customer reservation pages', () => {
  it('sends status and reservation-code filters together and renders the response', async () => {
    let requestedUrl = ''
    server.use(http.get('*/reservations', ({ request }) => {
      requestedUrl = request.url
      return HttpResponse.json(envelope({ items: [reservation()], pagination }))
    }))
    renderAt('/account/reservations?status=pending_payment&reservationCode=RSV-001', <MyReservationsPage />)
    expect(await screen.findByText('RSV-001')).toBeInTheDocument()
    expect(within(screen.getByRole('article')).getByText('Chờ thanh toán cọc')).toBeInTheDocument()
    await waitFor(() => expect(new URL(requestedUrl).searchParams.get('status')).toBe('pending_payment'))
    expect(new URL(requestedUrl).searchParams.get('reservationCode')).toBe('RSV-001')
  })

  it('changes reservation status after a successful cancellation', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('*/reservations/reservation-1', () => HttpResponse.json(envelope(reservation()))),
      http.post('*/reservations/reservation-1/cancel', () => HttpResponse.json(envelope(reservation({ status: 'cancelled' })))),
    )
    renderAt('/account/reservations/reservation-1', <ReservationDetailsPage />)
    await user.click(await screen.findByRole('button', { name: 'Hủy đặt chỗ' }))
    await user.type(screen.getByLabelText('Lý do hủy'), 'Thay đổi kế hoạch')
    await user.click(screen.getByRole('button', { name: 'Xác nhận hủy' }))
    expect(await screen.findAllByText('Đã hủy')).toHaveLength(2)
  })

  it('shows the countdown and refreshes reservation state once expiration is reached', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    const now = Date.now()
    const expiresAt = now + 4_000
    let detailCalls = 0
    server.use(http.get('*/reservations/reservation-1', () => {
      detailCalls += 1
      return HttpResponse.json(envelope(reservation({
        status: detailCalls > 1 ? 'expired' : 'pending_payment',
        expiresAt: new Date(expiresAt).toISOString(),
      })))
    }))
    renderAt('/account/reservations/reservation-1', <ReservationDetailsPage />)
    await screen.findByRole('heading', { name: 'RSV-001' })
    expect(await screen.findByText(/0:0[1-4]/)).toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(4000) })
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)) })
    expect(screen.getAllByText('Hết hạn')).toHaveLength(2)
    expect(detailCalls).toBe(2)
  })

  it('prevents a second reservation POST while the first submission is pending', async () => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      facilityId: 'facility-1', storageUnitId: 'unit-1', facilityUnitTypeOfferingId: 'offering-1',
      checkInDate: '2026-11-03', checkInTimeSlot: 'Morning', rentalDuration: 30,
    }))
    let createCalls = 0
    const unitType = { id: 'type-1', name: 'Small', dimensions: { length: 1, width: 1, height: 1 }, area: 1, volume: 1, status: 'active' }
    server.use(
      http.get('*/facilities/facility-1/public-detail', () => HttpResponse.json(envelope({
        facility: { id: 'facility-1', name: 'Haven', address: '1 Main St', city: 'Hà Nội', status: 'active', images: [] },
        unitTypeOfferings: [{ id: 'offering-1', facilityId: 'facility-1', unitTypeId: 'type-1', unitType, pricePerUnit: 100000, depositMultiplier: 1, billingUnit: 'month', minRentalDays: 1, status: 'active', availableUnitsCount: 1 }],
        amenityOfferings: [],
      }))),
      http.get('*/storage-units/facility/facility-1/available', () => HttpResponse.json(envelope([{ id: 'unit-1', facilityId: 'facility-1', unitTypeId: 'type-1', unitNumber: 'A-01', floor: 1, status: 'available', images: [], unitType }]))),
      http.get('*/facility-time-slots/facility/facility-1/available', () => HttpResponse.json(envelope([{ id: 'slot-1', facilityId: 'facility-1', slotName: 'Morning', startTime: '09:00', endTime: '12:00', maxCapacity: 2, bookedCount: 0, availableCapacity: 2, isAvailable: true }]))),
      http.post('*/reservations', async () => {
        createCalls += 1
        await delay(100)
        return HttpResponse.json(envelope(reservation()), { status: 201 })
      }),
    )
    renderAt('/reservations/review', <ReservationReviewPage />)
    const confirm = await screen.findByRole('button', { name: /確認.*予約|Xác nhận đặt giữ chỗ/i })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    await waitFor(() => expect(createCalls).toBe(1))
    sessionStorage.removeItem(DRAFT_KEY)
  })
})
