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
