import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Briefcase } from 'lucide-react'
import { api } from '../services/api'
import { FormInput as Input } from '@/components/ui/form-input'
import { Button } from '@/components/ui/button'
import { FormGroup, Heading, Label } from '../design-system'
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
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-md pb-base mb-xl border-b-2 border-primary">
        <Briefcase size={24} className="text-primary" />
        <Heading level={1}>CREATE PORTFOLIO</Heading>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="border border-border p-xl flex flex-col gap-lg">
          <FormGroup
            label="PORTFOLIO NAME"
            htmlFor="portfolio-name"
            required
            error={errors.name}
          >
            <Input
              id="portfolio-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., My Main Portfolio"
            />
          </FormGroup>

          <div>
            <Label htmlFor="portfolio-description">
              DESCRIPTION (Optional)
            </Label>
            <textarea
              id="portfolio-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your portfolio strategy or goals"
              className="w-full p-md bg-bg-secondary border border-border text-white font-mono text-base resize-vertical min-h-[100px]"
            />
          </div>

          <div className="flex gap-base mt-base">
            <Button type="submit" disabled={createMutation.isPending} className="flex-1">
              {createMutation.isPending ? 'CREATING...' : 'CREATE PORTFOLIO'}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/portfolio')}
              className="flex-1 bg-transparent text-dim border-dim"
            >
              CANCEL
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

