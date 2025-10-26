import { useNavigate } from 'react-router-dom'
import { BarChart3, Briefcase, Plus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function QuickCreate() {
  const navigate = useNavigate()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="sm" className="font-mono gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 font-mono">
        <DropdownMenuLabel>Quick Create</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate('/analyses/create')}>
          <BarChart3 className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">Deep Dive</span>
            <span className="text-xs text-muted-foreground">
              Analyze asset in depth
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/backtests/create')}>
          <TrendingUp className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">Backtest</span>
            <span className="text-xs text-muted-foreground">
              Test trading strategy
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/portfolio/create')}>
          <Briefcase className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">Portfolio</span>
            <span className="text-xs text-muted-foreground">
              Track positions
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

