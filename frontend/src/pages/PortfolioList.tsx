import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, Plus } from 'lucide-react'
import { api } from '../services/api'
import { PortfolioCard } from '../components/portfolio/PortfolioCard'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/layout/PageHeader'
import { Panel } from '../components/layout/Panel'
import { LoadingState } from '../components/data-display/LoadingState'
import { ErrorState } from '../components/data-display/ErrorState'

export const PortfolioList: React.FC = () => {
  const navigate = useNavigate()

  const { data: portfolios, isLoading, error } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => api.getPortfolios(),
  })

  if (isLoading) {
    return <LoadingState message="Loading portfolios..." />
  }

  if (error) {
    return <ErrorState error={error as Error} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="PORTFOLIOS"
        icon={<Briefcase size={24} color="#4da6ff" />}
        actions={
          <Button onClick={() => navigate('/portfolio/create')}>
            <Plus size={18} />
            <span>NEW PORTFOLIO</span>
          </Button>
        }
      />

      {/* Portfolio Grid */}
      {!portfolios || portfolios.length === 0 ? (
        <Panel padding="lg">
          <div style={{ textAlign: 'center' }}>
            <Briefcase size={48} color="#2a3e4a" style={{ margin: '0 auto 1rem' }} />
            <h3
              style={{
                fontSize: '1.125rem',
                color: '#4da6ff',
                fontFamily: 'JetBrains Mono, monospace',
                marginBottom: '0.5rem',
              }}
            >
              No portfolios yet
            </h3>
            <p
              style={{
                color: '#2a3e4a',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
              }}
            >
              Create your first portfolio to start tracking your investments
            </p>
            <Button onClick={() => navigate('/portfolio/create')}>
              <Plus size={18} />
              <span>CREATE PORTFOLIO</span>
            </Button>
          </div>
        </Panel>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {portfolios.map((portfolio) => (
            <PortfolioCard key={portfolio.id} portfolio={portfolio} />
          ))}
        </div>
      )}
    </div>
  )
}

