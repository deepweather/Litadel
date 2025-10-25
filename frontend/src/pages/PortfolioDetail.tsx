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
import type {
  CreatePositionRequest,
  Position,
  UpdatePortfolioRequest,
  UpdatePositionRequest,
} from '../types/portfolio'

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

  const pnlColor = portfolio.total_pnl >= 0 ? '#00ff00' : '#ff0000'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Back Button */}
      <Button onClick={() => navigate('/portfolio')} style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={18} />
        <span>BACK TO PORTFOLIOS</span>
      </Button>

      {/* Portfolio Header */}
      <div style={{ border: '1px solid rgba(77, 166, 255, 0.3)', padding: '1.5rem' }}>
        {isEditingPortfolio ? (
          <div>
            <input
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginBottom: '1rem',
                backgroundColor: '#1a2a3a',
                border: '1px solid #4da6ff',
                color: '#4da6ff',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '1.5rem',
                fontWeight: 'bold',
              }}
            />
            <textarea
              value={portfolioDescription}
              onChange={(e) => setPortfolioDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginBottom: '1rem',
                backgroundColor: '#1a2a3a',
                border: '1px solid rgba(77, 166, 255, 0.3)',
                color: '#fff',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.875rem',
                resize: 'vertical',
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
                <button
                  onClick={handleEditPortfolio}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #4da6ff',
                    backgroundColor: 'transparent',
                    color: '#4da6ff',
                    cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  title="Edit Portfolio"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={handleDeletePortfolio}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #ff0000',
                    backgroundColor: 'transparent',
                    color: '#ff0000',
                    cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  title="Delete Portfolio"
                >
                  <Trash2 size={16} />
                </button>
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
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#2a3e4a',
                    fontFamily: 'JetBrains Mono, monospace',
                    marginBottom: '0.25rem',
                  }}
                >
                  POSITIONS
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#4da6ff',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {portfolio.position_count}
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
                  TOTAL VALUE
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
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
                  PROFIT/LOSS
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
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
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: pnlColor,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {formatPercentage(portfolio.total_pnl_percentage)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

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

