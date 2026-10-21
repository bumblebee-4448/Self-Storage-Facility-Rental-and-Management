import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface LoginRedirectState {
  message: string
}

interface VisibleLoginNotice extends LoginRedirectState {
  locationKey: string
}

function readLoginRedirectState(value: unknown): LoginRedirectState | null {
  if (typeof value !== 'object' || value === null || !('loginNotice' in value))
    return null
  const notice = value.loginNotice
  if (
    typeof notice !== 'object' ||
    notice === null ||
    !('message' in notice) ||
    typeof notice.message !== 'string'
  ) {
    return null
  }
  return { message: notice.message }
}

export function LoginRedirectNotice() {
  const location = useLocation()
  const navigate = useNavigate()
  const [notice] = useState<VisibleLoginNotice | null>(() => {
    const initialNotice = readLoginRedirectState(location.state)
    return initialNotice
      ? { ...initialNotice, locationKey: location.key }
      : null
  })

  useEffect(() => {
    const routeNotice = readLoginRedirectState(location.state)
    if (
      notice &&
      notice.locationKey === location.key &&
      routeNotice?.message === notice.message
    ) {
      navigate(`${location.pathname}${location.search}${location.hash}`, {
        replace: true,
        state: null,
      })
    }
  }, [location, navigate, notice])

  if (!notice) return null

  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-[#cddbcf] bg-[#edf3ed] px-4 py-3 text-sm leading-6 text-[#244431]"
    >
      {notice.message}
    </div>
  )
}
