import type { ApiResponse } from '@/api/types'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  otp: string
  password: string
  name: string
  phoneNumber?: string
}

export interface ForgotPasswordRequest {
  email: string
}
export interface ResetPasswordRequest {
  email: string
  otp: string
  newPassword: string
}
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

/** Untrusted backend user data is validated before normalization. */
export interface BackendAuthUser {
  id?: unknown
  _id?: unknown
  email?: unknown
  name?: unknown
  phoneNumber?: unknown
  role?: unknown
  assignedFacilityId?: unknown
}

export interface BackendAuthTokens {
  accessToken: string
  refreshToken: string
  familyId?: string
}

export interface LoginResponse {
  user: BackendAuthUser
  tokens: BackendAuthTokens
}

export type LoginApiResponse = ApiResponse<LoginResponse>
export type RefreshResponse = BackendAuthTokens
export type RefreshApiResponse = ApiResponse<RefreshResponse>
export type CurrentUserResponse = BackendAuthUser
export type CurrentUserApiResponse = ApiResponse<CurrentUserResponse>
