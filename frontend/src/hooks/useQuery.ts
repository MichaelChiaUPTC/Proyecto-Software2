import { useEffect, useRef, useState } from 'react'
import { catalogStore, progressStore } from '@/services/stores'
import { useStore } from '@/utils/store'

export interface QueryState<T> {
  data?: T
  loading: boolean
  error?: string
}

/**
 * Ejecuta una función de servicio y la repite cuando cambia el estado local
 * (equivalente a invalidar caché cuando exista un backend real).
 * Mantiene los datos anteriores al recargar con la misma clave, para evitar parpadeos.
 */
export function useQuery<T>(fn: () => Promise<T>, deps: (string | number | undefined)[] = []): QueryState<T> {
  const catalog = useStore(catalogStore)
  const progress = useStore(progressStore)
  const key = deps.join('|')
  const [state, setState] = useState<QueryState<T> & { key: string }>({ loading: true, key })
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let alive = true
    fnRef.current()
      .then((data) => alive && setState({ data, loading: false, key }))
      .catch((e: Error) => alive && setState({ loading: false, error: e.message, key }))
    return () => {
      alive = false
    }
  }, [catalog, progress, key])

  if (state.key !== key) return { loading: true }
  return { data: state.data, loading: state.loading, error: state.error }
}
