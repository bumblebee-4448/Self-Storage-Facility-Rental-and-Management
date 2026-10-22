import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { routeObjects } from '@/routes/router'
import { server } from '@/test/server'
import { useAuthStore } from '@/stores/auth-store'

const envelope = (data: unknown, statusCode = 200) => ({
  success: true,
  statusCode,
  messageCode: 'OK',
  message: 'Đã xử lý.',
  data,
})
const backendUser = (role = 'customer') => ({
  id: 'customer-1',
  email: 'customer@example.com',
  name: 'Nguyễn An',
  role,
  phoneNumber: '0912345678',
})
const tokenData = {
  accessToken: 'opaque-access',
  refreshToken: 'opaque-refresh',
  familyId: 'family-1',
}

function renderAt(path: string) {
  useAuthStore.setState({ user: null, status: 'guest', error: null })
  const router = createMemoryRouter(routeObjects, { initialEntries: [path] })
  return { router, ...render(<RouterProvider router={router} />) }
}

describe('authentication pages', () => {
  it('validates login fields before sending a request', async () => {
    const user = userEvent.setup()
    renderAt('/auth/login')
    await screen.findByRole('heading', { name: 'Đăng nhập tài khoản' })
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByText('Nhập email hợp lệ.')).toBeInTheDocument()
    expect(
      screen.getByText('Mật khẩu phải có ít nhất 6 ký tự.'),
    ).toBeInTheDocument()
  })

  it('signs in with the existing auth store and routes from the verified role', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json(envelope({ user: backendUser(), tokens: tokenData })),
      ),
    )
    renderAt('/auth/login')
    await screen.findByRole('heading', { name: 'Đăng nhập tài khoản' })
    await user.type(screen.getByLabelText('Email'), 'customer@example.com')
    await user.type(screen.getByLabelText('Mật khẩu'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(
      await screen.findByRole('heading', { name: /xin chào, nguyễn an/i }),
    ).toBeInTheDocument()
    expect(useAuthStore.getState().user?.roles).toEqual(['CUSTOMER'])
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it('shows backend invalid credential message and does not navigate', async () => {
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
            timestamp: new Date().toISOString(),
          },
          { status: 401 },
        ),
      ),
    )
    renderAt('/auth/login')
    await screen.findByRole('heading', { name: 'Đăng nhập tài khoản' })
    await user.type(screen.getByLabelText('Email'), 'customer@example.com')
    await user.type(screen.getByLabelText('Mật khẩu'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Thông tin đăng nhập không chính xác',
    )
    expect(useAuthStore.getState().status).toBe('error')
  })

  it('requires terms/privacy acknowledgement and validates registration fields', async () => {
    const user = userEvent.setup()
    renderAt('/auth/register')
    await screen.findByRole('heading', { name: 'Bắt đầu với Haven' })
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))
    expect(
      await screen.findByText('Tên cần ít nhất 2 ký tự.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Bạn cần đồng ý với Điều khoản dịch vụ.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Bạn cần xác nhận Chính sách quyền riêng tư.'),
    ).toBeInTheDocument()
  })

  it('requests registration OTP and submits only backend-supported fields', async () => {
    const user = userEvent.setup()
    let registered: Record<string, unknown> | undefined
    server.use(
      http.post('*/auth/send-otp', async ({ request }) => {
        expect(await request.json()).toEqual({ email: 'customer@example.com' })
        return HttpResponse.json(envelope({ message: 'OTP sent' }))
      }),
      http.post('*/auth/register', async ({ request }) => {
        registered = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
          envelope({ user: backendUser(), tokens: tokenData }, 201),
          { status: 201 },
        )
      }),
    )
    renderAt('/auth/register')
    await screen.findByRole('heading', { name: 'Bắt đầu với Haven' })
    await user.type(screen.getByLabelText('Họ và tên'), 'Nguyễn An')
    await user.type(screen.getByLabelText('Email'), 'customer@example.com')
    await user.click(screen.getByRole('button', { name: 'Gửi mã OTP' }))
    expect(await screen.findByText('OTP sent')).toBeInTheDocument()
    await user.type(
      screen.getByLabelText('Số điện thoại (không bắt buộc)'),
      '0912345678',
    )
    await user.type(screen.getByLabelText('Mã OTP'), '123456')
    await user.type(screen.getByLabelText('Mật khẩu'), 'secret123')
    await user.type(screen.getByLabelText('Nhập lại mật khẩu'), 'secret123')
    await user.click(screen.getByLabelText(/đồng ý với/i))
    await user.click(screen.getByLabelText(/chính sách quyền riêng tư/i))
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))
    await screen.findByRole('heading', { name: /xin chào, nguyễn an/i })
    expect(registered).toEqual({
      email: 'customer@example.com',
      otp: '123456',
      name: 'Nguyễn An',
      password: 'secret123',
      phoneNumber: '0912345678',
    })
  })

  it('requests a password reset and only shows continuation after server confirmation', async () => {
    const user = userEvent.setup()
    let calls = 0
    server.use(
      http.post('*/auth/forgot-password', () => {
        calls += 1
        return HttpResponse.json(
          envelope({ message: 'Password reset OTP sent.' }),
        )
      }),
    )
    renderAt('/auth/forgot-password')
    await screen.findByRole('heading', { name: 'Đặt lại mật khẩu' })
    await user.type(screen.getByLabelText('Email'), 'customer@example.com')
    await user.click(screen.getByRole('button', { name: 'Gửi mã đặt lại' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Máy chủ đã xác nhận yêu cầu',
    )
    expect(calls).toBe(1)
    expect(
      screen.getByRole('link', { name: 'Tôi đã có mã OTP' }),
    ).toHaveAttribute(
      'href',
      '/auth/reset-password?email=customer%40example.com',
    )
  })

  it('submits reset password with only the backend DTO fields', async () => {
    const user = userEvent.setup()
    let payload: unknown
    server.use(
      http.post('*/auth/reset-password', async ({ request }) => {
        payload = await request.json()
        return HttpResponse.json(envelope({ message: 'Password reset.' }))
      }),
    )
    renderAt('/auth/reset-password?email=customer%40example.com')
    await screen.findByRole('heading', { name: 'Tạo mật khẩu mới' })
    await user.type(screen.getByLabelText('Mã OTP'), '123456')
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'newsecret')
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới'), 'newsecret')
    await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }))
    expect(
      await screen.findByText(
        'Mật khẩu đã được máy chủ cập nhật. Hãy đăng nhập lại.',
      ),
    ).toBeInTheDocument()
    expect(payload).toEqual({
      email: 'customer@example.com',
      otp: '123456',
      newPassword: 'newsecret',
    })
  })

  it('logs in staff only to the staff workspace, never to admin by default', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json(
          envelope({ user: backendUser('facility_staff'), tokens: tokenData }),
        ),
      ),
    )
    renderAt('/portal/login')
    await screen.findByRole('heading', { name: 'Đăng nhập nhân viên' })
    await user.type(screen.getByLabelText('Email'), 'customer@example.com')
    await user.type(screen.getByLabelText('Mật khẩu'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(
      await screen.findByRole('heading', { name: 'Nhân viên cơ sở' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Quản trị hệ thống' }),
    ).not.toBeInTheDocument()
  })
})
