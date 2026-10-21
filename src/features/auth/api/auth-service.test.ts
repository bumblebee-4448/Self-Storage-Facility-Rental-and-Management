import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/server'
import { getCurrentUser, login, logout, refreshSession } from './auth-service'
import { normalizeBackendUser } from './normalize-user'
import { UserNormalizationError } from './normalize-user'
import { normalizeApiError } from '@/lib/api/errors'

function success<T>(data: T) {
  return {
    success: true,
    statusCode: 200,
    messageCode: 'OK',
    message: 'ok',
    data,
  }
}

function user(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'a@example.com',
    role: 'customer',
    name: 'A User',
    ...overrides,
  }
}

function authPayload(overrides: Record<string, unknown> = {}) {
  return {
    user: user(overrides),
    tokens: { accessToken: 'access-secret', refreshToken: 'refresh-secret' },
  }
}

describe('auth API service', () => {
  it('logs in and returns a normalized user without exposing tokens', async () => {
    server.use(
      http.post(`*/auth/login`, () =>
        HttpResponse.json(success(authPayload())),
      ),
    )

    const result = await login({ email: 'a@example.com', password: 'secret' })

    expect(result).toMatchObject({
      id: 'user-1',
      roles: ['CUSTOMER'],
      permissions: [],
    })
    expect(result).not.toHaveProperty('tokens')
  })

  it.each([401, 403])('preserves login HTTP errors (%i)', async (status) => {
    server.use(
      http.post(`*/auth/login`, () =>
        HttpResponse.json(
          {
            success: false,
            statusCode: status,
            messageCode:
              status === 401 ? 'INVALID_CREDENTIALS' : 'ACCOUNT_FORBIDDEN',
            message: 'Login rejected',
            path: '/auth/login',
            timestamp: '2026-10-21T00:00:00.000Z',
          },
          { status },
        ),
      ),
    )

    await expect(
      login({ email: 'a@example.com', password: 'bad' }),
    ).rejects.toMatchObject({ response: { status } })
  })

  it('gets current user by id', async () => {
    server.use(http.get(`*/auth/me`, () => HttpResponse.json(success(user()))))
    await expect(getCurrentUser()).resolves.toMatchObject({
      id: 'user-1',
      roles: ['CUSTOMER'],
    })
  })

  it('gets current user by serialized _id', async () => {
    server.use(
      http.get(`*/auth/me`, () =>
        HttpResponse.json(success(user({ id: undefined, _id: 'mongo-id' }))),
      ),
    )
    await expect(getCurrentUser()).resolves.toMatchObject({ id: 'mongo-id' })
  })

  it('rejects unknown roles and missing identifiers', () => {
    expect(() => normalizeBackendUser(user({ role: 'root' }))).toThrow(
      UserNormalizationError,
    )
    expect(() => normalizeBackendUser(user({ id: undefined }))).toThrow(
      UserNormalizationError,
    )
  })

  it('accepts a null facility assignment and rejects numeric identifiers', () => {
    expect(
      normalizeBackendUser(user({ assignedFacilityId: null })),
    ).toMatchObject({ assignedFacilityId: null })
    expect(() =>
      normalizeBackendUser(user({ assignedFacilityId: 12345 })),
    ).toThrow(UserNormalizationError)
  })

  it('refreshes using the cookie session and validates direct token data', async () => {
    server.use(
      http.post(`*/auth/refresh`, () =>
        HttpResponse.json(
          success({
            accessToken: 'access-secret',
            refreshToken: 'refresh-secret',
          }),
        ),
      ),
    )
    const result = await refreshSession()
    expect(result).toBeUndefined()
  })

  it('preserves refresh failures', async () => {
    server.use(
      http.post(`*/auth/refresh`, () =>
        HttpResponse.json(
          {
            success: false,
            statusCode: 401,
            messageCode: 'REFRESH_REJECTED',
            message: 'Refresh rejected',
            path: '/auth/refresh',
            timestamp: '2026-10-21T00:00:00.000Z',
          },
          { status: 401 },
        ),
      ),
    )
    const result = await refreshSession().catch(normalizeApiError)
    expect(result).toMatchObject({
      kind: 'http',
      status: 401,
      messageCode: 'REFRESH_REJECTED',
      message: 'Refresh rejected',
    })
  })

  it('logs out with an empty request body', async () => {
    let requestBody: unknown
    server.use(
      http.post(`*/auth/logout`, async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json(success(null))
      }),
    )
    await logout()
    expect(requestBody).toEqual({})
  })

  it('normalizes network errors', () => {
    const error = Object.assign(new Error('offline'), {
      isAxiosError: true,
      request: {},
    })
    expect(normalizeApiError(error)).toMatchObject({ kind: 'network' })
  })

  it('preserves backend validation errors', () => {
    const response = {
      success: false,
      statusCode: 400,
      messageCode: 'VALIDATION',
      message: 'Invalid input',
      errors: [{ field: 'email' }],
      path: '/auth/login',
      timestamp: '2026-10-21T00:00:00.000Z',
    }
    const error = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 400, data: response },
    })
    expect(normalizeApiError(error)).toMatchObject({
      kind: 'http',
      status: 400,
      messageCode: 'VALIDATION',
      errors: response.errors,
    })
  })

  it('preserves HTTP status when the error body is malformed', () => {
    const error = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 502, data: { reason: 'bad gateway' } },
    })
    expect(normalizeApiError(error)).toEqual({
      kind: 'http',
      status: 502,
      message: 'The server returned an unexpected response.',
    })
    expect(normalizeApiError(error)).not.toHaveProperty('messageCode')
  })

  it('distinguishes timeout errors from network errors', () => {
    const error = Object.assign(new Error('timeout'), {
      isAxiosError: true,
      code: 'ETIMEDOUT',
      request: {},
    })
    expect(normalizeApiError(error)).toMatchObject({ kind: 'timeout' })
  })

  it('does not persist credentials or tokens in browser storage', async () => {
    server.use(
      http.post(`*/auth/login`, () =>
        HttpResponse.json(success(authPayload())),
      ),
    )
    await login({ email: 'a@example.com', password: 'secret' })
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})
