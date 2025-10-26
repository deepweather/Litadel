import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, Plus } from 'lucide-react'
import { api } from '../services/api'
import { PortfolioCard } from '../components/portfolio/PortfolioCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '../components/layout/PageHeader'
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="PORTFOLIOS"
        icon={<Briefcase size={24} />}
        actions={
          <Button onClick={() => navigate('/portfolio/create')}>
            <Plus size={18} />
            <span>NEW PORTFOLIO</span>
          </Button>
        }
      />

      {/* Portfolio Grid */}
      {!portfolios || portfolios.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Briefcase size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg text-primary font-mono mb-2">
              No portfolios yet
            </h3>
            <p className="text-muted-foreground font-mono text-sm mb-6">
              Create your first portfolio to start tracking your investments
            </p>
            <Button onClick={() => navigate('/portfolio/create')}>
              <Plus size={18} />
              <span>CREATE PORTFOLIO</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
          {portfolios.map((portfolio) => (
            <PortfolioCard key={portfolio.id} portfolio={portfolio} />
          ))}
        </div>
      )}
    </div>
  )
}

