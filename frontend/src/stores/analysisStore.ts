import { create } from 'zustand'
import type { Analysis } from '../types/api'

interface AnalysisState {
  activeAnalyses: Map<string, Analysis>
  addAnalysis: (analysis: Analysis) => void
  updateAnalysis: (id: string, updates: Partial<Analysis>) => void
  removeAnalysis: (id: string) => void
  getAnalysis: (id: string) => Analysis | undefined
  clearAnalyses: () => void
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  activeAnalyses: new Map(),

  addAnalysis: (analysis: Analysis) => {
    set((state) => {
      const newMap = new Map(state.activeAnalyses)
      newMap.set(analysis.id, analysis)
      return { activeAnalyses: newMap }
    })
  },

  updateAnalysis: (id: string, updates: Partial<Analysis>) => {
    set((state) => {
      const newMap = new Map(state.activeAnalyses)
      const existing = newMap.get(id)
      if (existing) {
        newMap.set(id, { ...existing, ...updates })
      }
      return { activeAnalyses: newMap }
    })
  },

  removeAnalysis: (id: string) => {
    set((state) => {
      const newMap = new Map(state.activeAnalyses)
      newMap.delete(id)
      return { activeAnalyses: newMap }
    })
  },

  getAnalysis: (id: string) => {
    return get().activeAnalyses.get(id)
  },

  clearAnalyses: () => {
    set({ activeAnalyses: new Map() })
  },
}))
