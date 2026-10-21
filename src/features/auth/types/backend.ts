import type { ApiResponse } from '@/lib/api/types'

export interface LoginRequest {
  email: string
  password: string
}

/** Untrusted backend user data is validated before normalization. */
export interface BackendAuthUser {
  id?: unknown
  _id?: unknown
  email?: unknown
  name?: unknown
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
