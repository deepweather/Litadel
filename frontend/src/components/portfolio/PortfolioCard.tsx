import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { PortfolioSummary } from '../../types/portfolio'

interface PortfolioCardProps {
  portfolio: PortfolioSummary
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ portfolio }) => {
  const navigate = useNavigate()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  const pnlColor = portfolio.total_pnl >= 0 ? '#00ff00' : '#ff0000'

  return (
    <div
      onClick={() => navigate(`/portfolio/${portfolio.id}`)}
      style={{
        border: '1px solid rgba(77, 166, 255, 0.3)',
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: '#0a0e14',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#4da6ff'
        e.currentTarget.style.backgroundColor = '#1a2a3a'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(77, 166, 255, 0.3)'
        e.currentTarget.style.backgroundColor = '#0a0e14'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1rem',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '0.25rem',
            }}
          >
            {portfolio.name}
          </h3>
          {portfolio.description && (
            <p
              style={{
                fontSize: '0.875rem',
                color: '#2a3e4a',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {portfolio.description}
            </p>
          )}
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            color: '#2a3e4a',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {portfolio.position_count} positions
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(77, 166, 255, 0.2)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              color: '#2a3e4a',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '0.25rem',
            }}
          >
            VALUE
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {formatCurrency(portfolio.total_value)}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: '0.75rem',
              color: '#2a3e4a',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '0.25rem',
            }}
          >
            P&L
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: pnlColor,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {formatCurrency(portfolio.total_pnl)}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: '0.75rem',
              color: '#2a3e4a',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '0.25rem',
            }}
          >
            RETURN
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: pnlColor,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {formatPercentage(portfolio.total_pnl_percentage)}
          </div>
        </div>
      </div>
    </div>
  )
}

