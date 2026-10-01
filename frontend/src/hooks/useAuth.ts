import { api } from '@/services/api'
import { sessionStore } from '@/services/stores'
import { useStore } from '@/utils/store'

export function useAuth() {
  const { user } = useStore(sessionStore)
  return {
    user,
    login: api.auth.login,
    logout: api.auth.logout,
  }
}
