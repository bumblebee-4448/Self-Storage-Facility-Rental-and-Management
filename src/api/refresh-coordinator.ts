import axios from 'axios'
import { isRefreshAllowedForSession } from '@/api/session-generation'

type RefreshOperation = () => Promise<void>

let refreshOperation: RefreshOperation | null = null
let sessionInvalidatedOperation: ((generation: number) => void) | null = null
let inFlightRefresh: {
  generation: number
  revision: number
  promise: Promise<void>
} | null = null
let refreshRevision = 0

export function registerRefreshOperation(operation: RefreshOperation): void {
  refreshOperation = operation
}

export function registerSessionInvalidatedOperation(
  operation: (generation: number) => void,
): void {
  sessionInvalidatedOperation = operation
}

export function getRefreshRevision(): number {
  return refreshRevision
}

export function runRefreshSingleFlight(
  generation: number,
  allowedAtDispatch: boolean,
  requestRevision: number,
  originalError: unknown,
): Promise<void> {
  if (!isRefreshAllowedForSession(generation, allowedAtDispatch)) {
    return Promise.reject(originalError)
  }
  if (
    inFlightRefresh?.generation === generation &&
    inFlightRefresh.revision === requestRevision
  ) {
    return inFlightRefresh.promise
  }
  if (refreshRevision > requestRevision) return Promise.resolve()
  if (!refreshOperation) {
    return Promise.reject(originalError)
  }

  const currentRefresh = Promise.resolve()
    .then(refreshOperation)
    .then(() => {
      if (isRefreshAllowedForSession(generation, allowedAtDispatch)) {
        refreshRevision += 1
      }
    })
    .catch((error: unknown) => {
      if (
        isRefreshAllowedForSession(generation, allowedAtDispatch) &&
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        sessionInvalidatedOperation?.(generation)
      }
      throw error
    })
    .finally(() => {
      if (inFlightRefresh?.promise === currentRefresh) inFlightRefresh = null
    })
  inFlightRefresh = {
    generation,
    revision: requestRevision,
    promise: currentRefresh,
  }
  return currentRefresh
}
