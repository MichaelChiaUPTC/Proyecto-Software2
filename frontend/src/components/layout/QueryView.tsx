import type { ReactNode } from 'react'
import type { QueryState } from '@/hooks/useQuery'
import { ErrorState } from '@/components/ui/EmptyState'
import { PageSkeleton } from '@/components/ui/Skeleton'

/** Resuelve los tres estados de una consulta: cargando (skeleton), error y datos. */
export function QueryView<T>({ query, rows, children }: { query: QueryState<T>; rows?: number; children: (data: T) => ReactNode }) {
  if (query.error) return <ErrorState message={query.error} />
  if (!query.data) return <PageSkeleton rows={rows} />
  return <>{children(query.data)}</>
}
