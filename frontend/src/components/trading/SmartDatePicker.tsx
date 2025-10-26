import React, { useState } from 'react'
import { Calendar } from 'lucide-react'

interface SmartDatePickerProps {
  onDateRangeSelect: (startDate: string, endDate: string) => void
  initialStartDate?: string
  initialEndDate?: string
}

export const SmartDatePicker: React.FC<SmartDatePickerProps> = ({
  onDateRangeSelect,
  initialStartDate = '',
  initialEndDate = ''
}) => {
  const [showCustom, setShowCustom] = useState(false)
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)

  // Calculate date presets
  const getDatePresets = () => {
    const today = new Date()
    const currentYear = today.getFullYear()

    return {
      'Last 2 Years': {
        start: `${currentYear - 2}-01-01`,
        end: today.toISOString().split('T')[0]
      },
      'Last Year': {
        start: `${currentYear - 1}-01-01`,
        end: `${currentYear - 1}-12-31`
      },
      'YTD': {
        start: `${currentYear}-01-01`,
        end: today.toISOString().split('T')[0]
      },
      'Last 6 Months': {
        start: new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      }
    }
  }

  const presets = getDatePresets()

  const handlePresetClick = (presetName: string) => {
    const preset = presets[presetName as keyof typeof presets]
    onDateRangeSelect(preset.start, preset.end)
    setShowCustom(false)
  }

  const handleCustomSubmit = () => {
    if (startDate && endDate) {
      if (new Date(endDate) <= new Date(startDate)) {
        alert('End date must be after start date')
        return
      }
      onDateRangeSelect(startDate, endDate)
      setShowCustom(false)
    }
  }

  return (
    <div style={{
      padding: '1.5rem',
      border: '2px solid #4da6ff',
      borderRadius: '8px',
      backgroundColor: 'rgba(77, 166, 255, 0.05)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        color: '#4da6ff',
        fontSize: '0.875rem',
        fontWeight: 'bold'
      }}>
        <Calendar size={18} />
        <span>What time period for the backtest?</span>
      </div>

      {!showCustom ? (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            {Object.keys(presets).map((presetName) => (
              <button
                key={presetName}
                onClick={() => handlePresetClick(presetName)}
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
                  e.currentTarget.style.borderColor = '#00d4ff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(77, 166, 255, 0.1)'
                  e.currentTarget.style.borderColor = '#4da6ff'
                }}
              >
                {presetName}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCustom(true)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px dashed #4da6ff',
              backgroundColor: 'transparent',
              color: '#4da6ff',
              fontSize: '0.875rem',
              fontFamily: 'JetBrains Mono, monospace',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            Custom Range...
          </button>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#4da6ff',
              fontSize: '0.75rem'
            }}>
              START DATE
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#1a2a3a',
                border: '1px solid #4da6ff',
                color: '#fff',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#4da6ff',
              fontSize: '0.75rem'
            }}>
              END DATE
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#1a2a3a',
                border: '1px solid #4da6ff',
                color: '#fff',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleCustomSubmit}
              disabled={!startDate || !endDate}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                color: '#00d4ff',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                fontFamily: 'JetBrains Mono, monospace',
                cursor: !startDate || !endDate ? 'not-allowed' : 'pointer',
                opacity: !startDate || !endDate ? 0.5 : 1,
                borderRadius: '4px'
              }}
            >
              Apply
            </button>
            <button
              onClick={() => setShowCustom(false)}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #666',
                backgroundColor: 'transparent',
                color: '#666',
                fontSize: '0.875rem',
                fontFamily: 'JetBrains Mono, monospace',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

