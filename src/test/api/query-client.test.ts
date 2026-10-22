import { afterEach, describe, expect, it } from 'vitest'
import {
  clearSessionQueryCache,
  invalidateEntityQueries,
  queryClient,
  shouldRetryQuery,
} from '@/config/query-client'
import { entityQueryKeys } from '@/utils/query-keys'

afterEach(() => queryClient.clear())

describe('server state foundation', () => {
  it('uses filters and facility scope in entity query keys', () => {
    const keys = entityQueryKeys('storage-units')
    expect(keys.list({ status: 'available' }, 'facility-a')).not.toEqual(
      keys.list({ status: 'available' }, 'facility-b'),
    )
    expect(keys.list({ status: 'available' }, 'facility-a')).not.toEqual(
      keys.list({ status: 'occupied' }, 'facility-a'),
    )
  })

  it('clears cached server state at an authentication boundary', () => {
    queryClient.setQueryData(['private', 'contracts', 'list'], ['private data'])
    clearSessionQueryCache()
    expect(
      queryClient.getQueryData(['private', 'contracts', 'list']),
    ).toBeUndefined()
  })

  it('does not let a pending old-session query repopulate the cache', async () => {
    let resolveQuery!: (value: string[]) => void
    let markStarted!: () => void
    const queryStarted = new Promise<void>((resolve) => {
      markStarted = resolve
    })
    const pendingResult = queryClient
      .fetchQuery({
        queryKey: ['private', 'contracts', 'list'],
        queryFn: () => {
          markStarted()
          return new Promise<string[]>((resolve) => {
            resolveQuery = resolve
          })
        },
      })
      .catch(() => undefined)

    await queryStarted
    clearSessionQueryCache()
    resolveQuery(['old account contract'])
    await pendingResult

    expect(
      queryClient.getQueryData(['private', 'contracts', 'list']),
    ).toBeUndefined()
  })

  it('invalidates only the affected entity and facility after a mutation', async () => {
    const facilityA = entityQueryKeys('storage-units').list({}, 'facility-a')
    const facilityB = entityQueryKeys('storage-units').list({}, 'facility-b')
    const contracts = entityQueryKeys('contracts').list({}, 'facility-a')
    queryClient.setQueryData(facilityA, ['a'])
    queryClient.setQueryData(facilityB, ['b'])
    queryClient.setQueryData(contracts, ['contract'])

    await invalidateEntityQueries('storage-units', 'facility-a')

    expect(
      queryClient.getQueryCache().find({ queryKey: facilityA })?.state
        .isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryCache().find({ queryKey: facilityB })?.state
        .isInvalidated,
    ).toBe(false)
    expect(
      queryClient.getQueryCache().find({ queryKey: contracts })?.state
        .isInvalidated,
    ).toBe(false)
  })

  it('retries a transient Axios failure once but does not retry client errors', async () => {
    const axios = await import('axios')
    expect(shouldRetryQuery(0, new axios.AxiosError('network'))).toBe(true)
    expect(
      shouldRetryQuery(
        0,
        new axios.AxiosError('forbidden', undefined, undefined, undefined, {
          status: 403,
          statusText: 'Forbidden',
          headers: {},
          config: { headers: new axios.AxiosHeaders() },
          data: null,
        }),
      ),
    ).toBe(false)
    expect(shouldRetryQuery(1, new axios.AxiosError('network'))).toBe(false)
  })
})
