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
  message: 'ok',
  data,
})
function renderAccount(path = '/account/profile') {
  useAuthStore.setState({
    user: {
      id: 'customer-1',
      email: 'person@example.com',
      name: 'A Customer',
      phoneNumber: '0912345678',
      roles: ['CUSTOMER'],
      permissions: [],
    },
    status: 'authenticated',
    error: null,
  })
  const router = createMemoryRouter(routeObjects, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('account profile', () => {
  it('loads profile data from the authenticated profile endpoint and updates supported fields', async () => {
    const user = userEvent.setup()
    let updatePayload: unknown
    server.use(
      http.get('*/profile/me', () =>
        HttpResponse.json(
          envelope({
            userId: 'customer-1',
            avatarUrl: 'https://example.com/a.png',
            dateOfBirth: '1990-01-02T00:00:00.000Z',
            address: 'Hà Nội',
            gender: 'female',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          }),
        ),
      ),
      http.patch('*/profile/me', async ({ request }) => {
        updatePayload = await request.json()
        return HttpResponse.json(
          envelope({
            userId: 'customer-1',
            address: 'Đà Nẵng',
            gender: 'female',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-02',
          }),
        )
      }),
    )
    renderAccount()
    expect(await screen.findByDisplayValue('Hà Nội')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Địa chỉ'))
    await user.type(screen.getByLabelText('Địa chỉ'), 'Đà Nẵng')
    await user.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }))
    expect(
      await screen.findByText('Hồ sơ đã được máy chủ cập nhật.'),
    ).toBeInTheDocument()
    expect(updatePayload).toEqual({
      dateOfBirth: '1990-01-02',
      address: 'Đà Nẵng',
      gender: 'female',
      avatarUrl: 'https://example.com/a.png',
    })
  })

  it('changes password using the backend contract and ends the local session', async () => {
    const user = userEvent.setup()
    let payload: unknown
    server.use(
      http.patch('*/auth/change-password', async ({ request }) => {
        payload = await request.json()
        return HttpResponse.json(envelope({ message: 'changed' }))
      }),
    )
    renderAccount('/account/change-password')
    await screen.findByRole('heading', { name: 'Đổi mật khẩu' })
    await user.type(screen.getByLabelText('Mật khẩu hiện tại'), 'old-secret')
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'new-secret')
    await user.type(
      screen.getByLabelText('Nhập lại mật khẩu mới'),
      'new-secret',
    )
    await user.click(screen.getByRole('button', { name: 'Cập nhật mật khẩu' }))
    expect(
      await screen.findByRole('heading', { name: 'Đăng nhập tài khoản' }),
    ).toBeInTheDocument()
    expect(payload).toEqual({
      currentPassword: 'old-secret',
      newPassword: 'new-secret',
    })
    expect(useAuthStore.getState().status).toBe('guest')
  })
})
