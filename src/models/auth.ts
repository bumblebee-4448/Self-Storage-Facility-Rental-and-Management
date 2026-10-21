/** Role identifiers used in the normalized frontend model. */
export const roles = [
  'CUSTOMER',
  'FACILITY_STAFF',
  'FACILITY_MANAGER',
  'BUSINESS_OPS_MANAGER',
  'SYSTEM_ADMIN',
] as const
export type Role = (typeof roles)[number]

/** Exact lowercase role values emitted by the backend. */
export const rawBackendRoles = [
  'customer',
  'facility_staff',
  'facility_manager',
  'business_ops_manager',
  'system_admin',
] as const
export type RawBackendRole = (typeof rawBackendRoles)[number]

export const backendRoleToRole: Record<RawBackendRole, Role> = {
  customer: 'CUSTOMER',
  facility_staff: 'FACILITY_STAFF',
  facility_manager: 'FACILITY_MANAGER',
  business_ops_manager: 'BUSINESS_OPS_MANAGER',
  system_admin: 'SYSTEM_ADMIN',
}

export function normalizeBackendRole(role: string): Role | null {
  if (!Object.hasOwn(backendRoleToRole, role)) return null
  return backendRoleToRole[role as RawBackendRole]
}

export type Permission = string
export interface AuthUser {
  id: string
  email: string
  name?: string
  phoneNumber?: string
  roles: Role[]
  permissions: Permission[]
  assignedFacilityId?: string | null
}
