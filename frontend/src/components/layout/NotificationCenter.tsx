import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAnalyses } from '../../hooks/useAnalyses'

export function NotificationCenter() {
  const { data: analysesData } = useAnalyses(1, 100)

  const analyses = analysesData?.items || []
  const runningCount = analyses.filter((a) => a.status === 'running').length
  const recentCompleted = analyses
    .filter((a) => a.status === 'completed')
    .slice(0, 3)

  const hasNotifications = runningCount > 0 || recentCompleted.length > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          {hasNotifications && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">
                {runningCount > 0 ? runningCount : ''}
              </span>
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 font-mono">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {hasNotifications && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {runningCount + recentCompleted.length}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {runningCount > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Active
            </DropdownMenuLabel>
            <DropdownMenuItem className="flex flex-col items-start py-3">
              <div className="flex items-center gap-2 w-full">
                <div className="h-2 w-2 rounded-full bg-chart-2 animate-pulse" />
                <span className="text-sm font-medium">
                  {runningCount} {runningCount === 1 ? 'Analysis' : 'Analyses'} Running
                </span>
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                Actively processing data
              </span>
            </DropdownMenuItem>
          </>
        )}

        {recentCompleted.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Recent Completions
            </DropdownMenuLabel>
            {recentCompleted.map((analysis) => (
              <DropdownMenuItem key={analysis.id} className="flex flex-col items-start py-3">
                <div className="flex items-center gap-2 w-full">
                  <div className="h-2 w-2 rounded-full bg-chart-4" />
                  <span className="text-sm font-medium">{analysis.ticker}</span>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  Analysis completed
                </span>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {!hasNotifications && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No new notifications
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

