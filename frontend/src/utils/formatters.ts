// Data formatting utilities

// Parse timestamps coming from the server. If the string has no timezone info,
// assume it's UTC and normalize to an ISO string with 'Z' to avoid UTC/local drift.
export const parseServerDate = (value: string | Date): Date => {
  if (value instanceof Date) return value
  if (!value) return new Date(NaN)

  // Already ISO with timezone
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) {
    return new Date(value)
  }

  // Normalize common formats ("YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss") to UTC
  const normalized = value.replace(' ', 'T')
  return new Date(`${normalized}Z`)
}

export const formatDate = (dateString: string): string => {
  const date = parseServerDate(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export const formatTime = (dateString: string): string => {
  const date = parseServerDate(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export const formatDateTime = (dateString: string): string => {
  return `${formatDate(dateString)} ${formatTime(dateString)}`
}

export const formatDuration = (start: string | Date, end?: string | Date): string => {
  const startDate = typeof start === 'string' ? parseServerDate(start) : start
  const endDate = end ? (typeof end === 'string' ? parseServerDate(end) : end) : new Date()
  const diff = endDate.getTime() - startDate.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) {
    return str
  }
  return str.slice(0, maxLength - 3) + '...'
}

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const formatAnalystName = (analyst: string): string => {
  return analyst
    .split('_')
    .map((word) => capitalize(word))
    .join(' ')
}

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    completed: 'text-terminal-fg',
    running: 'text-terminal-accent',
    pending: 'text-terminal-dim',
    failed: 'text-terminal-error',
    warning: 'text-terminal-warning',
  }
  return colors[status] || 'text-terminal-fg'
}

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(0)}%`
}

export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals)
}

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export const formatCurrencyCompact = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatPercentageWithSign = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'N/A'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export const formatDateShort = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
