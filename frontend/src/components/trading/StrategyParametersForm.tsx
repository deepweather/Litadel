import React from 'react'
import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SmartDatePicker } from './SmartDatePicker'

interface FormData {
  strategy_type?: string | null
  strategy_description?: string
  capital?: number | null
  start_date?: string | null
  end_date?: string | null
  ticker_list?: string[]
  asset_preferences?: string
}

interface FieldConfidence {
  [key: string]: number
}

interface StrategyParametersFormProps {
  formData: FormData
  fieldConfidence: FieldConfidence
  onFieldChange: (field: string, value: any) => void
  onGenerateStrategy: () => void
  isGenerating: boolean
  disabled?: boolean
}

export const StrategyParametersForm: React.FC<StrategyParametersFormProps> = ({
  formData,
  fieldConfidence,
  onFieldChange,
  onGenerateStrategy,
  isGenerating,
  disabled = false
}) => {
  const getFieldStatus = (field: string, value: any) => {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      return 'missing'
    }
    const confidence = fieldConfidence[field] || 1.0
    if (confidence < 0.7) return 'low-confidence'
    return 'filled'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filled':
        return <Check className="h-4 w-4 text-green-500" />
      case 'missing':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'low-confidence':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return 'border-green-500/50'
      case 'missing':
        return 'border-destructive'
      case 'low-confidence':
        return 'border-yellow-500'
      default:
        return 'border-border'
    }
  }

  // Check if form is complete
  const requiredFields = ['strategy_type', 'strategy_description', 'capital', 'start_date', 'end_date']
  const isFormComplete = requiredFields.every(field => {
    const value = formData[field as keyof FormData]
    return value !== null && value !== undefined && value !== ''
  })

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
      default:
        return
    }

    onFieldChange('start_date', start)
    onFieldChange('end_date', end)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-mono flex items-center gap-2">
          📋 Strategy Parameters
          {!isFormComplete && (
            <Badge variant="outline" className="text-xs">
              Incomplete
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Strategy Type */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            {getStatusIcon(getFieldStatus('strategy_type', formData.strategy_type))}
            Strategy Type *
            {fieldConfidence.strategy_type && fieldConfidence.strategy_type < 0.7 && (
              <Badge variant="outline" className="text-xs">
                {Math.round(fieldConfidence.strategy_type * 100)}% confidence
              </Badge>
            )}
          </Label>
          <div className={`grid grid-cols-1 gap-2 p-3 rounded-md border-2 ${getStatusColor(getFieldStatus('strategy_type', formData.strategy_type))}`}>
            <Button
              onClick={() => onFieldChange('strategy_type', 'agent_managed')}
              variant={formData.strategy_type === 'agent_managed' ? 'default' : 'outline'}
              disabled={disabled}
              className="justify-start font-mono text-sm h-auto py-3"
            >
              <span className="mr-2">🤖</span>
              <div className="text-left">
                <div className="font-bold">AI Managed</div>
                <div className="text-xs opacity-70">I set preferences, AI makes trades</div>
              </div>
            </Button>
            <Button
              onClick={() => onFieldChange('strategy_type', 'technical_strategy')}
              variant={formData.strategy_type === 'technical_strategy' ? 'default' : 'outline'}
              disabled={disabled}
              className="justify-start font-mono text-sm h-auto py-3"
            >
              <span className="mr-2">📊</span>
              <div className="text-left">
                <div className="font-bold">Technical Strategy</div>
                <div className="text-xs opacity-70">I define specific rules & indicators</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Strategy Description */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            {getStatusIcon(getFieldStatus('strategy_description', formData.strategy_description))}
            Strategy Description *
          </Label>
          <Textarea
            value={formData.strategy_description || ''}
            onChange={(e) => onFieldChange('strategy_description', e.target.value)}
            placeholder="Describe your trading strategy..."
            disabled={disabled}
            rows={4}
            className={`resize-none border-2 ${getStatusColor(getFieldStatus('strategy_description', formData.strategy_description))}`}
          />
        </div>

        {/* Capital */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            {getStatusIcon(getFieldStatus('capital', formData.capital))}
            Capital *
          </Label>
          <div className={`space-y-2 p-3 rounded-md border-2 ${getStatusColor(getFieldStatus('capital', formData.capital))}`}>
            <Input
              type="number"
              value={formData.capital || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value)
                onFieldChange('capital', isNaN(value) ? null : value)
              }}
              placeholder="Enter amount (e.g., 100000)"
              disabled={disabled}
              className="font-mono"
            />
            {formData.capital && (
              <div className="text-xs text-muted-foreground font-mono">
                = ${formData.capital.toLocaleString('en-US')}
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {[10000, 50000, 100000].map((amount) => (
                <Button
                  key={amount}
                  onClick={() => onFieldChange('capital', amount)}
                  variant={formData.capital === amount ? 'default' : 'outline'}
                  size="sm"
                  disabled={disabled}
                  className="font-mono"
                >
                  ${(amount / 1000).toFixed(0)}k
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            {getStatusIcon(getFieldStatus('dates', formData.start_date && formData.end_date))}
            Date Range *
          </Label>
          <div className={`space-y-2 p-3 rounded-md border-2 ${getStatusColor(getFieldStatus('dates', formData.start_date && formData.end_date))}`}>
            {formData.start_date && formData.end_date ? (
              <div className="p-3 bg-muted rounded">
                <div className="text-sm font-mono">
                  {new Date(formData.start_date).toLocaleDateString('en-US')} → {new Date(formData.end_date).toLocaleDateString('en-US')}
                </div>
                <Button
                  onClick={() => {
                    onFieldChange('start_date', null)
                    onFieldChange('end_date', null)
                  }}
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className="mt-2"
                >
                  Change
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {['Last 2 Years', 'Last Year', 'YTD', 'Last 6 Months'].map((preset) => (
                    <Button
                      key={preset}
                      onClick={() => handleDatePresetSelect(preset)}
                      variant="outline"
                      size="sm"
                      disabled={disabled}
                      className="font-mono text-xs"
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
                <SmartDatePicker
                  onDateRangeSelect={(start, end) => {
                    onFieldChange('start_date', start)
                    onFieldChange('end_date', end)
                  }}
                  initialStartDate={formData.start_date || ''}
                  initialEndDate={formData.end_date || ''}
                />
              </>
            )}
          </div>
        </div>

        {/* Asset Preferences (conditional based on strategy type) */}
        {formData.strategy_type === 'agent_managed' && (
          <div>
            <Label className="flex items-center gap-2 mb-2">
              {getStatusIcon(getFieldStatus('asset_preferences', formData.asset_preferences))}
              Asset Preferences
            </Label>
            <div className={`space-y-2 p-3 rounded-md border-2 ${getStatusColor(getFieldStatus('asset_preferences', formData.asset_preferences))}`}>
              <Input
                value={formData.asset_preferences || ''}
                onChange={(e) => onFieldChange('asset_preferences', e.target.value)}
                placeholder="e.g., 'tech stocks', 'crypto', or 'you choose'"
                disabled={disabled}
                className="font-mono"
              />
              <div className="grid grid-cols-2 gap-2">
                {['Tech Stocks', 'Crypto', 'Blue Chips', 'You Choose'].map((option) => (
                  <Button
                    key={option}
                    onClick={() => onFieldChange('asset_preferences', option)}
                    variant={formData.asset_preferences === option ? 'default' : 'outline'}
                    size="sm"
                    disabled={disabled}
                    className="font-mono text-xs"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tickers (optional, for reference) */}
        {formData.ticker_list && formData.ticker_list.length > 0 && (
          <div>
            <Label className="mb-2">Tickers (extracted)</Label>
            <div className="flex flex-wrap gap-2">
              {formData.ticker_list.map((ticker) => (
                <Badge key={ticker} variant="secondary" className="font-mono">
                  {ticker}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <div className="border-t p-4">
        <Button
          onClick={onGenerateStrategy}
          disabled={!isFormComplete || isGenerating || disabled}
          className="w-full font-mono"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              ✨ Generate Strategy Code
            </>
          )}
        </Button>
        {!isFormComplete && (
          <p className="text-xs text-muted-foreground text-center mt-2 font-mono">
            Fill all required fields to continue
          </p>
        )}
      </div>
    </Card>
  )
}

