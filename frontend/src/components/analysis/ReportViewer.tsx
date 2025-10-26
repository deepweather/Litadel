import React from 'react'
import type { AnalysisReport } from '../../types/api'
import { ReportCard } from './ReportCard'
import { categorizeReportsByType } from '@/config/reportTypes'

interface ReportViewerProps {
  reports: AnalysisReport[]
  defaultExpandFirst?: boolean
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ reports, defaultExpandFirst = false }) => {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground font-mono">
        No reports available yet
      </div>
    )
  }

  // Order reports by importance (decision reports first, then by category)
  const sortedReports = [...reports].sort((a, b) => {
    const aCat = categorizeReportsByType(a.report_type)
    const bCat = categorizeReportsByType(b.report_type)

    // Priority order
    const catOrder: Record<string, number> = {
      decision: 1,
      investment: 2,
      market: 3,
      sentiment: 4,
      risk: 5,
      other: 6,
    }

    return (catOrder[aCat] || 99) - (catOrder[bCat] || 99)
  })

  return (
    <div className="space-y-4">
      {sortedReports.map((report, idx) => {
        const key = report.id || `${report.analysis_id}-${report.report_type}-${idx}`
        return (
          <ReportCard
            key={key}
            report={report}
            defaultExpanded={defaultExpandFirst && idx === 0}
          />
        )
      })}
    </div>
  )
}