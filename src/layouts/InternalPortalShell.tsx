import { useLocation } from 'react-router-dom'
import { PortalLayout } from '@/layouts/PortalLayout'

const portalDefaultPaths: Record<string, string> = {
  '/portal/admin': '/portal/admin/users',
  '/portal/ops': '/portal/ops/facilities',
  '/portal/manager': '/portal/manager/storage-units',
  '/portal/staff': '/portal/staff/contracts',
}

export function InternalPortalShell() {
  const location = useLocation()
  const workspacePath =
    portalDefaultPaths[location.pathname] ?? location.pathname

  return (
    <PortalLayout key={`${workspacePath}${location.search}${location.hash}`} />
  )
}
