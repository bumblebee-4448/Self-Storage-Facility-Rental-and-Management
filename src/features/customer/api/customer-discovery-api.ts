import { z } from 'zod'
import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  Facility,
  FacilityPublicDetail,
  PaginatedData,
  StorageUnit,
  UnitTypeOffering,
} from './types'

function unwrap<T>(value: unknown): T {
  const result = z
    .object({ success: z.literal(true), data: z.unknown() })
    .safeParse(value)
  if (!result.success) throw new Error('Phản hồi từ máy chủ không hợp lệ.')
  return result.data.data as T
}

export interface FacilityQuery {
  page?: number
  limit?: number
  search?: string
  city?: string
  sortBy?: 'name' | 'city' | 'status' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export async function getFacilities(query: FacilityQuery = {}) {
  const response = await apiClient.get<ApiResponse<PaginatedData<Facility>>>(
    '/facilities',
    { params: query },
  )
  return unwrap<PaginatedData<Facility>>(response.data)
}

export async function getFacilitiesByAmenity(
  query: FacilityQuery & { amenityIds: string; matchAll?: boolean },
) {
  const response = await apiClient.get<
    ApiResponse<PaginatedData<Facility>>
  >('/facilities/search-by-amenity', { params: query })
  return unwrap<PaginatedData<Facility>>(response.data)
}

export async function getFacilityDetail(id: string) {
  const response = await apiClient.get<ApiResponse<FacilityPublicDetail>>(
    `/facilities/${encodeURIComponent(id)}/public-detail`,
  )
  return unwrap<FacilityPublicDetail>(response.data)
}

export async function getFacilityOfferings(facilityId: string) {
  const response = await apiClient.get<
    ApiResponse<PaginatedData<UnitTypeOffering>>
  >('/facility-unit-type-offerings', {
    params: { facilityId, status: 'active', limit: 100, page: 1 },
  })
  return unwrap<PaginatedData<UnitTypeOffering>>(response.data)
}

export async function getAvailableUnits(
  facilityId: string,
  query: { unitTypeId?: string; floor?: number; zone?: string } = {},
) {
  const response = await apiClient.get<ApiResponse<StorageUnit[]>>(
    `/storage-units/facility/${encodeURIComponent(facilityId)}/available`,
    { params: query },
  )
  return unwrap<StorageUnit[]>(response.data)
}

export function publicApiError(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response
    if (response?.status === 404) return 'Không tìm thấy cơ sở này.'
    if (response?.status === 400) return 'Thông tin tìm kiếm chưa hợp lệ.'
    if (response?.status === 401) return 'Vui lòng đăng nhập để tiếp tục.'
    if (response?.status === 403) return 'Bạn chưa được phép xem thông tin này.'
    if (response?.status && response.status >= 500)
      return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: string }).code
    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT')
      return 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.'
  }
  return 'Không thể kết nối máy chủ. Kiểm tra kết nối và thử lại.'
}

