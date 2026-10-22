import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { routeObjects } from '@/routes/router'
import { useAuthStore } from '@/stores/auth-store'
import type { Role } from '@/models/auth'

function renderRoute(path: string, role?: Role) {
  useAuthStore.setState({
    user: role
      ? {
          id: 'user-1',
          email: 'person@example.com',
          name: 'Test User',
          roles: [role],
          permissions: [],
        }
      : null,
    status: role ? 'authenticated' : 'guest',
    error: null,
  })
  const router = createMemoryRouter(routeObjects, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

beforeEach(() =>
  useAuthStore.setState({ user: null, status: 'guest', error: null }),
)

describe('application route layouts and access', () => {
  it('renders the landing page inside the public layout', () => {
    renderRoute('/')
    expect(
      screen.getByRole('link', { name: 'Haven trang chủ' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: /không gian lưu trữ linh hoạt cho mọi nhu cầu/i,
      }),
    ).toBeInTheDocument()
  })

  it('renders the customer account shell for a customer', async () => {
    renderRoute('/account', 'CUSTOMER')
    expect(screen.getByText('Haven Storage')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /xin chào/i }),
    ).toBeInTheDocument()
  })

  it('redirects a guest from a protected customer route to customer login', async () => {
    renderRoute('/account/profile')
    expect(
      await screen.findByRole('heading', { name: 'Chào mừng trở lại' }),
    ).toBeInTheDocument()
  })

  it('protects reservation creation behind the customer login flow', async () => {
    renderRoute('/reservations/new?facilityId=facility-1&storageUnitId=unit-1')
    expect(
      await screen.findByRole('heading', { name: 'Chào mừng trở lại' }),
    ).toBeInTheDocument()
  })

  it('shows a forbidden page for an authenticated user with the wrong role', () => {
    renderRoute('/portal/admin/users', 'BUSINESS_OPS_MANAGER')
    expect(screen.getByText(/403 · Không có quyền/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Quản trị hệ thống' }),
    ).not.toBeInTheDocument()
  })

  it.each([
    ['/portal/admin/users', 'SYSTEM_ADMIN', 'Người dùng'],
    ['/portal/ops/facilities', 'BUSINESS_OPS_MANAGER', 'Cơ sở'],
    ['/portal/manager/storage-units', 'FACILITY_MANAGER', 'Phòng kho'],
    ['/portal/staff/contracts', 'FACILITY_STAFF', 'Hợp đồng'],
  ] as const)(
    'renders the role-specific module for %s',
    (path, role, title) => {
      renderRoute(path, role)
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
      expect(screen.getAllByText('Test User').length).toBeGreaterThan(0)
    },
  )

  it('shows a loading state before protected navigation while session is checking', () => {
    useAuthStore.setState({ user: null, status: 'checking', error: null })
    const router = createMemoryRouter(routeObjects, {
      initialEntries: ['/account'],
    })
    render(<RouterProvider router={router} />)
    expect(
      screen.getByRole('status', { name: 'Đang kiểm tra phiên' }),
    ).toBeInTheDocument()
  })
})
