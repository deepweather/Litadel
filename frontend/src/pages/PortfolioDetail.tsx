import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Edit2, Plus, Trash2, Upload } from 'lucide-react'
import { api } from '../services/api'
import { PositionTable } from '../components/portfolio/PositionTable'
import { PositionForm } from '../components/portfolio/PositionForm'
import { BulkImport } from '../components/portfolio/BulkImport'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
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
import { getPnLColor, themeColors } from '../utils/colors'

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
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#2a3e4a',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        Loading portfolio...
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#ff0000',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        Portfolio not found
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Back Button */}
      <Button onClick={() => navigate('/portfolio')} style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={18} />
        <span>BACK TO PORTFOLIOS</span>
      </Button>

      {/* Portfolio Header */}
      <Card padding="lg" hoverEffect={false}>
        {isEditingPortfolio ? (
          <div>
            <TextInput
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              style={{
                marginBottom: '1rem',
                color: '#4da6ff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
              }}
            />
            <TextArea
              value={portfolioDescription}
              onChange={(e) => setPortfolioDescription(e.target.value)}
              style={{
                marginBottom: '1rem',
                minHeight: '60px',
              }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button onClick={handleSavePortfolio}>SAVE</Button>
              <Button
                onClick={() => setIsEditingPortfolio(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#2a3e4a',
                  borderColor: '#2a3e4a',
                }}
              >
                CANCEL
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#4da6ff',
                    fontFamily: 'JetBrains Mono, monospace',
                    marginBottom: '0.5rem',
                  }}
                >
                  {portfolio.name}
                </h1>
                {portfolio.description && (
                  <p
                    style={{
                      color: '#2a3e4a',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.875rem',
                    }}
                  >
                    {portfolio.description}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(77, 166, 255, 0.2)',
              }}
            >
              <MetricCard
                label="POSITIONS"
                value={portfolio.position_count}
                color={themeColors.primary}
              />
              <MetricCard
                label="TOTAL VALUE"
                value={formatCurrency(portfolio.total_value)}
                color={themeColors.primary}
              />
              <MetricCard
                label="PROFIT/LOSS"
                value={formatCurrency(portfolio.total_pnl)}
                color={getPnLColor(portfolio.total_pnl)}
              />
              <MetricCard
                label="RETURN"
                value={formatPercentageWithSign(portfolio.total_pnl_percentage)}
                color={getPnLColor(portfolio.total_pnl)}
              />
            </div>
          </>
        )}
      </Card>

      {/* Positions Section */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            POSITIONS
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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

