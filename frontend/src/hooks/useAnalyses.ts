import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import type { CreateAnalysisRequest } from '../types/api'
import { useAnalysisStore } from '../stores/analysisStore'

export const useAnalyses = (page = 1, pageSize = 50) => {
  return useQuery({
    queryKey: ['analyses', page, pageSize],
    queryFn: () => api.getAnalyses(page, pageSize),
    refetchInterval: (query) => {
      // Only poll if there are running analyses
      const data = query.state.data
      const hasRunningAnalyses = data?.items?.some(
        (a: any) => a.status === 'running' || a.status === 'pending'
      )
      return hasRunningAnalyses ? 10000 : false // Poll every 10 seconds only if needed
    },
    staleTime: 5000,
  })
}

export const useAnalysis = (id: string | null) => {
  return useQuery({
    queryKey: ['analysis', id],
    queryFn: () => api.getAnalysis(id!),
    enabled: !!id,
    // No polling - WebSocket provides real-time updates
    // If WebSocket fails, React Query's automatic retries handle it
    refetchInterval: false,
  })
}

export const useAnalysisStatus = (id: string | null) => {
  return useQuery({
    queryKey: ['analysis-status', id],
    queryFn: () => api.getAnalysisStatus(id!),
    enabled: !!id,
    // No polling - WebSocket provides real-time status updates
    refetchInterval: false,
  })
}

export const useAnalysisReports = (id: string | null) => {
  return useQuery({
    queryKey: ['analysis-reports', id],
    queryFn: () => api.getAnalysisReports(id!),
    enabled: !!id,
  })
}

export const useAnalysisLogs = (id: string | null) => {
  return useQuery({
    queryKey: ['analysis-logs', id],
    queryFn: () => api.getAnalysisLogs(id!),
    enabled: !!id,
    // No polling - WebSocket invalidates this query when new logs arrive
    refetchInterval: false,
  })
}

export const useCreateAnalysis = () => {
  const queryClient = useQueryClient()
  const addAnalysis = useAnalysisStore((state) => state.addAnalysis)

  return useMutation({
    mutationFn: (data: CreateAnalysisRequest) => api.createAnalysis(data),
    onSuccess: (data) => {
      // Invalidate and refetch analyses list
      queryClient.invalidateQueries({ queryKey: ['analyses'] })
      // Add to active analyses store
      addAnalysis(data)
    },
  })
}

export const useDeleteAnalysis = () => {
  const queryClient = useQueryClient()
  const removeAnalysis = useAnalysisStore((state) => state.removeAnalysis)

  return useMutation({
    mutationFn: (id: string) => api.deleteAnalysis(id),
    onSuccess: (_, id) => {
      // Invalidate and refetch analyses list
      queryClient.invalidateQueries({ queryKey: ['analyses'] })
      // Remove from active analyses store
      removeAnalysis(id)
    },
  })
}
