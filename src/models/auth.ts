/** Role identifiers used in the normalized frontend model. */
export const roles = [
  'CUSTOMER',
  'FACILITY_STAFF',
  'FACILITY_MANAGER',
  'BUSINESS_OPS_MANAGER',
  'SYSTEM_ADMIN',
] as const

export type Role = (typeof roles)[number]

/** Role values currently emitted by the backend (single role per user). */
export const rawBackendRoles = [
  'customer',
  'facility_staff',
  'facility_manager',
  'business_ops_manager',
  'system_admin',
] as const

export type RawBackendRole = (typeof rawBackendRoles)[number]

/** Explicit adapter from the backend's lowercase value to the FE role name. */
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

/** Reserved for permissions supplied by the backend when RBAC is implemented. */
export type Permission = string

export interface AuthUser {
  id: string
  email: string
  name?: string
  roles: Role[]
  permissions: Permission[]
  assignedFacilityId?: string | null
}
