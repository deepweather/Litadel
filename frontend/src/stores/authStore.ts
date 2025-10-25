import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  apiKey: string | null
  apiUrl: string
  setApiKey: (key: string) => void
  clearApiKey: () => void
  setApiUrl: (url: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      apiKey: null,
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8002',
      setApiKey: (key: string) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: null }),
      setApiUrl: (url: string) => set({ apiUrl: url }),
    }),
    {
      name: 'trading-agents-auth',
    }
  )
)
