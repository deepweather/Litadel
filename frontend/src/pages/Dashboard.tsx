import React from 'react'
import { useNavigate } from 'react-router-dom'
import { SystemMetrics } from '../components/dashboard/SystemMetrics'
import { RecentActivity } from '../components/dashboard/RecentActivity'
import { Terminal } from '../components/terminal/Terminal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Activity,
  BarChart3,
  Briefcase,
  Plus,
  Settings as SettingsIcon,
  Sparkles,
  Terminal as TerminalIcon,
  TrendingUp
} from 'lucide-react'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold font-mono flex items-center gap-2">
                <Sparkles className="size-6 text-primary" />
                LITADEL CONTROL CENTER
              </CardTitle>
              <CardDescription className="font-mono">
                Multi-Agent Trading Analysis System v1.0.0
              </CardDescription>
            </div>
            <Button onClick={() => navigate('/analyses/create')} size="lg">
              <Plus className="size-4" />
              NEW ANALYSIS
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/analyses')}
              className="font-mono"
            >
              <BarChart3 className="size-4" />
              View Analyses
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/backtests/create')}
              className="font-mono"
            >
              <TrendingUp className="size-4" />
              Create Backtest
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/portfolio')}
              className="font-mono"
            >
              <Briefcase className="size-4" />
              Portfolio
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/settings')}
              className="font-mono"
            >
              <SettingsIcon className="size-4" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 min-h-0 auto-rows-fr">
        {/* System Metrics */}
        <Card className="flex flex-col min-h-[400px]">
          <CardHeader>
            <CardTitle className="font-mono flex items-center gap-2">
              <Activity className="size-5" />
              SYSTEM METRICS
            </CardTitle>
            <CardDescription className="font-mono">
              Real-time system status
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <SystemMetrics />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="flex flex-col min-h-[400px]">
          <CardHeader>
            <CardTitle className="font-mono flex items-center gap-2">
              <BarChart3 className="size-5" />
              RECENT ACTIVITY
            </CardTitle>
            <CardDescription className="font-mono">
              Latest analysis updates
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto min-h-0">
            <RecentActivity />
          </CardContent>
        </Card>

        {/* Terminal */}
        <Card className="flex flex-col min-h-[400px] md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-mono flex items-center gap-2">
              <TerminalIcon className="size-5" />
              TERMINAL
            </CardTitle>
            <CardDescription className="font-mono">
              Command interface
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0">
            <Terminal />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
