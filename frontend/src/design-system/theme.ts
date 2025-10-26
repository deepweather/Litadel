/**
 * Design System Theme Constants
 *
 * These constants match the Tailwind CSS theme defined in src/styles/terminal.css
 * Use these for programmatic color/spacing access when Tailwind classes aren't sufficient
 */

// @deprecated - Use Tailwind color classes instead
// e.g., text-primary, bg-primary, border-primary, text-destructive, bg-destructive
export const colors = {
  // Use Tailwind: text-primary, bg-primary, border-primary
  primary: 'hsl(var(--primary))',
  accent: 'hsl(var(--accent))',
  success: 'hsl(var(--success))',
  danger: 'hsl(var(--destructive))',
  warning: 'hsl(var(--warning))',

  // Use Tailwind: text-muted-foreground, border
  dim: 'hsl(var(--border))',
  subdued: 'hsl(var(--muted-foreground))',

  // Use Tailwind: bg-background, bg-secondary, bg-muted
  bgPrimary: 'hsl(var(--background))',
  bgSecondary: 'hsl(var(--secondary))',
  bgHover: 'hsl(var(--accent))',
  bgHighlight: 'hsl(var(--muted))',

  // Use Tailwind: border, border-primary
  border: 'hsl(var(--border))',
  borderBright: 'hsl(var(--primary))',

  // Use Tailwind: text-foreground, bg-background
  white: 'hsl(var(--foreground))',
  black: 'hsl(var(--background))',
} as const

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  base: '1rem',    // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',   // 48px
} as const

export const fontSize = {
  xs: '0.7rem',     // 11.2px
  sm: '0.75rem',    // 12px
  base: '0.875rem', // 14px
  md: '1rem',       // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
} as const

export const fontFamily = {
  mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
} as const

export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  md: '0.25rem',
  lg: '0.5rem',
} as const

export const transitions = {
  fast: '0.1s',
  normal: '0.2s',
  slow: '0.3s',
} as const

// Utility functions for consistent styling
// @deprecated - Use Tailwind classes instead: text-green-600, text-red-600, etc.
export const getPnLColor = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return colors.dim
  return value >= 0 ? colors.success : colors.danger
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return colors.success
    case 'running':
      return colors.accent
    case 'failed':
      return colors.danger
    case 'pending':
      return colors.warning
    default:
      return colors.primary
  }
}

export const getDecisionColor = (decision: string): string => {
  switch (decision) {
    case 'BUY':
      return colors.success
    case 'SELL':
      return colors.danger
    case 'HOLD':
      return colors.warning
    default:
      return colors.primary
  }
}

