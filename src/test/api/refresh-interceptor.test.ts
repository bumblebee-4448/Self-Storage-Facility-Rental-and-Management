import { http, HttpResponse, delay } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { apiClient } from '@/api/client'
import { server } from '@/test/server'
import '@/api/auth-service'
import {
  beginSessionTransition,
  finishSessionTransition,
  captureRequestSession,
} from '@/api/session-generation'
import { getRefreshRevision } from '@/api/refresh-coordinator'

function envelope<T>(data: T) {
  return {
    success: true,
    statusCode: 200,
    messageCode: 'OK',
    message: 'ok',
    data,
  }
}

function errorEnvelope(statusCode: number, messageCode = 'UNAUTHORIZED') {
  return {
    success: false,
    statusCode,
    messageCode,
    message: 'Request rejected',
    path: '/private/resource',
    timestamp: '2026-10-21T00:00:00.000Z',
  }
}

describe('Axios refresh coordinator', () => {
  beforeEach(() => {
    const generation = beginSessionTransition()
    finishSessionTransition(generation)
  })

  it('uses one refresh for simultaneous eligible 401 responses', async () => {
    let refreshCalls = 0
    const requestCounts = new Map<string, number>()
    server.use(
      http.get('*/private/:name', ({ params }) => {
        const name = String(params.name)
        const count = (requestCounts.get(name) ?? 0) + 1
        requestCounts.set(name, count)
        return count === 1
          ? HttpResponse.json(errorEnvelope(401), { status: 401 })
          : HttpResponse.json(envelope({ name }))
      }),
      http.post('*/auth/refresh', async () => {
        refreshCalls += 1
        await delay(30)
        return HttpResponse.json(
          envelope({
            accessToken: 'access-value',
            refreshToken: 'refresh-value',
          }),
        )
      }),
    )

    const [first, second] = await Promise.all([
      apiClient.get('/private/first', { authRefreshEligible: true }),
      apiClient.get('/private/second', { authRefreshEligible: true }),
    ])

    expect(first.data.data.name).toBe('first')
    expect(second.data.data.name).toBe('second')
    expect(refreshCalls).toBe(1)
    expect(requestCounts.get('first')).toBe(2)
    expect(requestCounts.get('second')).toBe(2)
  })

  it('rejects a GET 401 that arrives after logout begins', async () => {
    let requestCalls = 0
    let refreshCalls = 0
    let releaseResponse: ((response: Response) => void) | undefined
    let handlerStarted: (() => void) | undefined
    const started = new Promise<void>((resolve) => {
      handlerStarted = resolve
    })
    server.use(
      http.get('*/private/logout-race', () => {
        requestCalls += 1
        if (requestCalls > 1) return HttpResponse.json(envelope({}))
        handlerStarted?.()
        return new Promise((resolve) => {
          releaseResponse = (response) => resolve(response)
        })
      }),
      http.post('*/auth/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json(envelope({}))
      }),
    )

    const request = apiClient.get('/private/logout-race', {
      authRefreshEligible: true,
    })
    await started
    const generation = beginSessionTransition()
    finishSessionTransition(generation)
    releaseResponse?.(HttpResponse.json(errorEnvelope(401), { status: 401 }))

    await expect(request).rejects.toMatchObject({ response: { status: 401 } })
    expect(requestCalls).toBe(1)
    expect(refreshCalls).toBe(0)
  })

  it('does not replay a request when logout begins during refresh', async () => {
    let requestCalls = 0
    let refreshCalls = 0
    let releaseRefresh: ((response: Response) => void) | undefined
    let refreshStarted: (() => void) | undefined
    const started = new Promise<void>((resolve) => {
      refreshStarted = resolve
    })
    server.use(
      http.get('*/private/refresh-race', () => {
        requestCalls += 1
        return HttpResponse.json(errorEnvelope(401), { status: 401 })
      }),
      http.post('*/auth/refresh', () => {
        refreshCalls += 1
        refreshStarted?.()
        return new Promise((resolve) => {
          releaseRefresh = (response) => resolve(response)
        })
      }),
    )

    const request = apiClient.get('/private/refresh-race', {
      authRefreshEligible: true,
    })
    await started
    const generation = beginSessionTransition()
    finishSessionTransition(generation)
    releaseRefresh?.(
      HttpResponse.json(
        envelope({ accessToken: 'access', refreshToken: 'refresh' }),
      ),
    )

    await expect(request).rejects.toMatchObject({ response: { status: 401 } })
    expect(requestCalls).toBe(1)
    expect(refreshCalls).toBe(1)
  })

  it('does not replay an old request under a newly signed-in account', async () => {
    let requestCalls = 0
    let refreshCalls = 0
    let releaseResponse: ((response: Response) => void) | undefined
    let handlerStarted: (() => void) | undefined
    const started = new Promise<void>((resolve) => {
      handlerStarted = resolve
    })
    server.use(
      http.get('*/private/account-race', () => {
        requestCalls += 1
        handlerStarted?.()
        return new Promise((resolve) => {
          releaseResponse = (response) => resolve(response)
        })
      }),
      http.post('*/auth/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json(envelope({}))
      }),
    )
    const request = apiClient.get('/private/account-race', {
      authRefreshEligible: true,
    })
    await started
    const generation = beginSessionTransition()
    finishSessionTransition(generation)
    releaseResponse?.(HttpResponse.json(errorEnvelope(401), { status: 401 }))
    await expect(request).rejects.toMatchObject({ response: { status: 401 } })
    expect(requestCalls).toBe(1)
    expect(refreshCalls).toBe(0)
  })

  it('reuses a successful refresh for a staggered 401 in the same generation', async () => {
    let refreshCalls = 0
    let fastCalls = 0
    let lateCalls = 0
    let releaseLateResponse: (() => void) | undefined
    let lateHandlerStarted: (() => void) | undefined
    const lateStarted = new Promise<void>((resolve) => {
      lateHandlerStarted = resolve
    })
    server.use(
      http.get('*/private/staggered/fast', () => {
        fastCalls += 1
        return fastCalls === 1
          ? HttpResponse.json(errorEnvelope(401), { status: 401 })
          : HttpResponse.json(envelope({ ok: true }))
      }),
      http.get('*/private/staggered/late', async () => {
        lateCalls += 1
        if (lateCalls > 1) return HttpResponse.json(envelope({ ok: true }))
        lateHandlerStarted?.()
        await new Promise<void>((resolve) => {
          releaseLateResponse = resolve
        })
        return HttpResponse.json(errorEnvelope(401), { status: 401 })
      }),
      http.post('*/auth/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json(
          envelope({ accessToken: 'access', refreshToken: 'refresh' }),
        )
      }),
    )

    const lateRequest = apiClient.get('/private/staggered/late', {
      authRefreshEligible: true,
    })
    await lateStarted
    await apiClient.get('/private/staggered/fast', {
      authRefreshEligible: true,
    })
    releaseLateResponse?.()
    await lateRequest

    expect(refreshCalls).toBe(1)
    expect(fastCalls).toBe(2)
    expect(lateCalls).toBe(2)
  })

  it('allows a newly dispatched request to refresh again in the same generation', async () => {
    let requestCalls = 0
    let refreshCalls = 0
    server.use(
      http.get('*/private/two-refreshes', () => {
        requestCalls += 1
        return requestCalls % 2 === 1
          ? HttpResponse.json(errorEnvelope(401), { status: 401 })
          : HttpResponse.json(envelope({ requestCalls }))
      }),
      http.post('*/auth/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json(
          envelope({
            accessToken: `access-${refreshCalls}`,
            refreshToken: 'refresh',
          }),
        )
      }),
    )

    await apiClient.get('/private/two-refreshes', {
      authRefreshEligible: true,
    })
    await apiClient.get('/private/two-refreshes', {
      authRefreshEligible: true,
    })

    expect(requestCalls).toBe(4)
    expect(refreshCalls).toBe(2)
  })

  it('preserves the original generation and refresh revision on retry', async () => {
    let requestCalls = 0
    let refreshCalls = 0
    const retryConfigs: Array<{ generation: number; revision: number }> = []
    const expected = {
      generation: captureRequestSession().generation,
      revision: getRefreshRevision(),
    }
    const observerId = apiClient.interceptors.request.use((config) => {
      if (config.authRefreshRetried) {
        retryConfigs.push({
          generation: config.authSessionGeneration ?? -1,
          revision: config.authRefreshRevision ?? -1,
        })
      }
      return config
    })
    server.use(
      http.get('*/private/preserve-metadata', () => {
        requestCalls += 1
        return requestCalls === 1
          ? HttpResponse.json(errorEnvelope(401), { status: 401 })
          : HttpResponse.json(envelope({ ok: true }))
      }),
      http.post('*/auth/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json(
          envelope({ accessToken: 'a', refreshToken: 'r' }),
        )
      }),
    )

    try {
      await apiClient.get('/private/preserve-metadata', {
        authRefreshEligible: true,
      })
    } finally {
      apiClient.interceptors.request.eject(observerId)
    }

    expect(retryConfigs).toEqual([expected])
    expect(refreshCalls).toBe(1)
  })

  it('checks session generation immediately before retry dispatch', async () => {
    let requestCalls = 0
    let refreshCalls = 0
    let changedGeneration = false
    const guardId = apiClient.interceptors.request.use((config) => {
      if (config.authRefreshRetried && !changedGeneration) {
        changedGeneration = true
        const generation = beginSessionTransition()
        finishSessionTransition(generation)
      }
      return config
    })
    server.use(
      http.get('*/private/stale-before-dispatch', () => {
        requestCalls += 1
        return requestCalls === 1
          ? HttpResponse.json(errorEnvelope(401), { status: 401 })
          : HttpResponse.json(envelope({ ok: true }))
      }),
      http.post('*/auth/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json(
          envelope({ accessToken: 'a', refreshToken: 'r' }),
        )
      }),
    )

    try {
      await expect(
        apiClient.get('/private/stale-before-dispatch', {
          authRefreshEligible: true,
        }),
      ).rejects.toMatchObject({ response: { status: 401 } })
    } finally {
      apiClient.interceptors.request.eject(guardId)
    }
    expect(requestCalls).toBe(1)
    expect(refreshCalls).toBe(1)
  })

  it('retries an eligible request at most once', async () => {
    let requestCalls = 0
    let refreshCalls = 0
    server.use(
      http.get('*/private/retry-once', () => {
        requestCalls += 1
        return HttpResponse.json(errorEnvelope(401), { status: 401 })
      }),
      http.post('*/auth/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json(
          envelope({
            accessToken: 'access-value',
            refreshToken: 'refresh-value',
          }),
        )
      }),
    )
    await expect(
      apiClient.get('/private/retry-once', { authRefreshEligible: true }),
    ).rejects.toMatchObject({ response: { status: 401 } })
    expect(requestCalls).toBe(2)
    expect(refreshCalls).toBe(1)
  })

  it('does not loop when refresh itself fails', async () => {
    let requestCalls = 0
    let refreshCalls = 0
    server.use(
      http.get('*/private/refresh-fails', () => {
        requestCalls += 1
        return HttpResponse.json(errorEnvelope(401), { status: 401 })
      }),
      http.post('*/auth/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json(errorEnvelope(401, 'REFRESH_REJECTED'), {
          status: 401,
        })
      }),
    )
    await expect(
      apiClient.get('/private/refresh-fails', { authRefreshEligible: true }),
    ).rejects.toMatchObject({ response: { status: 401 } })
    expect(requestCalls).toBe(1)
    expect(refreshCalls).toBe(1)
  })

  it('does not refresh for 403 responses', async () => {
    let refreshCalls = 0
    server.use(
      http.get('*/private/forbidden', () =>
        HttpResponse.json(errorEnvelope(403, 'FORBIDDEN'), { status: 403 }),
      ),
      http.post('*/auth/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json(envelope({}))
      }),
    )
    await expect(
      apiClient.get('/private/forbidden', { authRefreshEligible: true }),
    ).rejects.toMatchObject({ response: { status: 403 } })
    expect(refreshCalls).toBe(0)
  })

  it('does not refresh public or authentication endpoints', async () => {
    let refreshCalls = 0
    server.use(
      http.get('*/public/items', () =>
        HttpResponse.json(errorEnvelope(401), { status: 401 }),
      ),
      http.get('*/auth/otp/status', () =>
        HttpResponse.json(errorEnvelope(401), { status: 401 }),
      ),
      http.get('*/auth/send-otp', () =>
        HttpResponse.json(errorEnvelope(401), { status: 401 }),
      ),
      http.post('*/auth/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json(envelope({}))
      }),
    )
    await expect(apiClient.get('/public/items')).rejects.toMatchObject({
      response: { status: 401 },
    })
    await expect(
      apiClient.get('/auth/otp/status', { authRefreshEligible: true }),
    ).rejects.toMatchObject({ response: { status: 401 } })
    await expect(
      apiClient.get('/auth/send-otp', { authRefreshEligible: true }),
    ).rejects.toMatchObject({ response: { status: 401 } })
    expect(refreshCalls).toBe(0)
  })

  it.each(['post', 'patch', 'delete'] as const)(
    'does not replay non-idempotent %s mutations',
    async (method) => {
      let mutationCalls = 0
      let refreshCalls = 0
      server.use(
        http.all('*/private/mutation', () => {
          mutationCalls += 1
          return HttpResponse.json(errorEnvelope(401), { status: 401 })
        }),
        http.post('*/auth/refresh', () => {
          refreshCalls += 1
          return HttpResponse.json(envelope({}))
        }),
      )
      await expect(
        apiClient.request({
          url: '/private/mutation',
          method,
          data: { changes: true },
          authRefreshEligible: true,
        }),
      ).rejects.toMatchObject({ response: { status: 401 } })
      expect(mutationCalls).toBe(1)
      expect(refreshCalls).toBe(0)
    },
  )
})
