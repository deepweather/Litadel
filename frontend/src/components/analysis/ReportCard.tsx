import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { getReportConfig } from '@/config/reportTypes'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { MarkdownViewer } from './MarkdownViewer'
import type { AnalysisReport } from '../../types/api'

interface ReportCardProps {
  report: AnalysisReport
  defaultExpanded?: boolean
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const config = getReportConfig(report.report_type)
  const Icon = config.icon

  const handleCopy = () => {
    navigator.clipboard.writeText(report.content || '')
    toast.success(`${config.label} copied to clipboard`)
  }

  const handleDownload = () => {
    const blob = new Blob([report.content || ''], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.report_type}_${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${config.label} downloaded`)
  }

  // Smart content preview - get first few meaningful lines
  const getPreview = (content: string, maxLines: number = 4): string => {
    const lines = content.split('\n').filter((line) => {
      const trimmed = line.trim()
      // Skip empty lines, dividers, and very short lines
      return trimmed.length > 0 && !trimmed.match(/^[=\-_*]{3,}$/) && trimmed.length > 10
    })

    const previewLines = lines.slice(0, maxLines)
    const preview = previewLines.join('\n')

    return preview.length > 300 ? preview.substring(0, 300) + '...' : preview
  }

  const preview = getPreview(report.content || '')
  const hasContent = (report.content || '').trim().length > 0
  const isLongContent = (report.content || '').length > 500

  return (
    <Card className={cn('transition-all hover:shadow-md', config.category === 'decision' && 'border-primary')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Icon className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold font-mono">{config.label}</CardTitle>
              {config.description && (
                <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
              )}
            </div>
            <Badge variant={config.variant} className="font-mono text-xs shrink-0">
              {config.category.toUpperCase()}
            </Badge>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              title="Copy to clipboard"
              className="h-8 w-8"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDownload}
              title="Download report"
              className="h-8 w-8"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {hasContent ? (
          <>
            {/* Preview */}
            <div className="mb-3 border-l-2 border-muted pl-3">
              <MarkdownViewer content={preview} />
            </div>

            {/* Full Content (Collapsible) */}
            {isLongContent && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full font-mono text-xs">
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5 mr-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5 mr-2" />
                        Read Full Report
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="border-t border-border pt-4">
                    <div className="max-h-[600px] overflow-auto p-4 bg-muted/30 rounded-md">
                      <MarkdownViewer content={report.content || ''} />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Short content - show all */}
            {!isLongContent && preview !== report.content && (
              <div className="p-4 bg-muted/30 rounded-md">
                <MarkdownViewer content={report.content || ''} />
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground italic">No content available</p>
        )}
      </CardContent>
    </Card>
  )
}

