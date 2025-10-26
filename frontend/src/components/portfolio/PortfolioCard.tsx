import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { PortfolioSummary } from '../../types/portfolio'
import { formatCurrency, formatPercentageWithSign } from '../../utils/formatters'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PortfolioCardProps {
  portfolio: PortfolioSummary
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ portfolio }) => {
  const navigate = useNavigate()

  const getPnLColorClass = (value: number) => {
    return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  }

  return (
    <Card onClick={() => navigate(`/portfolio/${portfolio.id}`)} className="cursor-pointer transition-all hover:shadow-md p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-primary font-mono mb-1">
            {portfolio.name}
          </h3>
          {portfolio.description && (
            <p className="text-sm text-muted-foreground font-mono">
              {portfolio.description}
            </p>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {portfolio.position_count} positions
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div>
          <div className="text-xs text-muted-foreground font-mono mb-1">
            VALUE
          </div>
          <div className="text-base font-bold text-primary font-mono">
            {formatCurrency(portfolio.total_value)}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground font-mono mb-1">
            P&L
          </div>
          <div className={cn(
            "text-base font-bold font-mono",
            getPnLColorClass(portfolio.total_pnl)
          )}>
            {formatCurrency(portfolio.total_pnl)}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground font-mono mb-1">
            RETURN
          </div>
          <div className={cn(
            "text-base font-bold font-mono",
            getPnLColorClass(portfolio.total_pnl)
          )}>
            {formatPercentageWithSign(portfolio.total_pnl_percentage)}
          </div>
        </div>
      </div>
    </Card>
  )
}

