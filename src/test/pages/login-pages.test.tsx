import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { routeObjects } from '@/routes/router'
import { server } from '@/test/server'
import { useAuthStore } from '@/stores/auth-store'
import type { AuthUser } from '@/models/auth'

function loginEnvelope(role: string, id = 'user-1') {
  return {
    success: true,
    statusCode: 200,
    messageCode: 'SUCCESS',
    message: 'Login successful',
    data: {
      user: { id, email: 'person@example.com', role },
      tokens: { accessToken: 'access-value', refreshToken: 'refresh-value' },
    },
  }
}

function resetAuthStore() {
  useAuthStore.setState({ user: null, status: 'guest', error: null })
}

function renderRoute(path: string) {
  const router = createMemoryRouter(routeObjects, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

async function fillCredentials(
  user: ReturnType<typeof userEvent.setup>,
  password = 'secure-password',
) {
  await user.type(screen.getByLabelText('Email'), 'person@example.com')
  await user.type(screen.getByLabelText('Mật khẩu'), password)
}

describe('customer and internal login pages', () => {
  beforeEach(resetAuthStore)

  it('renders the customer login page with its public account links', () => {
    renderRoute('/auth/login')

    expect(
      screen.getByRole('heading', { name: 'Chào mừng trở lại' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /tạo tài khoản/i }),
    ).toHaveAttribute('href', '/auth/register')
    expect(
      screen.getByRole('link', { name: /đăng nhập nội bộ/i }),
    ).toHaveAttribute('href', '/portal/login')
  })

  it('renders the shared internal staff login page', () => {
    renderRoute('/portal/login')

    expect(
      screen.getByRole('heading', { name: 'Chào mừng trở lại' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('form', { name: 'Đăng nhập nhân viên' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Không gian làm việc')).not.toBeInTheDocument()
  })

  it('shows Vietnamese required-field validation', async () => {
    const user = userEvent.setup()
    renderRoute('/auth/login')

    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByText('Vui lòng nhập email.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập mật khẩu.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('validates email format before calling the backend', async () => {
    const user = userEvent.setup()
    let loginCalls = 0
    server.use(
      http.post('*/auth/login', () => {
        loginCalls += 1
        return HttpResponse.json(loginEnvelope('customer'))
      }),
    )
    renderRoute('/auth/login')
    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Mật khẩu'), 'secure-password')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(
      await screen.findByText('Vui lòng nhập địa chỉ email hợp lệ.'),
    ).toBeInTheDocument()
    expect(loginCalls).toBe(0)
  })

  it('rejects passwords shorter than six characters', async () => {
    const user = userEvent.setup()
    renderRoute('/auth/login')
    await fillCredentials(user, 'short')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(
      await screen.findByText('Mật khẩu phải có ít nhất 6 ký tự.'),
    ).toBeInTheDocument()
  })

  it('rejects passwords longer than one hundred characters', async () => {
    const user = userEvent.setup()
    renderRoute('/auth/login')
    await user.type(screen.getByLabelText('Email'), 'person@example.com')
    fireEvent.change(screen.getByLabelText('Mật khẩu'), {
      target: { value: 'a'.repeat(101) },
    })
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(
      await screen.findByText('Mật khẩu không được vượt quá 100 ký tự.'),
    ).toBeInTheDocument()
  })

  it('allows the user to show and hide the password', async () => {
    const user = userEvent.setup()
    renderRoute('/auth/login')
    const password = screen.getByLabelText('Mật khẩu')

    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }))
    expect(password).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('sends valid customer credentials through the existing auth service', async () => {
    const user = userEvent.setup()
    let receivedBody: unknown
    server.use(
      http.post('*/auth/login', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json(loginEnvelope('customer'))
      }),
    )
    renderRoute('/auth/login')
    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await screen.findByRole('heading', { name: 'Tài khoản khách hàng' })
    expect(receivedBody).toEqual({
      email: 'person@example.com',
      password: 'secure-password',
    })
  })

  it.each([
    ['customer', '/account', 'Tài khoản khách hàng'],
    ['system_admin', '/portal/admin', 'Quản trị hệ thống'],
    ['business_ops_manager', '/portal/ops', 'Vận hành doanh nghiệp'],
    ['facility_manager', '/portal/manager', 'Quản lý cơ sở'],
    ['facility_staff', '/portal/staff', 'Nhân viên cơ sở'],
  ])(
    'routes the authenticated %s role to its mapped destination',
    async (role, destination, heading) => {
      const user = userEvent.setup()
      server.use(
        http.post('*/auth/login', () => HttpResponse.json(loginEnvelope(role))),
      )
      const router = renderRoute('/portal/login')
      await fillCredentials(user)
      await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

      expect(
        await screen.findByRole('heading', { name: heading }),
      ).toBeInTheDocument()
      expect(router.state.location.pathname).toBe(destination)
    },
  )

  it('explains when a customer account enters through the internal login', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json(loginEnvelope('customer')),
      ),
    )
    const router = renderRoute('/portal/login')
    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    const notice =
      'Tài khoản này thuộc khu vực khách hàng. Bạn đã được chuyển đến đúng khu vực.'
    expect(await screen.findByText(notice)).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.state).toBeNull())
    expect(screen.getByText(notice)).toBeInTheDocument()

    await router.navigate('/account/settings')
    await waitFor(() =>
      expect(screen.queryByText(notice)).not.toBeInTheDocument(),
    )
    await router.navigate('/account')
    expect(screen.queryByText(notice)).not.toBeInTheDocument()
  })

  it('clears the notice after navigating within the internal portal layout', async () => {
    const notice =
      'Tài khoản này thuộc khu vực quản trị hệ thống. Bạn đã được chuyển đến đúng khu vực.'
    const router = createMemoryRouter(routeObjects, {
      initialEntries: [
        {
          pathname: '/portal/admin',
          state: { loginNotice: { message: notice } },
        },
      ],
    })
    render(<RouterProvider router={router} />)

    expect(await screen.findByText(notice)).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.state).toBeNull())
    expect(screen.getByText(notice)).toBeInTheDocument()

    await router.navigate('/portal/staff')
    await waitFor(() =>
      expect(screen.queryByText(notice)).not.toBeInTheDocument(),
    )
    await router.navigate('/portal/admin')
    expect(screen.queryByText(notice)).not.toBeInTheDocument()
  })

  it('shows a safe Vietnamese message for HTTP 401 and does not navigate', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json(
          {
            success: false,
            statusCode: 401,
            messageCode: 'INVALID_CREDENTIALS',
            message: 'Invalid credentials',
            path: '/auth/login',
            timestamp: '2026-10-21T00:00:00.000Z',
          },
          { status: 401 },
        ),
      ),
    )
    renderRoute('/auth/login')
    await fillCredentials(user, 'private-password')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(
      await screen.findByText('Email hoặc mật khẩu không chính xác.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/chưa thể kiểm tra phiên đăng nhập/i),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Chào mừng trở lại' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('private-password')).not.toBeInTheDocument()
  })

  it('shows the forbidden-account message for HTTP 403', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json(
          {
            success: false,
            statusCode: 403,
            messageCode: 'ACCOUNT_FORBIDDEN',
            message: 'Forbidden',
            path: '/auth/login',
            timestamp: '2026-10-21T00:00:00.000Z',
          },
          { status: 403 },
        ),
      ),
    )
    renderRoute('/portal/login')
    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tài khoản chưa được phép truy cập hoặc đã bị khóa.',
    )
    expect(
      screen.queryByText(/chưa thể kiểm tra phiên đăng nhập/i),
    ).not.toBeInTheDocument()
  })

  it('does not misreport a network or CORS failure as invalid credentials', async () => {
    const user = userEvent.setup()
    server.use(http.post('*/auth/login', () => HttpResponse.error()))
    renderRoute('/auth/login')
    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể kết nối đến máy chủ.',
    )
    expect(
      screen.queryByText('Email hoặc mật khẩu không chính xác.'),
    ).not.toBeInTheDocument()
  })

  it('shows a loading state and disables duplicate submission while pending', async () => {
    const user = userEvent.setup()
    let finishLogin: ((response: Response) => void) | undefined
    let resolveStarted: (() => void) | undefined
    const started = new Promise<void>((resolve) => {
      resolveStarted = resolve
    })
    server.use(
      http.post(
        '*/auth/login',
        () =>
          new Promise<Response>((resolve) => {
            finishLogin = resolve
            resolveStarted?.()
          }),
      ),
    )
    renderRoute('/auth/login')
    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    await started

    const pendingButton = screen.getByRole('button', {
      name: /đang đăng nhập/i,
    })
    expect(pendingButton).toBeDisabled()
    expect(screen.getByLabelText('Email')).toBeDisabled()
    finishLogin?.(HttpResponse.json(loginEnvelope('customer')))
    await screen.findByRole('heading', { name: 'Tài khoản khách hàng' })
  })

  it('does not navigate after a failed login', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json(
          {
            success: false,
            statusCode: 401,
            messageCode: 'INVALID_CREDENTIALS',
            message: 'Invalid credentials',
            path: '/auth/login',
            timestamp: '2026-10-21T00:00:00.000Z',
          },
          { status: 401 },
        ),
      ),
    )
    renderRoute('/portal/login')
    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await screen.findByRole('alert')
    expect(
      screen.getByRole('heading', { name: 'Chào mừng trở lại' }),
    ).toBeInTheDocument()
  })

  it('offers navigation to an already authenticated user without redirecting repeatedly', async () => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'person@example.com',
        roles: ['CUSTOMER'],
        permissions: [],
      },
      status: 'authenticated',
      error: null,
    })
    const router = renderRoute('/auth/login')

    expect(
      screen.getByText(/bạn đã đăng nhập với tài khoản person@example.com/i),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/auth/login')
    await userEvent.setup().click(
      screen.getByRole('button', {
        name: /tiếp tục đến khu vực khách hàng/i,
      }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Tài khoản khách hàng' }),
    ).toBeInTheDocument()
  })

  it('fails closed instead of navigating when role data is ambiguous', () => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'person@example.com',
        roles: ['CUSTOMER', 'SYSTEM_ADMIN'],
        permissions: [],
      } as AuthUser,
      status: 'authenticated',
      error: null,
    })
    const router = renderRoute('/portal/login')

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Không thể xác định khu vực phù hợp',
    )
    expect(router.state.location.pathname).toBe('/portal/login')
  })

  it('does not persist submitted credentials or returned tokens in browser storage', async () => {
    const user = userEvent.setup()
    localStorage.clear()
    sessionStorage.clear()
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json(loginEnvelope('customer')),
      ),
    )
    renderRoute('/auth/login')
    await fillCredentials(user, 'private-password')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    await screen.findByRole('heading', { name: 'Tài khoản khách hàng' })

    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it('renders bootstrap checking and error states without starting another bootstrap', async () => {
    useAuthStore.setState({ user: null, status: 'checking', error: null })
    renderRoute('/auth/login')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Đang kiểm tra phiên đăng nhập hiện tại',
    )
    expect(
      screen.getByRole('button', { name: /đang kiểm tra phiên/i }),
    ).toBeDisabled()

    useAuthStore.setState({
      user: null,
      status: 'error',
      error: { kind: 'network', message: 'The server could not be reached.' },
    })
    await waitFor(() =>
      expect(
        screen.getByText(/không thể kết nối để kiểm tra phiên đăng nhập/i),
      ).toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeEnabled()
  })
})
