import React from 'react'
import { useNavigate } from 'react-router-dom'
import { SystemMetrics } from '../components/dashboard/SystemMetrics'
import { RecentActivity } from '../components/dashboard/RecentActivity'
import { Terminal } from '../components/terminal/Terminal'
import { PageHeader } from '../components/layout/PageHeader'
import { SectionHeader } from '../components/layout/SectionHeader'
import { Panel } from '../components/layout/Panel'
import { Button } from '../components/ui/Button'
import { LinkButton } from '../components/ui/LinkButton'
import { Plus } from 'lucide-react'
import { LOGO_ASCII } from '../utils/ascii'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.5rem' }}>
      {/* Welcome header */}
      <Panel padding="lg">
        <pre
          style={{
            color: '#4da6ff',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.75rem',
            lineHeight: '1.2',
            marginBottom: '1.5rem',
          }}
        >
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
      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column' }}>
          <SectionHeader title="SYSTEM METRICS" />
          <SystemMetrics />
        </div>
        <div
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}
        >
          <SectionHeader title="RECENT ACTIVITY" />
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <RecentActivity />
          </div>
        </div>
        <div style={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <SectionHeader title="TERMINAL" />
          <div style={{ flex: 1, minHeight: 0 }}>
            <Terminal />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <Panel padding="lg" className="mt-auto">
        <div style={{ textAlign: 'center' }}>
          <SectionHeader title="QUICK LINKS" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
