import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

type CacheRow = {
  Date: string
  Close?: number
  High?: number
  Low?: number
  Open?: number
  Volume?: number
}

type CacheResponse = {
  ticker: string
  date_range: { start: string; end: string }
  data: CacheRow[]
}

export const useMarketData = (ticker?: string | null) => {
  return useQuery<CacheResponse>({
    queryKey: ['market-data', ticker],
    enabled: !!ticker,
    queryFn: async () => {
      const res = await api['client'].get<CacheResponse>(`/api/v1/data/cache/${ticker}`)
      return res.data
    },
    staleTime: 60_000,
  })
}
