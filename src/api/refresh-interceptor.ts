import {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import { runRefreshSingleFlight } from '@/api/refresh-coordinator'
import { captureRequestSession } from '@/api/session-generation'
import { getRefreshRevision } from '@/api/refresh-coordinator'

declare module 'axios' {
  interface AxiosRequestConfig {
    authRefreshEligible?: boolean
    authRefreshRetried?: boolean
    authSessionGeneration?: number
    authRefreshAllowedAtDispatch?: boolean
    authRefreshRevision?: number
    authOriginalError?: AxiosError
  }
  interface InternalAxiosRequestConfig {
    authRefreshEligible?: boolean
    authRefreshRetried?: boolean
    authSessionGeneration?: number
    authRefreshAllowedAtDispatch?: boolean
    authRefreshRevision?: number
    authOriginalError?: AxiosError
  }
}

const excludedAuthPaths = [
  '/auth/login',
  '/auth/logout',
  '/auth/refresh',
  '/auth/register',
  '/auth/otp',
  '/auth/send-otp',
]

function isEligibleRequest(config: InternalAxiosRequestConfig): boolean {
  if (!config.authRefreshEligible || config.authRefreshRetried) return false
  const method = config.method?.toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method ?? '')) return false
  const path = new URL(config.url ?? '', config.baseURL ?? 'http://localhost')
    .pathname
  if (
    excludedAuthPaths.some(
      (excluded) => path === excluded || path.startsWith(`${excluded}/`),
    )
  ) {
    return false
  }
  return true
}

export function installAuthRefreshInterceptor(client: AxiosInstance): void {
  client.interceptors.request.use((config) => {
    if (config.authSessionGeneration === undefined) {
      const snapshot = captureRequestSession()
      config.authSessionGeneration = snapshot.generation
      config.authRefreshAllowedAtDispatch = snapshot.refreshAllowed
      config.authRefreshRevision = getRefreshRevision()
    }
    if (
      config.authRefreshRetried &&
      (config.authSessionGeneration !== captureRequestSession().generation ||
        config.authRefreshAllowedAtDispatch !== true)
    ) {
      return Promise.reject(config.authOriginalError)
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config
      if (
        error.response?.status !== 401 ||
        !config ||
        !isEligibleRequest(config) ||
        config.authSessionGeneration === undefined
      ) {
        return Promise.reject(error)
      }

      try {
        await runRefreshSingleFlight(
          config.authSessionGeneration,
          config.authRefreshAllowedAtDispatch === true,
          config.authRefreshRevision ?? getRefreshRevision(),
          error,
        )
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
      if (config.authSessionGeneration !== captureRequestSession().generation) {
        return Promise.reject(error)
      }
      config.authRefreshRetried = true
      config.authOriginalError = error
      return client.request(config)
    },
  )
}
