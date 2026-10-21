export interface Pagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedData<T> {
  items: T[]
  pagination: Pagination
}

export interface Facility {
  id: string
  name: string
  address: string
  city: string
  phone?: string | null
  email?: string | null
  description?: string | null
  status: string
  images: string[]
  operatingHours?: { open: string; close: string } | null
}

export interface UnitType {
  id: string
  name: string
  category?: string | null
  dimensions: { length: number; width: number; height: number }
  area: number
  volume: number
  description?: string | null
  status: string
}

export interface UnitTypeOffering {
  id: string
  facilityId: string
  unitTypeId: string
  unitType: UnitType
  pricePerUnit: number
  depositMultiplier: number
  billingUnit: 'day' | 'month' | 'one_time'
  minRentalDays: number
  status: string
  availableUnitsCount: number
}

export interface AmenityOffering {
  id: string
  facilityId: string
  amenityId: string
  amenity: {
    id: string
    name: string
    description?: string | null
    type: 'physical' | 'service'
    images?: string[] | null
  }
  pricePerUnit: number
  billingUnit: 'day' | 'month' | 'one_time'
  availableQuantity?: number | null
}

export interface FacilityPublicDetail {
  facility: Facility
  unitTypeOfferings: UnitTypeOffering[]
  amenityOfferings: AmenityOffering[]
}

export interface StorageUnit {
  id: string
  facilityId: string
  unitTypeId: string
  unitNumber: string
  floor: number
  zone?: string | null
  status: string
  images: string[]
  unitType?: UnitType | null
}

