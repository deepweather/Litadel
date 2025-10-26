import React from 'react'
import { useNavigate } from 'react-router-dom'
import { SystemMetrics } from '../components/dashboard/SystemMetrics'
import { RecentActivity } from '../components/dashboard/RecentActivity'
import { Terminal } from '../components/terminal/Terminal'
import { PageHeader } from '../components/layout/PageHeader'
import { SectionHeader } from '../components/layout/SectionHeader'
import { Panel } from '../components/layout/Panel'
import { Button } from '@/components/ui/button'
import { LinkButton } from '../components/ui/LinkButton'
import { Plus } from 'lucide-react'
import { LOGO_ASCII } from '../utils/ascii'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Welcome header */}
      <Panel padding="lg">
        <pre className="text-primary font-mono text-xs leading-tight mb-6">
          {LOGO_ASCII}
        </pre>
        <PageHeader
          title="CONTROL CENTER"
          subtitle="Multi-Agent Trading Analysis System v1.0.0"
          actions={
            <Button onClick={() => navigate('/analyses/create')}>
              <Plus size={18} />
              NEW ANALYSIS
            </Button>
          }
        />
      </Panel>

      {/* Metrics, Activity, and Terminal */}
      <div className="flex gap-6 flex-1 min-h-0">
        <div className="flex-none w-[300px] flex flex-col">
          <SectionHeader title="SYSTEM METRICS" />
          <SystemMetrics />
        </div>
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <SectionHeader title="RECENT ACTIVITY" />
          <div className="flex-1 min-h-0 overflow-hidden">
            <RecentActivity />
          </div>
        </div>
        <div className="flex-none w-[400px] flex flex-col min-h-0">
          <SectionHeader title="TERMINAL" />
          <div className="flex-1 min-h-0">
            <Terminal />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <Panel padding="lg" className="mt-auto">
        <div className="text-center">
          <SectionHeader title="QUICK LINKS" />
        </div>
        <div className="flex justify-center gap-4 flex-wrap">
          <LinkButton onClick={() => navigate('/analyses')} variant="primary">
            View All Analyses
          </LinkButton>
          <LinkButton onClick={() => navigate('/analyses/create')} variant="accent">
            Create Analysis
          </LinkButton>
          <LinkButton onClick={() => navigate('/portfolio')} variant="primary">
            View Portfolios
          </LinkButton>
          <LinkButton onClick={() => navigate('/backtests/create')} variant="accent">
            Create Backtest
          </LinkButton>
          <LinkButton onClick={() => navigate('/settings')} variant="primary">
            Settings
          </LinkButton>
        </div>
      </Panel>
    </div>
  )
}
