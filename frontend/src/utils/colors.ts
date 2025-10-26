/**
 * Color utilities for the Trading Agents application
 *
 * This file now imports from the centralized design system theme.
 * Direct color constants are kept for backward compatibility during migration.
 */
import { colors as themeColorConstants, getDecisionColor as themeDecisionColor, getPnLColor as themePnLColor } from '../design-system/theme'

// Terminal color scheme - kept for backward compatibility
export const colors = {
  bg: themeColorConstants.bgPrimary,
  fg: themeColorConstants.success,
  accent: themeColorConstants.accent,
  warning: themeColorConstants.warning,
  error: themeColorConstants.danger,
  dim: themeColorConstants.dim,
  highlight: themeColorConstants.bgSecondary,
  border: themeColorConstants.border,
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
  primary: themeColorConstants.primary,
  accent: themeColorConstants.accent,
  success: themeColorConstants.success,
  error: themeColorConstants.danger,
  warning: themeColorConstants.warning,
  muted: themeColorConstants.dim,
  mutedText: themeColorConstants.subdued,
  background: themeColorConstants.bgPrimary,
  backgroundAlt: themeColorConstants.bgSecondary,
  border: themeColorConstants.border,
  borderSolid: themeColorConstants.borderBright,
}

// Utility functions - now imported from theme
export const getDecisionColor = themeDecisionColor
export const getPnLColor = themePnLColor
