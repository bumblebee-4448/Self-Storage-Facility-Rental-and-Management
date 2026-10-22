export type QueryFilters = Readonly<
  Record<string, string | number | boolean | null | undefined>
>

/** Namespaced query keys include facility and filters to prevent accidental cache collisions. */
export function entityQueryKeys(entity: string) {
  const root = ['private', entity] as const

  return {
    all: root,
    lists: () => [...root, 'list'] as const,
    list: (filters: QueryFilters = {}, facilityId?: string | null) =>
      [...root, 'list', { facilityId: facilityId ?? null, filters }] as const,
    details: () => [...root, 'detail'] as const,
    detail: (id: string, facilityId?: string | null) =>
      [...root, 'detail', { facilityId: facilityId ?? null, id }] as const,
  }
}
