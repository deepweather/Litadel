import React, { useEffect, useRef, useState } from 'react'
import type { AnalysisLog } from '../../types/api'
import { formatTime } from '../../utils/formatters'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface LogViewerProps {
  logs: AnalysisLog[]
  autoScroll?: boolean
  analysisStartTime?: string
}

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  autoScroll = true,
  analysisStartTime,
}) => {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const getRelativeTime = (timestamp: string) => {
    if (!analysisStartTime) return formatTime(timestamp)
    const start = new Date(analysisStartTime).getTime()
    const current = new Date(timestamp).getTime()
    const diff = Math.floor((current - start) / 1000)
    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60
    return `[+${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}]`
  }

  const getAgentTransitions = () => {
    const transitions: Array<{ index: number; from: string; to: string }> = []
    let lastAgent = ''
    logs.forEach((log, index) => {
      if (log.agent_name !== lastAgent && lastAgent !== '') {
        transitions.push({ index, from: lastAgent, to: log.agent_name })
      }
      lastAgent = log.agent_name
    })
    return transitions
  }

  const transitions = getAgentTransitions()

  const toggleExpanded = (logId: string) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }

  const getLogTypeVariant = (logType: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (logType) {
      case 'Tool Call':
        return 'default'
      case 'Reasoning':
        return 'secondary'
      case 'System':
        return 'outline'
      default:
        return 'outline'
    }
  }

  // Categorize logs by type
  const logsByType = {
    all: logs,
    toolCall: logs.filter(log => log.log_type === 'Tool Call'),
    reasoning: logs.filter(log => log.log_type === 'Reasoning'),
    system: logs.filter(log => log.log_type === 'System'),
  }

  if (logs.length === 0) {
    return <div className="text-center py-8 text-muted-foreground font-mono">No logs available yet</div>
  }

  const renderLogsList = (logsToRender: AnalysisLog[]) => (
    <div className="space-y-2">
      {logsToRender.map((log) => {
        const isExpanded = expandedLogs.has(log.id)
        const isLongContent = log.content.length > 150
        const displayContent =
          isExpanded || !isLongContent ? log.content : log.content.slice(0, 150) + '...'

        // Check if there's an agent transition before this log
        const transition = transitions.find((t) => {
          const originalIndex = logs.findIndex((l) => l.id === log.id)
          return t.index === originalIndex
        })

        return (
          <React.Fragment key={log.id}>
            {/* Agent Transition Separator */}
            {transition && (
              <Separator className="my-3" />
            )}
            {transition && (
              <div className="text-center text-xs font-mono text-muted-foreground py-1">
                ── {transition.from} → {transition.to} ──
              </div>
            )}

            <Card className="p-3">
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getLogTypeVariant(log.log_type)} className="font-mono text-xs">
                    {log.log_type.toUpperCase()}
                  </Badge>
                  <span className="text-xs font-mono text-primary">{log.agent_name}</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground shrink-0">
                  {getRelativeTime(log.timestamp)}
                </span>
              </div>
              <pre className="text-xs whitespace-pre-wrap font-mono text-foreground break-words">
                {displayContent}
              </pre>
              {isLongContent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(log.id)}
                  className="mt-2 h-auto py-1 px-2 text-xs"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show more
                    </>
                  )}
                </Button>
              )}
            </Card>
          </React.Fragment>
        )
      })}
      <div ref={logsEndRef} />
    </div>
  )

  return (
    <Tabs defaultValue="all" className="w-full">
      <div className="sticky top-0 z-10 bg-background pb-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all" className="font-mono text-xs">
            All ({logs.length})
          </TabsTrigger>
          <TabsTrigger value="toolCall" className="font-mono text-xs">
            Tool Calls ({logsByType.toolCall.length})
          </TabsTrigger>
          <TabsTrigger value="reasoning" className="font-mono text-xs">
            Reasoning ({logsByType.reasoning.length})
          </TabsTrigger>
          <TabsTrigger value="system" className="font-mono text-xs">
            System ({logsByType.system.length})
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="all">
        {renderLogsList(logsByType.all)}
      </TabsContent>

      <TabsContent value="toolCall">
        {logsByType.toolCall.length > 0 ? (
          renderLogsList(logsByType.toolCall)
        ) : (
          <div className="text-center py-8 text-muted-foreground font-mono text-sm">
            No tool call logs
          </div>
        )}
      </TabsContent>

      <TabsContent value="reasoning">
        {logsByType.reasoning.length > 0 ? (
          renderLogsList(logsByType.reasoning)
        ) : (
          <div className="text-center py-8 text-muted-foreground font-mono text-sm">
            No reasoning logs
          </div>
        )}
      </TabsContent>

      <TabsContent value="system">
        {logsByType.system.length > 0 ? (
          renderLogsList(logsByType.system)
        ) : (
          <div className="text-center py-8 text-muted-foreground font-mono text-sm">
            No system logs
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
