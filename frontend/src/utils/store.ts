import { useSyncExternalStore } from 'react'

/** Store mínimo con persistencia opcional en localStorage. Sustituible por un cliente de API. */
export interface Store<T> {
  get: () => T
  set: (updater: (prev: T) => T) => void
  reset: () => void
  subscribe: (fn: () => void) => () => void
}

export function createStore<T>(key: string, init: () => T): Store<T> {
  const listeners = new Set<() => void>()
  let state: T
  try {
    const raw = localStorage.getItem(key)
    state = raw ? (JSON.parse(raw) as T) : init()
  } catch {
    state = init()
  }
  const persist = () => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* almacenamiento no disponible */
    }
  }
  persist()
  return {
    get: () => state,
    set: (updater) => {
      state = updater(state)
      persist()
      listeners.forEach((l) => l())
    },
    reset: () => {
      state = init()
      persist()
      listeners.forEach((l) => l())
    },
    subscribe: (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get)
}
