import React, { useState } from 'react'
import { AlertCircle, Send } from 'lucide-react'
import type { ClarificationQuestion } from '../../types/trading'
import { SmartDatePicker } from './SmartDatePicker'

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
    // Check if at least one required field is answered
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

    // Special handling for date fields
    if (field === 'dates' || field === 'start_date' || field === 'end_date') {
      const hasDateSelection = answers.start_date && answers.end_date

      // Show preset buttons if suggestions provided
      if (field_type === 'select' && suggestions && suggestions.length > 0 && !hasDateSelection) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.5rem'
            }}>
              {suggestions.map((preset) => (
                <button
                  key={String(preset)}
                  onClick={() => handleDatePresetSelect(String(preset))}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #4da6ff',
                    backgroundColor: 'rgba(77, 166, 255, 0.1)',
                    color: '#4da6ff',
                    fontSize: '0.875rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(77, 166, 255, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(77, 166, 255, 0.1)'
                  }}
                >
                  {String(preset)}
                </button>
              ))}
            </div>
          </div>
        )
      }

      if (hasDateSelection && !showDatePicker) {
        // Show selected dates with option to change
        return (
          <div style={{
            padding: '1rem',
            border: '1px solid #00d4ff',
            backgroundColor: 'rgba(0, 212, 255, 0.1)',
            borderRadius: '4px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                color: '#00d4ff',
                fontSize: '0.875rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 'bold'
              }}>
                Selected Date Range:
              </div>
              <button
                onClick={() => setShowDatePicker(true)}
                style={{
                  padding: '0.25rem 0.75rem',
                  border: '1px solid #4da6ff',
                  backgroundColor: 'transparent',
                  color: '#4da6ff',
                  fontSize: '0.75rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                Change
              </button>
            </div>
            <div style={{
              color: '#fff',
              fontSize: '0.875rem',
              fontFamily: 'JetBrains Mono, monospace'
            }}>
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

    // Capital field with suggestions
    if (field === 'capital' && suggestions && suggestions.length > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <input
              type="number"
              placeholder="Enter amount (e.g., 100000)..."
              value={answers[field] || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value)
                if (!isNaN(value)) {
                  setAnswers(prev => ({ ...prev, [field]: value }))
                }
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1a2a3a',
                border: '1px solid #4da6ff',
                color: '#fff',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.875rem'
              }}
            />
            {answers[field] && (
              <div style={{
                fontSize: '0.75rem',
                color: '#4da6ff',
                marginTop: '0.25rem',
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                = ${answers[field].toLocaleString('en-US')}
              </div>
            )}
          </div>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            {suggestions.map((amount) => {
              const numAmount = typeof amount === 'number' ? amount : Number(amount)
              return (
                <button
                  key={numAmount}
                  onClick={() => setAnswers(prev => ({ ...prev, [field]: numAmount }))}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #4da6ff',
                    backgroundColor: answers[field] === numAmount ? 'rgba(77, 166, 255, 0.3)' : 'rgba(77, 166, 255, 0.1)',
                    color: '#4da6ff',
                    fontSize: '0.875rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  ${(numAmount / 1000).toFixed(0)}k
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    // Select field
    if (field_type === 'select' && suggestions && suggestions.length > 0) {
      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '0.5rem'
        }}>
          {suggestions.map((option) => (
            <button
              key={String(option)}
              onClick={() => setAnswers(prev => ({ ...prev, [field]: option }))}
              style={{
                padding: '0.75rem',
                border: '1px solid #4da6ff',
                backgroundColor: answers[field] === option ? 'rgba(77, 166, 255, 0.3)' : 'rgba(77, 166, 255, 0.1)',
                color: '#4da6ff',
                fontSize: '0.875rem',
                fontFamily: 'JetBrains Mono, monospace',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              {String(option)}
            </button>
          ))}
        </div>
      )
    }

    // Textarea
    if (field_type === 'textarea') {
      return (
        <textarea
          placeholder="Enter details..."
          value={answers[field] || ''}
          onChange={(e) => setAnswers(prev => ({ ...prev, [field]: e.target.value }))}
          rows={4}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#1a2a3a',
            border: '1px solid #4da6ff',
            color: '#fff',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.875rem',
            resize: 'vertical'
          }}
        />
      )
    }

    // Array (comma-separated)
    if (field_type === 'array') {
      return (
        <input
          type="text"
          placeholder="Enter tickers separated by commas..."
          value={Array.isArray(answers[field]) ? answers[field].join(', ') : answers[field] || ''}
          onChange={(e) => {
            const value = e.target.value
            const array = value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
            setAnswers(prev => ({ ...prev, [field]: array }))
          }}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#1a2a3a',
            border: '1px solid #4da6ff',
            color: '#fff',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.875rem'
          }}
        />
      )
    }

    // Number
    if (field_type === 'number') {
      return (
        <input
          type="number"
          placeholder="Enter number..."
          value={answers[field] || ''}
          onChange={(e) => setAnswers(prev => ({ ...prev, [field]: parseFloat(e.target.value) }))}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#1a2a3a',
            border: '1px solid #4da6ff',
            color: '#fff',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.875rem'
          }}
        />
      )
    }

    // Default text input
    return (
      <input
        type="text"
        placeholder="Enter value..."
        value={answers[field] || ''}
        onChange={(e) => setAnswers(prev => ({ ...prev, [field]: e.target.value }))}
        style={{
          width: '100%',
          padding: '0.75rem',
          backgroundColor: '#1a2a3a',
          border: '1px solid #4da6ff',
          color: '#fff',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.875rem'
        }}
      />
    )
  }

  return (
    <div style={{
      padding: '1.5rem',
      border: '2px solid #ffa500',
      borderRadius: '8px',
      backgroundColor: 'rgba(255, 165, 0, 0.05)',
      fontFamily: 'JetBrains Mono, monospace'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        color: '#ffa500',
        fontSize: '1rem',
        fontWeight: 'bold'
      }}>
        <AlertCircle size={20} />
        <span>Need more information:</span>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {questions.map((question, index) => (
          <div key={index}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              color: '#ffa500',
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}>
              {question.question}
            </label>
            {renderInput(question)}
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginTop: '1.5rem'
      }}>
        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length === 0}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            backgroundColor: Object.keys(answers).length === 0 ? 'rgba(77, 166, 255, 0.05)' : 'rgba(0, 212, 255, 0.2)',
            border: `2px solid ${Object.keys(answers).length === 0 ? '#666' : '#00d4ff'}`,
            borderRadius: '8px',
            color: Object.keys(answers).length === 0 ? '#666' : '#00d4ff',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            cursor: Object.keys(answers).length === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'JetBrains Mono, monospace'
          }}
        >
          <Send size={16} />
          <span>Submit</span>
        </button>

        {onSkip && (
          <button
            onClick={onSkip}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              border: '2px solid #666',
              borderRadius: '8px',
              color: '#666',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace'
            }}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  )
}

