import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { routeObjects } from '@/routes/router'
import { useAuthStore } from '@/stores/auth-store'
import type { Role } from '@/models/auth'
import type { NormalizedApiError } from '@/api/errors'

function renderPath(
  path: string,
  roles: Role[] = [],
  status: 'guest' | 'checking' | 'error' | 'authenticated' = roles.length
    ? 'authenticated'
    : 'guest',
  error: NormalizedApiError | null = null,
) {
  useAuthStore.setState({
    user: roles.length
      ? {
          id: 'employee-1',
          email: 'employee@example.com',
          name: 'Team Member',
          roles,
          permissions: [],
        }
      : null,
    status,
    error,
  })
  const router = createMemoryRouter(routeObjects, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() =>
  useAuthStore.setState({ user: null, status: 'guest', error: null }),
)

describe('internal portal routes and role access', () => {
  it('redirects an unauthenticated portal request to the internal login without showing private content', async () => {
    const router = renderPath('/portal/staff/contracts')
    expect(
      await screen.findByRole('heading', { name: 'Chào mừng trở lại' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/portal/login')
    expect(
      screen.queryByRole('heading', { name: 'Hợp đồng' }),
    ).not.toBeInTheDocument()
  })

  it('keeps protected content hidden while the session is being checked', () => {
    renderPath('/portal/manager/reservations', [], 'checking')
    expect(
      screen.getByRole('status', { name: 'Đang kiểm tra phiên' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Đặt chỗ' }),
    ).not.toBeInTheDocument()
  })

  it('shows a retry explanation for a session network failure without redirecting', () => {
    renderPath('/portal/manager/reservations', [], 'error', {
      kind: 'network',
      message: 'Network error',
    })
    expect(
      screen.getByRole('heading', { name: 'Chưa thể kiểm tra phiên' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Đặt chỗ' }),
    ).not.toBeInTheDocument()
  })

  it.each([
    ['/portal/admin/users', 'SYSTEM_ADMIN', 'Người dùng'],
    ['/portal/admin/audit-logs', 'SYSTEM_ADMIN', 'Nhật ký hệ thống'],
    ['/portal/ops/facilities', 'BUSINESS_OPS_MANAGER', 'Cơ sở'],
    ['/portal/ops/unit-types', 'BUSINESS_OPS_MANAGER', 'Loại kho'],
    ['/portal/ops/amenities', 'BUSINESS_OPS_MANAGER', 'Tiện ích'],
    ['/portal/ops/offerings', 'BUSINESS_OPS_MANAGER', 'Gói dịch vụ'],
    [
      '/portal/ops/facility-amenities',
      'BUSINESS_OPS_MANAGER',
      'Tiện ích cơ sở',
    ],
    ['/portal/ops/approvals', 'BUSINESS_OPS_MANAGER', 'Duyệt yêu cầu'],
    ['/portal/manager/storage-units', 'FACILITY_MANAGER', 'Phòng kho'],
    ['/portal/manager/reservations', 'FACILITY_MANAGER', 'Đặt chỗ'],
    [
      '/portal/manager/contracts/contract-1',
      'FACILITY_MANAGER',
      'Chi tiết hợp đồng',
    ],
    ['/portal/manager/requests', 'FACILITY_MANAGER', 'Yêu cầu'],
    ['/portal/staff/contracts', 'FACILITY_STAFF', 'Hợp đồng'],
    [
      '/portal/staff/contracts/contract-1',
      'FACILITY_STAFF',
      'Chi tiết hợp đồng',
    ],
    ['/portal/staff/storage-units', 'FACILITY_STAFF', 'Phòng kho'],
  ] as const)(
    'renders the authorized placeholder for %s',
    (path, role, title) => {
      renderPath(path, [role])
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
      expect(
        screen.getByText(
          /chưa có dữ liệu nghiệp vụ nào được tải hoặc giả lập/i,
        ),
      ).toBeInTheDocument()
    },
  )

  it('denies a role that does not own the requested area', () => {
    renderPath('/portal/admin/users', ['FACILITY_STAFF'])
    expect(screen.getByText(/403 · Không có quyền/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Người dùng' }),
    ).not.toBeInTheDocument()
  })

  it.each([
    ['/portal/admin', 'SYSTEM_ADMIN', '/portal/admin/users'],
    ['/portal/ops', 'BUSINESS_OPS_MANAGER', '/portal/ops/facilities'],
    ['/portal/manager', 'FACILITY_MANAGER', '/portal/manager/storage-units'],
    ['/portal/staff', 'FACILITY_STAFF', '/portal/staff/contracts'],
  ] as const)(
    'redirects %s to its centralized default without a loop',
    async (path, role, destination) => {
      const router = renderPath(path, [role])
      await waitFor(() =>
        expect(router.state.location.pathname).toBe(destination),
      )
      expect(screen.getByText('Đang chuẩn bị tích hợp')).toBeInTheDocument()
    },
  )

  it('offers a workspace choice when multiple normalized roles are present', () => {
    renderPath('/portal', ['SYSTEM_ADMIN', 'BUSINESS_OPS_MANAGER'])
    expect(
      screen.getByRole('heading', { name: 'Chọn khu vực làm việc' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Quản trị hệ thống' }),
    ).toHaveAttribute('href', '/portal/admin/users')
    expect(
      screen.getByRole('link', { name: 'Vận hành doanh nghiệp' }),
    ).toHaveAttribute('href', '/portal/ops/facilities')
  })

  it('shows only role-authorized navigation and updates the active route', async () => {
    const user = userEvent.setup()
    renderPath('/portal/manager/storage-units', ['FACILITY_MANAGER'])
    expect(screen.getByRole('link', { name: 'Phòng kho' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Đặt chỗ' })).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Người dùng' }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Đặt chỗ' }))
    expect(
      await screen.findByRole('heading', { name: 'Đặt chỗ' }),
    ).toBeInTheDocument()
  })

  it.each(['FACILITY_MANAGER', 'FACILITY_STAFF'] as const)(
    'does not expose Admin or Operations navigation to %s',
    (role) => {
      renderPath('/portal', [role])
      expect(
        screen.queryByRole('link', { name: 'Người dùng' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('link', { name: 'Tiện ích' }),
      ).not.toBeInTheDocument()
    },
  )

  it('opens and closes the accessible mobile navigation', async () => {
    const user = userEvent.setup()
    renderPath('/portal/staff/contracts', ['FACILITY_STAFF'])
    const menu = screen.getByRole('button', { name: 'Mở điều hướng' })
    expect(menu).toHaveAttribute('aria-expanded', 'false')
    await user.click(menu)
    expect(
      screen.getByRole('button', { name: 'Đóng điều hướng' }),
    ).toHaveAttribute('aria-expanded', 'true')
    await user.click(screen.getByRole('button', { name: 'Đóng điều hướng' }))
    expect(
      screen.getByRole('button', { name: 'Mở điều hướng' }),
    ).toHaveAttribute('aria-expanded', 'false')
  })
})
