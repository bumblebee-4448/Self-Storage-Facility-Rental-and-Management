import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

export const PRIVATE_QUERY_SCOPE = 'private'

export function shouldRetryQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (failureCount >= 1) return false
  if (!isAxiosError(error)) return false
  return !error.response || error.response.status >= 500
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: shouldRetryQuery,
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 3_000),
      meta: { scope: PRIVATE_QUERY_SCOPE },
    },
    mutations: {
      retry: false,
      meta: { scope: PRIVATE_QUERY_SCOPE },
    },
  },
})

/** Clear server state at identity boundaries so private data cannot cross accounts. */
export function clearSessionQueryCache(): void {
  queryClient.clear()
}

/** Call from a successful mutation's onSuccess to refresh only affected entities. */
export function invalidateEntityQueries(
  entity: string,
  facilityId?: string,
): Promise<void> {
  return queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey
      if (key[0] !== PRIVATE_QUERY_SCOPE || key[1] !== entity) return false
      if (facilityId === undefined) return true
      return key.some(
        (part) =>
          typeof part === 'object' &&
          part !== null &&
          'facilityId' in part &&
          part.facilityId === facilityId,
      )
    },
  })
}
