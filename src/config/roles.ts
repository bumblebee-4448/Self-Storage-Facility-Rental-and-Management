import type { Role } from '@/models/auth'

export const roleHome: Record<Role, string> = {
  CUSTOMER: '/account',
  SYSTEM_ADMIN: '/portal/admin/users',
  BUSINESS_OPS_MANAGER: '/portal/ops/facilities',
  FACILITY_MANAGER: '/portal/manager/storage-units',
  FACILITY_STAFF: '/portal/staff/contracts',
}

export const internalRoles: Role[] = [
  'SYSTEM_ADMIN',
  'BUSINESS_OPS_MANAGER',
  'FACILITY_MANAGER',
  'FACILITY_STAFF',
]
