// Terminal color scheme

export const colors = {
  bg: '#0a0e14',
  fg: '#00ff00',
  accent: '#00ffff',
  warning: '#ffff00',
  error: '#ff0000',
  dim: '#2a3e4a',
  highlight: '#1a2a3a',
  border: '#00ff0050',
}

export const statusColors = {
  completed: colors.fg,
  running: colors.accent,
  pending: colors.dim,
  failed: colors.error,
  warning: colors.warning,
}

export const getStatusColorHex = (status: string): string => {
  return statusColors[status as keyof typeof statusColors] || colors.fg
}

export const tailwindColors = {
  completed: 'text-terminal-fg',
  running: 'text-terminal-accent',
  pending: 'text-terminal-dim',
  failed: 'text-terminal-error',
  warning: 'text-terminal-warning',
}

export const getTailwindColor = (status: string): string => {
  return tailwindColors[status as keyof typeof tailwindColors] || 'text-terminal-fg'
}

// Theme colors for consistent styling across the app
export const themeColors = {
  primary: '#4da6ff',
  accent: '#00d4ff',
  success: '#00ff00',
  error: '#ff4444',
  warning: '#ffaa00',
  muted: '#2a3e4a',
  mutedText: '#5a6e7a',
  background: '#0a0e14',
  backgroundAlt: '#1a2a3a',
  border: 'rgba(77, 166, 255, 0.3)',
  borderSolid: '#4da6ff',
}

export const getDecisionColor = (decision: string): string => {
  const d = decision.toUpperCase()
  if (d === 'BUY') return themeColors.success
  if (d === 'SELL') return themeColors.error
  return themeColors.warning
}

export const getPnLColor = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value === 0) return themeColors.muted
  return value > 0 ? themeColors.success : themeColors.error
}
