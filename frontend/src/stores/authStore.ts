import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AuthMethod = 'jwt' | 'apikey' | null

interface AuthState {
  // API Key auth
  apiKey: string | null

  // JWT auth
  jwtToken: string | null
  username: string | null

  // Common
  apiUrl: string
  authMethod: AuthMethod

  // Actions
  setApiKey: (key: string) => void
  setJwtToken: (token: string, username: string) => void
  clearAuth: () => void
  setApiUrl: (url: string) => void

  // Deprecated (for backward compatibility)
  clearApiKey: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // State
      apiKey: null,
      jwtToken: null,
      username: null,
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8002',
      authMethod: null,

      // Actions
      setApiKey: (key: string) =>
        set({
          apiKey: key,
          authMethod: 'apikey',
          jwtToken: null,
          username: null,
        }),

      setJwtToken: (token: string, username: string) =>
        set({
          jwtToken: token,
          username,
          authMethod: 'jwt',
          apiKey: null,
        }),

      clearAuth: () =>
        set({
          apiKey: null,
          jwtToken: null,
          username: null,
          authMethod: null,
        }),

      setApiUrl: (url: string) => set({ apiUrl: url }),

      // Deprecated - redirects to clearAuth
      clearApiKey: () =>
        set({
          apiKey: null,
          jwtToken: null,
          username: null,
          authMethod: null,
        }),
    }),
    {
      name: 'trading-agents-auth',
    }
  )
)
