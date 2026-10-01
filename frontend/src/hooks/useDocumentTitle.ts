import { useEffect } from 'react'

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · Lógica UPTC` : 'Lógica UPTC'
  }, [title])
}
