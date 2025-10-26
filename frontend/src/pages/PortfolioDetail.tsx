import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Edit2, Plus, Trash2, Upload } from 'lucide-react'
import { api } from '../services/api'
import { PositionTable } from '../components/portfolio/PositionTable'
import { PositionForm } from '../components/portfolio/PositionForm'
import { BulkImport } from '../components/portfolio/BulkImport'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconButton } from '../components/ui/IconButton'
import { MetricCard } from '../components/common/MetricCard'
import { TextArea, TextInput } from '../components/ui/Form'
import type {
  CreatePositionRequest,
  Position,
  UpdatePortfolioRequest,
  UpdatePositionRequest,
} from '../types/portfolio'
import { formatCurrency, formatPercentageWithSign } from '../utils/formatters'

export const PortfolioDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showPositionForm, setShowPositionForm] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [isEditingPortfolio, setIsEditingPortfolio] = useState(false)
  const [portfolioName, setPortfolioName] = useState('')
  const [portfolioDescription, setPortfolioDescription] = useState('')
  const [showBulkImport, setShowBulkImport] = useState(false)

  const portfolioId = parseInt(id || '0', 10)

  const { data: portfolio, isLoading, error } = useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: () => api.getPortfolio(portfolioId),
    enabled: portfolioId > 0,
  })

  const addPositionMutation = useMutation({
    mutationFn: (data: CreatePositionRequest) => api.addPosition(portfolioId, data),
    onSuccess: () => {
      toast.success('Position added successfully')
      queryClient.invalidateQueries({ queryKey: ['portfolio', portfolioId] })
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      setShowPositionForm(false)
    },
    onError: (error: any) => {
      toast.error(error.detail || 'Failed to add position')
    },
  })

  const updatePositionMutation = useMutation({
    mutationFn: ({ positionId, data }: { positionId: number; data: UpdatePositionRequest }) =>
      api.updatePosition(portfolioId, positionId, data),
    onSuccess: () => {
      toast.success('Position updated successfully')
      queryClient.invalidateQueries({ queryKey: ['portfolio', portfolioId] })
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      setEditingPosition(null)
    },
    onError: (error: any) => {
      toast.error(error.detail || 'Failed to update position')
    },
  })

  const deletePositionMutation = useMutation({
    mutationFn: (positionId: number) => api.deletePosition(portfolioId, positionId),
    onSuccess: () => {
      toast.success('Position deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['portfolio', portfolioId] })
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
    },
    onError: (error: any) => {
      toast.error(error.detail || 'Failed to delete position')
    },
  })

  const updatePortfolioMutation = useMutation({
    mutationFn: (data: UpdatePortfolioRequest) => api.updatePortfolio(portfolioId, data),
    onSuccess: () => {
      toast.success('Portfolio updated successfully')
      queryClient.invalidateQueries({ queryKey: ['portfolio', portfolioId] })
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      setIsEditingPortfolio(false)
    },
    onError: (error: any) => {
      toast.error(error.detail || 'Failed to update portfolio')
    },
  })

  const deletePortfolioMutation = useMutation({
    mutationFn: () => api.deletePortfolio(portfolioId),
    onSuccess: () => {
      toast.success('Portfolio deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      navigate('/portfolio')
    },
    onError: (error: any) => {
      toast.error(error.detail || 'Failed to delete portfolio')
    },
  })

  const handleAddPosition = (data: CreatePositionRequest | UpdatePositionRequest) => {
    addPositionMutation.mutate(data as CreatePositionRequest)
  }

  const handleUpdatePosition = (data: UpdatePositionRequest) => {
    if (editingPosition) {
      updatePositionMutation.mutate({ positionId: editingPosition.id, data })
    }
  }

  const handleClosePosition = (position: Position) => {
    const currentDate = new Date().toISOString().split('T')[0]
    const currentPrice = position.current_price || position.entry_price

    updatePositionMutation.mutate({
      positionId: position.id,
      data: {
        exit_price: currentPrice,
        exit_date: currentDate,
        status: 'closed',
      },
    })
  }

  const handleDeletePosition = (positionId: number) => {
    if (window.confirm('Are you sure you want to delete this position?')) {
      deletePositionMutation.mutate(positionId)
    }
  }

  const handleDeletePortfolio = () => {
    if (window.confirm(`Are you sure you want to delete "${portfolio?.name}"? This action cannot be undone.`)) {
      deletePortfolioMutation.mutate()
    }
  }

  const handleEditPortfolio = () => {
    if (portfolio) {
      setPortfolioName(portfolio.name)
      setPortfolioDescription(portfolio.description || '')
      setIsEditingPortfolio(true)
    }
  }

  const handleSavePortfolio = () => {
    updatePortfolioMutation.mutate({
      name: portfolioName,
      description: portfolioDescription,
    })
  }

  const handleBulkImport = async (file: File) => {
    const result = await api.bulkImportPositions(portfolioId, file)
    queryClient.invalidateQueries({ queryKey: ['portfolio', portfolioId] })
    queryClient.invalidateQueries({ queryKey: ['portfolios'] })

    if (result.added_count > 0) {
      toast.success(`Successfully imported ${result.added_count} positions`)
    }
    if (result.error_count > 0) {
      toast.error(`${result.error_count} positions failed to import`)
    }

    return result
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground font-mono">
        Loading portfolio...
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="p-8 text-center text-destructive font-mono">
        Portfolio not found
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button */}
      <Button onClick={() => navigate('/portfolio')} className="self-start">
        <ArrowLeft size={18} />
        <span>BACK TO PORTFOLIOS</span>
      </Button>

      {/* Portfolio Header */}
      <Card className="p-6">
        {isEditingPortfolio ? (
          <div>
            <TextInput
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              className="mb-4 text-primary text-2xl font-bold"
            />
            <TextArea
              value={portfolioDescription}
              onChange={(e) => setPortfolioDescription(e.target.value)}
              className="mb-4 min-h-[60px]"
            />
            <div className="flex gap-4">
              <Button onClick={handleSavePortfolio}>SAVE</Button>
              <Button
                onClick={() => setIsEditingPortfolio(false)}
                variant="outline"
              >
                CANCEL
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-primary font-mono mb-2">
                  {portfolio.name}
                </h1>
                {portfolio.description && (
                  <p className="text-muted-foreground font-mono text-sm">
                    {portfolio.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <IconButton
                  icon={<Edit2 size={16} />}
                  onClick={handleEditPortfolio}
                  variant="primary"
                  title="Edit Portfolio"
                />
                <IconButton
                  icon={<Trash2 size={16} />}
                  onClick={handleDeletePortfolio}
                  variant="danger"
                  title="Delete Portfolio"
                />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-6 pt-4 border-t">
              <MetricCard
                label="POSITIONS"
                value={portfolio.position_count}
              />
              <MetricCard
                label="TOTAL VALUE"
                value={formatCurrency(portfolio.total_value)}
              />
              <MetricCard
                label="PROFIT/LOSS"
                value={formatCurrency(portfolio.total_pnl)}
              />
              <MetricCard
                label="RETURN"
                value={formatPercentageWithSign(portfolio.total_pnl_percentage)}
              />
            </div>
          </>
        )}
      </Card>

      {/* Positions Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-primary font-mono">
            POSITIONS
          </h2>
          <div className="flex gap-2">
            <Button onClick={() => setShowBulkImport(true)}>
              <Upload size={18} />
              <span>BULK IMPORT</span>
            </Button>
            <Button onClick={() => setShowPositionForm(true)}>
              <Plus size={18} />
              <span>ADD POSITION</span>
            </Button>
          </div>
        </div>

        <PositionTable
          positions={portfolio.positions}
          onEdit={(position) => setEditingPosition(position)}
          onDelete={handleDeletePosition}
          onClose={handleClosePosition}
        />
      </div>

      {/* Position Form Modal */}
      {showPositionForm && (
        <PositionForm
          onSubmit={handleAddPosition}
          onCancel={() => setShowPositionForm(false)}
        />
      )}

      {editingPosition && (
        <PositionForm
          position={editingPosition}
          onSubmit={handleUpdatePosition}
          onCancel={() => setEditingPosition(null)}
          isEditing
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImport onImport={handleBulkImport} onClose={() => setShowBulkImport(false)} />
      )}
    </div>
  )
}

