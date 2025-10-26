import { useEffect, useState } from 'react'
import type { AnalystType } from '../types/analysis'

interface AnalysisDefaults {
  selectedAnalysts: AnalystType[]
  researchDepth: number
}

const STORAGE_KEY = 'analysis_defaults'

export const useAnalysisDefaults = () => {
  const [defaults, setDefaults] = useState<AnalysisDefaults | null>(null)

  // Load defaults from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AnalysisDefaults
        setDefaults(parsed)
      } catch (e) {
        console.error('Failed to parse analysis defaults:', e)
      }
    }
  }, [])

  // Save defaults to localStorage
  const saveDefaults = (newDefaults: AnalysisDefaults) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDefaults))
      setDefaults(newDefaults)
    } catch (e) {
      console.error('Failed to save analysis defaults:', e)
    }
  }

  // Clear defaults
  const clearDefaults = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setDefaults(null)
    } catch (e) {
      console.error('Failed to clear analysis defaults:', e)
    }
  }

  return {
    defaults,
    saveDefaults,
    clearDefaults,
    hasDefaults: defaults !== null,
  }
}

