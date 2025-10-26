import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { PortfolioSummary } from '../../types/portfolio'
import { formatCurrency, formatPercentageWithSign } from '../../utils/formatters'
import { getPnLColor } from '../../utils/colors'
import { Card } from '@/components/ui/card'

interface PortfolioCardProps {
  portfolio: PortfolioSummary
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ portfolio }) => {
  const navigate = useNavigate()

  return (
    <Card onClick={() => navigate(`/portfolio/${portfolio.id}`)} className="cursor-pointer transition-all hover:shadow-md">
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
              color: getPnLColor(portfolio.total_pnl),
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
              color: getPnLColor(portfolio.total_pnl),
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {formatPercentageWithSign(portfolio.total_pnl_percentage)}
          </div>
        </div>
      </div>
    </Card>
  )
}

