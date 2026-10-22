import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import type { AuthUser } from '@/models/auth'
import { routeObjects } from '@/routes/router'
import { useAuthStore } from '@/stores/auth-store'
import { server } from '@/test/server'

const staffUser: AuthUser = {
  id: 'staff-1',
  email: 'staff@example.com',
  name: 'Facility Staff',
  roles: ['FACILITY_STAFF'],
  permissions: [],
  assignedFacilityId: null,
}

function renderPortal() {
  const router = createMemoryRouter(routeObjects, {
    initialEntries: ['/portal/staff'],
  })
  render(<RouterProvider router={router} />)
  return router
}

describe('portal session controls', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: staffUser,
      status: 'authenticated',
      error: null,
    })
  })

  it('shows the authenticated identity and signs out to the internal login', async () => {
    const user = userEvent.setup()
    let logoutCalls = 0
    server.use(
      http.post('*/auth/logout', () => {
        logoutCalls += 1
        return HttpResponse.json({
          success: true,
          statusCode: 200,
          messageCode: 'SUCCESS',
          message: 'Logged out',
          data: null,
        })
      }),
    )
    const router = renderPortal()

    expect(screen.getByText('Facility Staff')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/portal/login'),
    )
    expect(logoutCalls).toBe(1)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('disables repeated logout while the request is pending', async () => {
    const user = userEvent.setup()
    let finishLogout!: () => void
    server.use(
      http.post('*/auth/logout', async () => {
        await new Promise<void>((resolve) => {
          finishLogout = resolve
        })
        return HttpResponse.json({
          success: true,
          statusCode: 200,
          messageCode: 'SUCCESS',
          message: 'Logged out',
          data: null,
        })
      }),
    )
    renderPortal()

    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))
    const pendingButton = await screen.findByRole('button', {
      name: 'Đang đăng xuất…',
    })
    expect(pendingButton).toBeDisabled()
    finishLogout()
    await waitFor(() => expect(useAuthStore.getState().user).toBeNull())
  })

  it('keeps the session and explains a logout network failure', async () => {
    const user = userEvent.setup()
    server.use(http.post('*/auth/logout', () => HttpResponse.error()))
    renderPortal()

    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))

    expect(
      await screen.findByText(
        'Không thể kết nối để đăng xuất. Phiên hiện tại vẫn được giữ.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Facility Staff')).toBeInTheDocument()
    expect(useAuthStore.getState().user).toEqual(staffUser)
  })

  it('keeps the session and explains a server logout failure', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('*/auth/logout', () =>
        HttpResponse.json({ success: false }, { status: 503 }),
      ),
    )
    renderPortal()

    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))

    expect(
      await screen.findByText(
        'Máy chủ chưa thể hoàn tất đăng xuất. Phiên hiện tại vẫn được giữ.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Facility Staff')).toBeInTheDocument()
    expect(useAuthStore.getState().user).toEqual(staffUser)
  })

  it('keeps the existing login entry when there is no authenticated user', () => {
    useAuthStore.setState({ user: null, status: 'guest', error: null })
    renderPortal()
    expect(screen.getByRole('link', { name: /đăng nhập/i })).toHaveAttribute(
      'href',
      '/portal/login',
    )
  })
})
