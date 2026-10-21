import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth-store'

interface AuthSessionInitializerProps {
  children: ReactNode
}

export function AuthSessionInitializer({
  children,
}: AuthSessionInitializerProps) {
  const bootstrapSession = useAuthStore((state) => state.bootstrapSession)

  useEffect(() => {
    void bootstrapSession()
  }, [bootstrapSession])

  return children
}
