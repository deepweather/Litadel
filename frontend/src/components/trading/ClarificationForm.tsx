import React, { useState } from 'react'
import { AlertCircle, Send } from 'lucide-react'
import type { ClarificationQuestion } from '../../types/trading'
import { SmartDatePicker } from './SmartDatePicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'

interface ClarificationFormProps {
  questions: ClarificationQuestion[]
  onSubmit: (answers: Record<string, any>) => void
  onSkip?: () => void
}

export const ClarificationForm: React.FC<ClarificationFormProps> = ({
  questions,
  onSubmit,
  onSkip
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleSubmit = () => {
    const hasAnswers = Object.keys(answers).length > 0
    if (hasAnswers) {
      onSubmit(answers)
    }
  }

  const handleDatePresetSelect = (preset: string) => {
    const today = new Date()
    let start: string, end: string

    switch (preset) {
      case 'Last 2 Years':
        start = new Date(today.getFullYear() - 2, 0, 1).toISOString().split('T')[0]
        end = today.toISOString().split('T')[0]
        break
      case 'Last Year':
        start = new Date(today.getFullYear() - 1, 0, 1).toISOString().split('T')[0]
        end = new Date(today.getFullYear() - 1, 11, 31).toISOString().split('T')[0]
        break
      case 'YTD':
        start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
        end = today.toISOString().split('T')[0]
        break
      case 'Last 6 Months':
        start = new Date(today.setMonth(today.getMonth() - 6)).toISOString().split('T')[0]
        end = new Date().toISOString().split('T')[0]
        break
      case 'Custom':
        setShowDatePicker(true)
        return
      default:
        return
    }

    setAnswers(prev => ({
      ...prev,
      start_date: start,
      end_date: end
    }))
  }

  const renderInput = (question: ClarificationQuestion) => {
    const { field, field_type, suggestions } = question

    // Date fields
    if (field === 'dates' || field === 'start_date' || field === 'end_date') {
      const hasDateSelection = answers.start_date && answers.end_date

      if (field_type === 'select' && suggestions && suggestions.length > 0 && !hasDateSelection) {
        return (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
              {suggestions.map((preset) => (
                <Button
                  key={String(preset)}
                  onClick={() => handleDatePresetSelect(String(preset))}
                  variant="outline"
                  className="text-sm font-mono"
                >
                  {String(preset)}
                </Button>
              ))}
            </div>
          </div>
        )
      }

      if (hasDateSelection && !showDatePicker) {
        return (
          <div className="p-4 border border-border rounded bg-muted/30">
            <div className="flex justify-between items-center mb-2">
              <div className="text-foreground text-sm font-mono font-bold">
                Selected Date Range:
              </div>
              <Button
                onClick={() => setShowDatePicker(true)}
                variant="outline"
                size="sm"
              >
                Change
              </Button>
            </div>
            <div className="text-foreground text-sm font-mono">
              {new Date(answers.start_date).toLocaleDateString('en-US')} to {new Date(answers.end_date).toLocaleDateString('en-US')}
            </div>
          </div>
        )
      }

      return (
        <SmartDatePicker
          onDateRangeSelect={(start, end) => {
            setAnswers(prev => ({
              ...prev,
              start_date: start,
              end_date: end
            }))
            setShowDatePicker(false)
          }}
          initialStartDate={answers.start_date || ''}
          initialEndDate={answers.end_date || ''}
        />
      )
    }

    // Capital field
    if (field === 'capital' && suggestions && suggestions.length > 0) {
      return (
        <div className="flex flex-col gap-3">
          <div>
            <Input
              type="number"
              placeholder="Enter amount (e.g., 100000)..."
              value={answers[field] || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value)
                if (!isNaN(value)) {
                  setAnswers(prev => ({ ...prev, [field]: value }))
                }
              }}
              className="w-full"
            />
            {answers[field] && (
              <div className="text-xs text-primary mt-1 font-mono">
                = ${answers[field].toLocaleString('en-US')}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {suggestions.map((amount) => {
              const numAmount = typeof amount === 'number' ? amount : Number(amount)
              return (
                <Button
                  key={numAmount}
                  onClick={() => setAnswers(prev => ({ ...prev, [field]: numAmount }))}
                  variant={answers[field] === numAmount ? "default" : "outline"}
                  size="sm"
                  className="font-mono"
                >
                  ${(numAmount / 1000).toFixed(0)}k
                </Button>
              )
            })}
          </div>
        </div>
      )
    }

    // Select field
    if (field_type === 'select' && suggestions && suggestions.length > 0) {
      return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2">
          {suggestions.map((option) => (
            <Button
              key={String(option)}
              onClick={() => setAnswers(prev => ({ ...prev, [field]: option }))}
              variant={answers[field] === option ? "default" : "outline"}
              className="font-mono text-sm"
            >
              {String(option)}
            </Button>
          ))}
        </div>
      )
    }

    // Textarea
    if (field_type === 'textarea') {
      return (
        <Textarea
          placeholder="Enter details..."
          value={answers[field] || ''}
          onChange={(e) => setAnswers(prev => ({ ...prev, [field]: e.target.value }))}
          rows={4}
          className="w-full resize-y"
        />
      )
    }

    // Array (comma-separated)
    if (field_type === 'array') {
      return (
        <Input
          type="text"
          placeholder="Enter tickers separated by commas..."
          value={Array.isArray(answers[field]) ? answers[field].join(', ') : answers[field] || ''}
          onChange={(e) => {
            const value = e.target.value
            const array = value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
            setAnswers(prev => ({ ...prev, [field]: array }))
          }}
          className="w-full"
        />
      )
    }

    // Number
    if (field_type === 'number') {
      return (
        <Input
          type="number"
          placeholder="Enter number..."
          value={answers[field] || ''}
          onChange={(e) => setAnswers(prev => ({ ...prev, [field]: parseFloat(e.target.value) }))}
          className="w-full"
        />
      )
    }

    // Default text input
    return (
      <Input
        type="text"
        placeholder="Enter value..."
        value={answers[field] || ''}
        onChange={(e) => setAnswers(prev => ({ ...prev, [field]: e.target.value }))}
        className="w-full"
      />
    )
  }

  return (
    <Card className="p-6 font-mono">
      <div className="flex items-center gap-2 mb-6 text-foreground text-base font-bold">
        <AlertCircle size={20} />
        <span>Need more information:</span>
      </div>

      <div className="flex flex-col gap-6">
        {questions.map((question, index) => (
          <div key={index}>
            <Label className="block mb-3 text-sm font-bold">
              {question.question}
            </Label>
            {renderInput(question)}
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        <Button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length === 0}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <Send size={16} />
          <span>Submit</span>
        </Button>

        {onSkip && (
          <Button
            onClick={onSkip}
            variant="outline"
          >
            Skip
          </Button>
        )}
      </div>
    </Card>
  )
}
