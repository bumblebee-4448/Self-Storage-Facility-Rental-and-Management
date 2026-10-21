import { create } from 'zustand'
import { getCurrentUser, login, logout } from '@/api/auth-service'
import type { LoginRequest } from '@/models/backend-auth'
import type { AuthUser } from '@/models/auth'
import { normalizeApiError } from '@/api/errors'
import type { NormalizedApiError } from '@/api/errors'
import { registerSessionInvalidatedOperation } from '@/api/refresh-coordinator'
import {
  beginSessionTransition,
  finishSessionTransition,
  getSessionGeneration,
  isSessionTransitionInProgress,
} from '@/api/session-generation'

export type AuthStatus =
  'idle' | 'checking' | 'authenticated' | 'guest' | 'error'

export interface AuthState {
  user: AuthUser | null
  status: AuthStatus
  error: NormalizedApiError | null
}

interface AuthActions {
  bootstrapSession: () => Promise<void>
  signIn: (credentials: LoginRequest) => Promise<AuthActionResult<AuthUser>>
  signOut: () => Promise<AuthActionResult<void>>
  retryBootstrap: () => Promise<void>
}

export type AuthActionResult<T> =
  { success: true; value: T } | { success: false; error: NormalizedApiError }

type AuthStore = AuthState & AuthActions

let bootstrapFlight: { epoch: number; promise: Promise<void> } | null = null

function supersededResult(): NormalizedApiError {
  return {
    kind: 'unexpected',
    message:
      'This authentication action was superseded by a newer session action.',
  }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  status: 'idle',
  error: null,

  bootstrapSession: () => {
    if (isSessionTransitionInProgress()) return Promise.resolve()
    if (get().status === 'authenticated' && get().user) {
      return Promise.resolve()
    }
    const epoch = getSessionGeneration()
    if (bootstrapFlight?.epoch === epoch) return bootstrapFlight.promise

    set({ user: null, status: 'checking', error: null })
    const promise = Promise.resolve().then(async () => {
      try {
        const user = await getCurrentUser()
        if (getSessionGeneration() !== epoch) return
        set({ user, status: 'authenticated', error: null })
      } catch (cause) {
        if (getSessionGeneration() !== epoch) return
        const error = normalizeApiError(cause)
        if (error.kind === 'http' && error.status === 401) {
          set({ user: null, status: 'guest', error: null })
        } else {
          set({ user: null, status: 'error', error })
        }
      } finally {
        if (bootstrapFlight?.promise === promise) bootstrapFlight = null
      }
    })
    bootstrapFlight = { epoch, promise }
    return promise
  },

  signIn: async (credentials) => {
    const epoch = beginSessionTransition()
    set({ user: null, status: 'checking', error: null })
    try {
      const user = await login(credentials)
      if (getSessionGeneration() !== epoch) {
        return { success: false, error: supersededResult() }
      }
      set({ user, status: 'authenticated', error: null })
      finishSessionTransition(epoch)
      return { success: true, value: user }
    } catch (cause) {
      if (getSessionGeneration() !== epoch) {
        return { success: false, error: supersededResult() }
      }
      const error = normalizeApiError(cause)
      set({ user: null, status: 'error', error })
      finishSessionTransition(epoch)
      return { success: false, error }
    }
  },

  signOut: async () => {
    const previousUser = get().user
    const epoch = beginSessionTransition()
    set({ user: previousUser, status: 'checking', error: null })
    try {
      await logout()
      if (getSessionGeneration() !== epoch) {
        return { success: false, error: supersededResult() }
      }
      set({ user: null, status: 'guest', error: null })
      finishSessionTransition(epoch)
      return { success: true, value: undefined }
    } catch (cause) {
      if (getSessionGeneration() !== epoch) {
        return { success: false, error: supersededResult() }
      }
      const error = normalizeApiError(cause)
      if (error.kind === 'http' && error.status === 401) {
        set({ user: null, status: 'guest', error: null })
        finishSessionTransition(epoch)
        return { success: true, value: undefined }
      } else {
        set({ user: previousUser, status: 'error', error })
      }
      finishSessionTransition(epoch)
      return { success: false, error }
    }
  },

  retryBootstrap: () => get().bootstrapSession(),
}))

registerSessionInvalidatedOperation((failedGeneration) => {
  if (getSessionGeneration() !== failedGeneration) return
  const invalidatedGeneration = beginSessionTransition()
  useAuthStore.setState({ user: null, status: 'guest', error: null })
  finishSessionTransition(invalidatedGeneration)
})
