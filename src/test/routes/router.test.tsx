import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { routeObjects } from '@/routes/router'

function renderRoute(path: string) {
  const router = createMemoryRouter(routeObjects, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('application route layouts', () => {
  it('renders the landing page inside the public layout', () => {
    renderRoute('/')

    expect(screen.getByRole('link', { name: /haven\./i })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /chỗ cho những điều/i }),
    ).toBeInTheDocument()
  })

  it('renders customer pages inside the customer layout', () => {
    renderRoute('/account')

    expect(screen.getByText('Haven Storage')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Tài khoản khách hàng' }),
    ).toBeInTheDocument()
  })

  it('renders internal login without the portal sidebar', () => {
    renderRoute('/portal/login')

    expect(
      screen.getByRole('heading', { name: 'Đăng nhập nội bộ' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Không gian làm việc')).not.toBeInTheDocument()
  })

  it.each([
    ['/portal', 'Không gian làm việc'],
    ['/portal/admin/users', 'Quản trị hệ thống'],
    ['/portal/ops/reports', 'Vận hành doanh nghiệp'],
    ['/portal/manager/facilities', 'Quản lý cơ sở'],
    ['/portal/staff/units', 'Nhân viên cơ sở'],
  ])('renders the portal placeholder for %s', (path, title) => {
    renderRoute(path)

    expect(
      screen.getByRole('navigation').previousElementSibling,
    ).toHaveTextContent('Không gian làm việc')
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
  })
})
