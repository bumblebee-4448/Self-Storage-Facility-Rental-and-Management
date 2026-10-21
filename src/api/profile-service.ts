import { z } from 'zod'
import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { ProfileResponse, UpdateProfileRequest } from '@/models/profile'

function dataFromEnvelope<T>(value: unknown): T {
  const parsed = z
    .object({
      success: z.literal(true),
      statusCode: z.number(),
      messageCode: z.string(),
      message: z.string(),
      data: z.unknown(),
    })
    .safeParse(value)
  if (!parsed.success)
    throw new Error('Backend returned an invalid profile response.')
  return parsed.data.data as T
}

export async function getMyProfile(): Promise<ProfileResponse> {
  const response = await apiClient.get<unknown>('/profile/me', {
    authRefreshEligible: true,
  })
  return dataFromEnvelope<ProfileResponse>(response.data)
}

export async function updateMyProfile(
  payload: UpdateProfileRequest,
): Promise<ProfileResponse> {
  const response = await apiClient.patch<ApiResponse<ProfileResponse>>(
    '/profile/me',
    payload,
  )
  return dataFromEnvelope<ProfileResponse>(response.data)
}
