/**
 * Color utility functions that return Tailwind class names
 * for consistent styling across the application
 */

/**
 * Get Tailwind color classes for P&L (Profit & Loss) values
 * @param value - The P&L value (positive for profit, negative for loss)
 * @returns Tailwind class names for text color
 */
export const getPnLColorClass = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'text-muted-foreground'
  return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
}

/**
 * Get Tailwind color classes for trading decisions
 * @param decision - The trading decision (BUY, SELL, HOLD)
 * @returns Tailwind class names for text and border colors
 */
export const getDecisionColorClass = (decision: string): string => {
  switch (decision?.toUpperCase()) {
    case 'BUY':
      return 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400'
    case 'SELL':
      return 'text-red-600 dark:text-red-400 border-red-600 dark:border-red-400'
    case 'HOLD':
      return 'text-yellow-600 dark:text-yellow-400 border-yellow-600 dark:border-yellow-400'
    default:
      return 'text-primary border-primary'
  }
}

/**
 * Get Tailwind color classes for status badges
 * @param status - The status value (completed, running, failed, pending)
 * @returns Tailwind class names for text and border colors
 */
export const getStatusColorClass = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 bg-green-500/10'
    case 'running':
      return 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-blue-500/10'
    case 'failed':
      return 'text-destructive border-destructive bg-destructive/10'
    case 'pending':
      return 'text-yellow-600 dark:text-yellow-400 border-yellow-600 dark:border-yellow-400 bg-yellow-500/10'
    default:
      return 'text-primary border-primary'
  }
}

/**
 * Get background color class for P&L values
 * @param value - The P&L value
 * @returns Tailwind class name for background color
 */
export const getPnLBgClass = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'bg-muted'
  return value >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
}

/**
 * Get border color class for P&L values
 * @param value - The P&L value
 * @returns Tailwind class name for border color
 */
export const getPnLBorderClass = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'border-muted'
  return value >= 0 ? 'border-green-600 dark:border-green-400' : 'border-red-600 dark:border-red-400'
}

