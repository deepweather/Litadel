import { useLocation, useParams } from 'react-router-dom'
import { useMemo } from 'react'

export interface BreadcrumbItem {
  label: string
  href?: string
  isCurrentPage?: boolean
}

export const useBreadcrumbs = (): BreadcrumbItem[] => {
  const location = useLocation()
  const params = useParams()

  return useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/' }
    ]

    // Root path
    if (pathSegments.length === 0) {
      breadcrumbs[0].isCurrentPage = true
      return breadcrumbs
    }

    // Build breadcrumbs based on path
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]
      const isLast = i === pathSegments.length - 1

      switch (segment) {
        case 'analyses':
          breadcrumbs.push({
            label: 'Deep Dives',
            href: isLast ? undefined : '/analyses',
            isCurrentPage: isLast && !pathSegments[i + 1]
          })
          break

        case 'create':
          if (pathSegments[i - 1] === 'analyses') {
            breadcrumbs.push({
              label: 'New Analysis',
              isCurrentPage: true
            })
          } else if (pathSegments[i - 1] === 'backtests') {
            breadcrumbs.push({
              label: 'New Backtest',
              isCurrentPage: true
            })
          } else if (pathSegments[i - 1] === 'portfolio') {
            breadcrumbs.push({
              label: 'New Portfolio',
              isCurrentPage: true
            })
          }
          break

        case 'backtests':
          if (pathSegments[i + 1] === 'chat') {
            breadcrumbs.push({
              label: 'Chat',
              isCurrentPage: true
            })
          } else {
            breadcrumbs.push({
              label: 'Strategies',
              href: isLast ? undefined : '/backtests',
              isCurrentPage: isLast
            })
          }
          break

        case 'chat':
          // Skip, handled in backtests case
          break

        case 'portfolio':
          breadcrumbs.push({
            label: 'Portfolio',
            href: isLast ? undefined : '/portfolio',
            isCurrentPage: isLast
          })
          break

        case 'settings':
          breadcrumbs.push({
            label: 'Settings',
            isCurrentPage: true
          })
          break

        case 'asset':
          breadcrumbs.push({
            label: 'Assets',
            href: isLast ? undefined : undefined
          })
          if (params.ticker) {
            breadcrumbs.push({
              label: params.ticker,
              isCurrentPage: true
            })
          }
          break

        default:
          // Handle dynamic IDs (UUID patterns or ticker symbols)
          if (params.id && segment === params.id) {
            const parentSegment = pathSegments[i - 1]
            if (parentSegment === 'analyses') {
              breadcrumbs.push({
                label: `Analysis ${segment.slice(0, 8)}`,
                isCurrentPage: true
              })
            } else if (parentSegment === 'backtests') {
              breadcrumbs.push({
                label: `Backtest ${segment.slice(0, 8)}`,
                isCurrentPage: true
              })
            } else if (parentSegment === 'portfolio') {
              breadcrumbs.push({
                label: `Portfolio ${segment.slice(0, 8)}`,
                isCurrentPage: true
              })
            }
          } else if (params.ticker && segment === params.ticker) {
            breadcrumbs.push({
              label: params.ticker,
              isCurrentPage: true
            })
          }
      }
    }

    return breadcrumbs
  }, [location.pathname, params])
}

