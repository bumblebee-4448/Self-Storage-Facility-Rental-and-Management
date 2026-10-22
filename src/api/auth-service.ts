import { z } from 'zod'
import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import { registerRefreshOperation } from '@/api/refresh-coordinator'
import { normalizeBackendUser } from '@/utils/normalize-backend-user'
import type {
  BackendAuthUser,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from '@/models/backend-auth'
import type { AuthUser } from '@/models/auth'

const userSchema = z.object({
  id: z.unknown().optional(),
  _id: z.unknown().optional(),
  email: z.unknown().optional(),
  name: z.unknown().optional(),
  phoneNumber: z.unknown().optional(),
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

function discardTokens(payload: LoginResponse): AuthUser {
  return normalizeBackendUser(payload.user)
}

async function postMessage(path: string, payload: unknown): Promise<string> {
  const response = await apiClient.post<unknown>(path, payload)
  const envelope = validateEnvelope<{ message?: unknown }>(response.data)
  return typeof envelope.data?.message === 'string'
    ? envelope.data.message
    : envelope.message
}

export async function login(credentials: LoginRequest): Promise<AuthUser> {
  const response = await apiClient.post<unknown>('/auth/login', credentials)
  const envelope = validateEnvelope<LoginResponse>(response.data)
  return discardTokens(validateAuthPayload(envelope.data))
}

export async function sendRegistrationOtp(email: string): Promise<string> {
  return postMessage('/auth/send-otp', { email })
}

export async function registerAccount(
  payload: RegisterRequest,
): Promise<AuthUser> {
  const response = await apiClient.post<unknown>('/auth/register', payload)
  const envelope = validateEnvelope<LoginResponse>(response.data)
  return discardTokens(validateAuthPayload(envelope.data))
}

export async function requestPasswordReset(
  payload: ForgotPasswordRequest,
): Promise<string> {
  return postMessage('/auth/forgot-password', payload)
}

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<string> {
  return postMessage('/auth/reset-password', payload)
}

export async function changePassword(
  payload: ChangePasswordRequest,
): Promise<string> {
  const response = await apiClient.patch<unknown>(
    '/auth/change-password',
    payload,
  )
  const envelope = validateEnvelope<{ message?: unknown }>(response.data)
  return typeof envelope.data?.message === 'string'
    ? envelope.data.message
    : envelope.message
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout', {})
}

export async function refreshSession(): Promise<void> {
  const response = await apiClient.post<unknown>('/auth/refresh', {})
  const envelope = validateEnvelope<RefreshResponse>(response.data)
  const parsed = tokensSchema.safeParse(envelope.data)
  if (!parsed.success)
    throw new Error('Backend returned an invalid refresh response.')
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<unknown>('/auth/me', {
    authRefreshEligible: true,
  })
  const envelope = validateEnvelope<BackendAuthUser>(response.data)
  const parsedUser = userSchema.safeParse(envelope.data)
  if (!parsedUser.success)
    throw new Error('Backend returned an invalid current-user response.')
  return normalizeBackendUser(parsedUser.data)
}

registerRefreshOperation(refreshSession)
