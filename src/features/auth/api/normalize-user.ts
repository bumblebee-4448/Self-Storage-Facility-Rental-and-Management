import { z } from 'zod'
import { normalizeBackendRole } from '@/features/auth/types/auth'
import type { AuthUser } from '@/features/auth/types/auth'
import type { BackendAuthUser } from '@/features/auth/types/backend'

const backendUserSchema = z.object({
  id: z.string().trim().min(1).optional(),
  _id: z.string().trim().min(1).optional(),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.string().min(1),
  assignedFacilityId: z.string().trim().min(1).nullable().optional(),
})

export class UserNormalizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserNormalizationError'
  }
}

export function normalizeBackendUser(input: BackendAuthUser): AuthUser {
  const parsed = backendUserSchema.safeParse(input)
  if (!parsed.success) {
    throw new UserNormalizationError('Backend user response is invalid.')
  }

  const id = parsed.data.id ?? parsed.data._id
  if (!id) {
    throw new UserNormalizationError(
      'Backend user response is missing an identifier.',
    )
  }

  const role = normalizeBackendRole(parsed.data.role)
  if (!role) {
    throw new UserNormalizationError(
      'Backend user response contains an unknown role.',
    )
  }

  return {
    id,
    email: parsed.data.email,
    ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
    roles: [role],
    permissions: [],
    ...(parsed.data.assignedFacilityId !== undefined
      ? { assignedFacilityId: parsed.data.assignedFacilityId }
      : {}),
  }
}
