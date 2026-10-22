import type { Role } from '@/models/auth'

export const roleHome: Record<Role, string> = {
  CUSTOMER: '/account',
  SYSTEM_ADMIN: '/portal/admin',
  BUSINESS_OPS_MANAGER: '/portal/ops',
  FACILITY_MANAGER: '/portal/manager',
  FACILITY_STAFF: '/portal/staff',
}

export const internalRoles: Role[] = [
  'SYSTEM_ADMIN',
  'BUSINESS_OPS_MANAGER',
  'FACILITY_MANAGER',
  'FACILITY_STAFF',
]
