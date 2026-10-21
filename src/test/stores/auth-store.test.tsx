import { StrictMode } from 'react'
import { render, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthSessionInitializer } from '@/components/providers/AuthSessionInitializer'
import { apiClient } from '@/api/client'
import { server } from '@/test/server'
import {
  beginSessionTransition,
  finishSessionTransition,
} from '@/api/session-generation'
import { useAuthStore } from '@/stores/auth-store'

function envelope<T>(data: T, statusCode = 200) {
  return {
    success: true,
    statusCode,
    messageCode: 'OK',
    message: 'ok',
    data,
  }
}

function backendUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'person@example.com',
    role: 'customer',
    ...overrides,
  }
}

function tokenData() {
  return { accessToken: 'access-value', refreshToken: 'refresh-value' }
}

function resetStore() {
  const generation = beginSessionTransition()
  finishSessionTransition(generation)
  useAuthStore.setState({ user: null, status: 'idle', error: null })
}

function authenticatedUser(id = 'user-1') {
  return {
    id,
    email: 'person@example.com',
    roles: ['CUSTOMER' as const],
    permissions: [],
  }
}

describe('authentication session lifecycle', () => {
  beforeEach(resetStore)

  it('bootstraps an existing session', async () => {
    server.use(
      http.get('*/auth/me', () => HttpResponse.json(envelope(backendUser()))),
    )
    await useAuthStore.getState().bootstrapSession()
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      user: { id: 'user-1' },
    })
  })

  it('refreshes once after bootstrap 401 and retries current user', async () => {
    let meCalls = 0
    let refreshCalls = 0
    server.use(
      http.get('*/auth/me', () => {
        meCalls += 1
        return meCalls === 1
          ? HttpResponse.json({ message: 'expired' }, { status: 401 })
          : HttpResponse.json(envelope(backendUser()))
      }),
      http.post('*/auth/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json(envelope(tokenData()))
      }),
    )

    await useAuthStore.getState().bootstrapSession()

    expect(meCalls).toBe(2)
    expect(refreshCalls).toBe(1)
    expect(useAuthStore.getState().status).toBe('authenticated')
  })

  it('becomes guest when bootstrap refresh is rejected', async () => {
    server.use(
      http.get('*/auth/me', () => HttpResponse.json({}, { status: 401 })),
      http.post('*/auth/refresh', () => HttpResponse.json({}, { status: 401 })),
    )
    await useAuthStore.getState().bootstrapSession()
    expect(useAuthStore.getState()).toMatchObject({
      status: 'guest',
      user: null,
      error: null,
    })
  })

  it('keeps network failure as a retryable error, not guest', async () => {
    server.use(http.get('*/auth/me', () => HttpResponse.error()))
    await useAuthStore.getState().bootstrapSession()
    expect(useAuthStore.getState()).toMatchObject({
      status: 'error',
      error: { kind: 'network' },
    })
  })

  it('retries bootstrap after a transient error', async () => {
    let calls = 0
    server.use(
      http.get('*/auth/me', () => {
        calls += 1
        return calls === 1
          ? HttpResponse.error()
          : HttpResponse.json(envelope(backendUser()))
      }),
    )
    await useAuthStore.getState().bootstrapSession()
    await useAuthStore.getState().retryBootstrap()
    expect(calls).toBe(2)
    expect(useAuthStore.getState().status).toBe('authenticated')
  })

  it('avoids bootstrap requests when already authenticated', async () => {
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
    let calls = 0
    server.use(
      http.get('*/auth/me', () => {
        calls += 1
        return HttpResponse.json(envelope(backendUser()))
      }),
    )
    await useAuthStore.getState().bootstrapSession()
    expect(calls).toBe(0)
  })

  it('updates the store after successful login', async () => {
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json(
          envelope({ user: backendUser(), tokens: tokenData() }),
        ),
      ),
    )
    const result = await useAuthStore
      .getState()
      .signIn({ email: 'person@example.com', password: 'secret' })
    expect(result).toMatchObject({ success: true, value: { id: 'user-1' } })
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      user: { id: 'user-1', permissions: [] },
      error: null,
    })
  })

  it.each([
    [401, 'INVALID_CREDENTIALS'],
    [403, 'ACCOUNT_FORBIDDEN'],
  ])(
    'preserves login error status %i without refreshing',
    async (status, messageCode) => {
      let refreshCalls = 0
      server.use(
        http.post('*/auth/login', () =>
          HttpResponse.json(
            {
              success: false,
              statusCode: status,
              messageCode,
              message: 'Login rejected',
              path: '/auth/login',
              timestamp: '2026-10-21T00:00:00.000Z',
            },
            { status },
          ),
        ),
        http.post('*/auth/refresh', () => {
          refreshCalls += 1
          return HttpResponse.json(envelope(tokenData()))
        }),
      )
      const result = await useAuthStore
        .getState()
        .signIn({ email: 'person@example.com', password: 'bad' })
      expect(result).toMatchObject({
        success: false,
        error: { kind: 'http', status, messageCode },
      })
      expect(useAuthStore.getState()).toMatchObject({
        status: 'error',
        user: null,
        error: { kind: 'http', status, messageCode },
      })
      expect(refreshCalls).toBe(0)
    },
  )

  it('clears the session after successful logout', async () => {
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
    server.use(
      http.post('*/auth/logout', () => HttpResponse.json(envelope(null))),
    )
    const result = await useAuthStore.getState().signOut()
    expect(result).toEqual({ success: true, value: undefined })
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      status: 'guest',
      error: null,
    })
  })

  it('treats logout 401 as successful local cleanup of an expired session', async () => {
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
    server.use(
      http.post('*/auth/logout', () =>
        HttpResponse.json({ message: 'expired' }, { status: 401 }),
      ),
    )
    const result = await useAuthStore.getState().signOut()
    expect(result).toEqual({ success: true, value: undefined })
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      status: 'guest',
      error: null,
    })
  })

  it('does not claim server logout succeeded after network failure', async () => {
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
    server.use(http.post('*/auth/logout', () => HttpResponse.error()))
    const result = await useAuthStore.getState().signOut()
    expect(result).toMatchObject({ success: false, error: { kind: 'network' } })
    expect(useAuthStore.getState()).toMatchObject({
      user: { id: 'user-1' },
      status: 'error',
      error: { kind: 'network' },
    })
  })

  it('does not duplicate bootstrap requests in React StrictMode', async () => {
    let calls = 0
    server.use(
      http.get('*/auth/me', () => {
        calls += 1
        return HttpResponse.json(envelope(backendUser()))
      }),
    )
    render(
      <StrictMode>
        <AuthSessionInitializer>
          <div>Application</div>
        </AuthSessionInitializer>
      </StrictMode>,
    )
    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe('authenticated'),
    )
    expect(calls).toBe(1)
  })

  it('does not restore a bootstrap result after logout starts', async () => {
    let finishCurrentUser: ((response: Response) => void) | undefined
    server.use(
      http.get(
        '*/auth/me',
        () =>
          new Promise((resolve) => {
            finishCurrentUser = (response) => resolve(response)
          }),
      ),
      http.post('*/auth/logout', () => HttpResponse.json(envelope(null))),
    )
    const bootstrap = useAuthStore.getState().bootstrapSession()
    await waitFor(() => expect(finishCurrentUser).toBeDefined())
    await useAuthStore.getState().signOut()
    finishCurrentUser?.(HttpResponse.json(envelope(backendUser())))
    await bootstrap
    expect(useAuthStore.getState()).toMatchObject({
      status: 'guest',
      user: null,
    })
  })

  it('does not let bootstrap run during an in-progress logout', async () => {
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
    let meCalls = 0
    let finishLogout: ((response: Response) => void) | undefined
    server.use(
      http.get('*/auth/me', () => {
        meCalls += 1
        return HttpResponse.json(envelope(backendUser()))
      }),
      http.post(
        '*/auth/logout',
        () =>
          new Promise((resolve) => {
            finishLogout = (response) => resolve(response)
          }),
      ),
    )
    const logout = useAuthStore.getState().signOut()
    await waitFor(() => expect(finishLogout).toBeDefined())
    await useAuthStore.getState().bootstrapSession()
    finishLogout?.(HttpResponse.json(envelope(null)))
    await logout
    expect(meCalls).toBe(0)
    expect(useAuthStore.getState().status).toBe('guest')
  })

  it('does not let bootstrap run during a newer sign-in', async () => {
    let meCalls = 0
    let finishLogin: ((response: Response) => void) | undefined
    server.use(
      http.get('*/auth/me', () => {
        meCalls += 1
        return HttpResponse.json(envelope(backendUser()))
      }),
      http.post(
        '*/auth/login',
        () =>
          new Promise((resolve) => {
            finishLogin = (response) => resolve(response)
          }),
      ),
    )
    const signIn = useAuthStore
      .getState()
      .signIn({ email: 'person@example.com', password: 'secret' })
    await waitFor(() => expect(finishLogin).toBeDefined())
    await useAuthStore.getState().bootstrapSession()
    finishLogin?.(
      HttpResponse.json(envelope({ user: backendUser(), tokens: tokenData() })),
    )
    const result = await signIn
    expect(result.success).toBe(true)
    expect(meCalls).toBe(0)
    expect(useAuthStore.getState().status).toBe('authenticated')
  })

  it('does not let an older bootstrap overwrite a newer sign-in', async () => {
    let finishCurrentUser: ((response: Response) => void) | undefined
    let bootstrapStarted: (() => void) | undefined
    const started = new Promise<void>((resolve) => {
      bootstrapStarted = resolve
    })
    server.use(
      http.get('*/auth/me', () => {
        bootstrapStarted?.()
        return new Promise((resolve) => {
          finishCurrentUser = (response) => resolve(response)
        })
      }),
      http.post('*/auth/login', () =>
        HttpResponse.json(
          envelope({
            user: backendUser({ id: 'new-user' }),
            tokens: tokenData(),
          }),
        ),
      ),
    )
    const bootstrap = useAuthStore.getState().bootstrapSession()
    await started
    const result = await useAuthStore
      .getState()
      .signIn({ email: 'person@example.com', password: 'secret' })
    finishCurrentUser?.(HttpResponse.json(envelope(backendUser())))
    await bootstrap
    expect(result).toMatchObject({ success: true, value: { id: 'new-user' } })
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      user: { id: 'new-user' },
    })
  })

  it('does not let an older login response overwrite a newer logout', async () => {
    let finishLogin: ((response: Response) => void) | undefined
    server.use(
      http.post(
        '*/auth/login',
        () =>
          new Promise((resolve) => {
            finishLogin = (response) => resolve(response)
          }),
      ),
      http.post('*/auth/logout', () => HttpResponse.json(envelope(null))),
    )
    const login = useAuthStore
      .getState()
      .signIn({ email: 'person@example.com', password: 'secret' })
    await waitFor(() => expect(finishLogin).toBeDefined())
    await useAuthStore.getState().signOut()
    finishLogin?.(
      HttpResponse.json(envelope({ user: backendUser(), tokens: tokenData() })),
    )
    const result = await login
    expect(result.success).toBe(false)
    expect(useAuthStore.getState()).toMatchObject({
      status: 'guest',
      user: null,
    })
  })

  it('keeps the authenticated session only in memory', async () => {
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json(
          envelope({ user: backendUser(), tokens: tokenData() }),
        ),
      ),
    )
    await useAuthStore
      .getState()
      .signIn({ email: 'person@example.com', password: 'secret' })
    expect(useAuthStore.getState().user?.id).toBe('user-1')
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it('invalidates the applicable authenticated session after refresh 401', async () => {
    useAuthStore.setState({
      user: authenticatedUser(),
      status: 'authenticated',
      error: null,
    })
    server.use(
      http.get('*/private/session-expired', () =>
        HttpResponse.json(
          {
            success: false,
            statusCode: 401,
            messageCode: 'UNAUTHORIZED',
            message: 'Session expired',
            path: '/private/session-expired',
            timestamp: '2026-10-21T00:00:00.000Z',
          },
          { status: 401 },
        ),
      ),
      http.post('*/auth/refresh', () =>
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

    await expect(
      apiClient.get('/private/session-expired', { authRefreshEligible: true }),
    ).rejects.toMatchObject({ response: { status: 401 } })
    expect(useAuthStore.getState()).toMatchObject({
      status: 'guest',
      user: null,
      error: null,
    })
  })

  it('keeps an authenticated session after refresh network failure', async () => {
    useAuthStore.setState({
      user: authenticatedUser(),
      status: 'authenticated',
      error: null,
    })
    server.use(
      http.get('*/private/refresh-network-failure', () =>
        HttpResponse.json({}, { status: 401 }),
      ),
      http.post('*/auth/refresh', () => HttpResponse.error()),
    )

    await expect(
      apiClient.get('/private/refresh-network-failure', {
        authRefreshEligible: true,
      }),
    ).rejects.toBeDefined()
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      user: { id: 'user-1' },
    })
  })

  it('does not let a stale refresh 401 invalidate a newer login', async () => {
    useAuthStore.setState({
      user: authenticatedUser('old-user'),
      status: 'authenticated',
      error: null,
    })
    let finishRefresh: ((response: Response) => void) | undefined
    let refreshStarted: (() => void) | undefined
    const started = new Promise<void>((resolve) => {
      refreshStarted = resolve
    })
    server.use(
      http.get('*/private/stale-refresh', () =>
        HttpResponse.json({}, { status: 401 }),
      ),
      http.post('*/auth/refresh', () => {
        refreshStarted?.()
        return new Promise((resolve) => {
          finishRefresh = (response) => resolve(response)
        })
      }),
      http.post('*/auth/login', () =>
        HttpResponse.json(
          envelope({
            user: backendUser({ id: 'new-user' }),
            tokens: tokenData(),
          }),
        ),
      ),
    )

    const protectedRequest = apiClient.get('/private/stale-refresh', {
      authRefreshEligible: true,
    })
    await started
    const login = await useAuthStore
      .getState()
      .signIn({ email: 'person@example.com', password: 'secret' })
    finishRefresh?.(
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
    )

    await expect(protectedRequest).rejects.toMatchObject({
      response: { status: 401 },
    })
    expect(login).toMatchObject({ success: true, value: { id: 'new-user' } })
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      user: { id: 'new-user' },
    })
  })
})
