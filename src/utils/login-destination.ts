import type { Role } from '@/models/auth'

export type LoginEntryPoint = 'customer' | 'internal'

export interface LoginDestination {
  path: string
  label: string
  entryPoint: LoginEntryPoint
}

const destinationByRole: Record<Role, LoginDestination> = {
  CUSTOMER: {
    path: '/account',
    label: 'khu vực khách hàng',
    entryPoint: 'customer',
  },
  SYSTEM_ADMIN: {
    path: '/portal/admin',
    label: 'khu vực quản trị hệ thống',
    entryPoint: 'internal',
  },
  BUSINESS_OPS_MANAGER: {
    path: '/portal/ops',
    label: 'khu vực vận hành doanh nghiệp',
    entryPoint: 'internal',
  },
  FACILITY_MANAGER: {
    path: '/portal/manager',
    label: 'khu vực quản lý cơ sở',
    entryPoint: 'internal',
  },
  FACILITY_STAFF: {
    path: '/portal/staff',
    label: 'khu vực nhân viên cơ sở',
    entryPoint: 'internal',
  },
}

/**
 * The current backend returns one role per account. Ambiguous or invalid role
 * data fails closed until the backend provides a workspace-selection contract.
 */
export function getLoginDestination(
  roles: readonly Role[],
): LoginDestination | null {
  if (roles.length !== 1) return null
  const role = roles[0]
  if (!role || !Object.hasOwn(destinationByRole, role)) return null
  return destinationByRole[role]
}
