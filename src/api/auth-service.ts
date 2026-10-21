import { z } from 'zod'
import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import { registerRefreshOperation } from '@/api/refresh-coordinator'
import { normalizeBackendUser } from '@/utils/normalize-backend-user'
import type {
  CurrentUserResponse,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
} from '@/models/backend-auth'
import type { AuthUser } from '@/models/auth'

const userSchema = z.object({
  id: z.unknown().optional(),
  _id: z.unknown().optional(),
  email: z.unknown().optional(),
  name: z.unknown().optional(),
  role: z.unknown().optional(),
  assignedFacilityId: z.unknown().optional(),
})

const tokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  familyId: z.string().optional(),
})

function validateEnvelope<T>(value: unknown): ApiResponse<T> {
  const parsed = z
    .object({
      success: z.boolean(),
      statusCode: z.number(),
      messageCode: z.string(),
      message: z.string(),
      data: z.unknown(),
    })
    .safeParse(value)
  if (!parsed.success || !parsed.data.success) {
    throw new Error('Backend returned an invalid success response.')
  }
  return parsed.data as ApiResponse<T>
}

function validateAuthPayload(value: unknown): LoginResponse {
  const parsed = z
    .object({ user: userSchema, tokens: tokensSchema })
    .safeParse(value)
  if (!parsed.success)
    throw new Error('Backend returned an invalid authentication response.')
  return parsed.data as LoginResponse
}

function validateTokenPayload(value: unknown): RefreshResponse {
  const parsed = tokensSchema.safeParse(value)
  if (!parsed.success) {
    throw new Error('Backend returned an invalid refresh response.')
  }
  return parsed.data
}

function discardTokens(payload: LoginResponse): AuthUser {
  // The token fields are validated but deliberately omitted from the UI-facing result.
  return normalizeBackendUser(payload.user)
}

export async function login(credentials: LoginRequest): Promise<AuthUser> {
  const response = await apiClient.post<unknown>('/auth/login', credentials)
  const envelope = validateEnvelope<LoginResponse>(response.data)
  return discardTokens(validateAuthPayload(envelope.data))
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout', {})
}

export async function refreshSession(): Promise<void> {
  const response = await apiClient.post<unknown>('/auth/refresh', {})
  const envelope = validateEnvelope<RefreshResponse>(response.data)
  validateTokenPayload(envelope.data)
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<unknown>('/auth/me', {
    authRefreshEligible: true,
  })
  const envelope = validateEnvelope<CurrentUserResponse>(response.data)
  const parsedUser = userSchema.safeParse(envelope.data)
  if (!parsedUser.success) {
    throw new Error('Backend returned an invalid current-user response.')
  }
  return normalizeBackendUser(parsedUser.data)
}

registerRefreshOperation(refreshSession)
