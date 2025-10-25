import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Briefcase } from 'lucide-react'
import { api } from '../services/api'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import type { CreatePortfolioRequest } from '../types/portfolio'

export const CreatePortfolio: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<CreatePortfolioRequest>({
    name: '',
    description: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const createMutation = useMutation({
    mutationFn: (data: CreatePortfolioRequest) => api.createPortfolio(data),
    onSuccess: (portfolio) => {
      toast.success('Portfolio created successfully')
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      navigate(`/portfolio/${portfolio.id}`)
    },
    onError: (error: any) => {
      toast.error(error.detail || 'Failed to create portfolio')
    },
  })

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Portfolio name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    createMutation.mutate(formData)
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          paddingBottom: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid #4da6ff',
        }}
      >
        <Briefcase size={24} color="#4da6ff" />
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#4da6ff',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          CREATE PORTFOLIO
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            border: '1px solid rgba(77, 166, 255, 0.3)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#4da6ff',
                fontSize: '0.875rem',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              PORTFOLIO NAME *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., My Main Portfolio"
            />
            {errors.name && (
              <div
                style={{
                  color: '#ff0000',
                  fontSize: '0.75rem',
                  marginTop: '0.25rem',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {errors.name}
              </div>
            )}
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#4da6ff',
                fontSize: '0.875rem',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              DESCRIPTION (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your portfolio strategy or goals"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1a2a3a',
                border: '1px solid rgba(77, 166, 255, 0.3)',
                color: '#fff',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.875rem',
                resize: 'vertical',
                minHeight: '100px',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1rem',
            }}
          >
            <Button type="submit" disabled={createMutation.isPending} style={{ flex: 1 }}>
              {createMutation.isPending ? 'CREATING...' : 'CREATE PORTFOLIO'}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/portfolio')}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                color: '#2a3e4a',
                borderColor: '#2a3e4a',
              }}
            >
              CANCEL
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

