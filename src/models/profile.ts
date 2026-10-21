import type { ApiResponse } from '@/api/types'

export type Gender = 'male' | 'female' | 'other'

export interface ProfileResponse {
  id?: string
  userId: string
  avatarUrl?: string
  dateOfBirth?: string
  address?: string
  gender?: Gender
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileRequest {
  avatarUrl?: string
  dateOfBirth?: string
  address?: string
  gender?: Gender
}

export type ProfileApiResponse = ApiResponse<ProfileResponse>
