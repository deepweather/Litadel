import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, Plus } from 'lucide-react'
import { api } from '../services/api'
import { PortfolioCard } from '../components/portfolio/PortfolioCard'
import { Button } from '../components/ui/Button'

export const PortfolioList: React.FC = () => {
  const navigate = useNavigate()

  const { data: portfolios, isLoading, error } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => api.getPortfolios(),
  })

  if (isLoading) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#2a3e4a',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        Loading portfolios...
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#ff0000',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        Error loading portfolios: {(error as Error).message}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '1rem',
          borderBottom: '2px solid #4da6ff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Briefcase size={24} color="#4da6ff" />
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            PORTFOLIOS
          </h1>
        </div>
        <Button onClick={() => navigate('/portfolio/create')}>
          <Plus size={18} />
          <span>NEW PORTFOLIO</span>
        </Button>
      </div>

      {/* Portfolio Grid */}
      {!portfolios || portfolios.length === 0 ? (
        <div
          style={{
            border: '1px solid rgba(77, 166, 255, 0.3)',
            padding: '3rem',
            textAlign: 'center',
          }}
        >
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

