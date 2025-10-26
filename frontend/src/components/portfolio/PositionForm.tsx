import React, { useEffect, useState } from 'react'
import { AlertCircle, Check, Loader } from 'lucide-react'
import type { CreatePositionRequest, Position, UpdatePositionRequest } from '../../types/portfolio'
import { FormInput as Input } from '@/components/ui/form-input'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal-wrapper'
import { api } from '../../services/api'

interface PositionFormProps {
  position?: Position
  onSubmit: (data: CreatePositionRequest | UpdatePositionRequest) => void
  onCancel: () => void
  isEditing?: boolean
}

export const PositionForm: React.FC<PositionFormProps> = ({
  position,
  onSubmit,
  onCancel,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState({
    ticker: position?.ticker || '',
    quantity: position?.quantity?.toString() || '',
    entry_price: position?.entry_price?.toString() || '',
    entry_date: position?.entry_date ? position.entry_date.split('T')[0] : '',
    exit_price: position?.exit_price?.toString() || '',
    exit_date: position?.exit_date ? position.exit_date.split('T')[0] : '',
    notes: position?.notes || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tickerValidation, setTickerValidation] = useState<{
    status: 'idle' | 'validating' | 'valid' | 'invalid'
    message?: string
    currentPrice?: number
  }>({ status: 'idle' })
  const [priceAutoFillStatus, setPriceAutoFillStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [priceAutoFillMessage, setPriceAutoFillMessage] = useState<string>('')

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!isEditing) {
      if (!formData.ticker.trim()) {
        newErrors.ticker = 'Ticker is required'
      }
      if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
        newErrors.quantity = 'Quantity must be greater than 0'
      }
      if (!formData.entry_price || parseFloat(formData.entry_price) <= 0) {
        newErrors.entry_price = 'Entry price must be greater than 0'
      }
      if (!formData.entry_date) {
        newErrors.entry_date = 'Entry date is required'
      }
    } else {
      if (formData.quantity && parseFloat(formData.quantity) <= 0) {
        newErrors.quantity = 'Quantity must be greater than 0'
      }
      if (formData.exit_price && parseFloat(formData.exit_price) <= 0) {
        newErrors.exit_price = 'Exit price must be greater than 0'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Ticker validation with debounce
  useEffect(() => {
    if (isEditing || !formData.ticker.trim()) {
      setTickerValidation({ status: 'idle' })
      return
    }

    const timeoutId = setTimeout(async () => {
      setTickerValidation({ status: 'validating' })
      try {
        const result = await api.validateTicker(formData.ticker)
        if (result.valid) {
          setTickerValidation({
            status: 'valid',
            message: `${result.asset_class?.toUpperCase() || 'ASSET'} - Current: $${result.current_price?.toFixed(2)}`,
            currentPrice: result.current_price,
          })
        } else {
          setTickerValidation({
            status: 'invalid',
            message: result.message || 'Invalid ticker',
          })
        }
      } catch (error) {
        setTickerValidation({
          status: 'invalid',
          message: 'Could not validate ticker',
        })
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [formData.ticker, isEditing])

  // Auto-fill entry price when entry_date changes
  useEffect(() => {
    if (isEditing || !formData.ticker.trim() || !formData.entry_date) {
      setPriceAutoFillStatus('idle')
      setPriceAutoFillMessage('')
      return
    }

    const fetchHistoricalPrice = async () => {
      setPriceAutoFillStatus('loading')
      try {
        const result = await api.getHistoricalPrice(formData.ticker, formData.entry_date)

        // Only auto-fill if entry_price is empty
        if (!formData.entry_price) {
          setFormData((prev) => ({ ...prev, entry_price: result.price.toString() }))
        }

        setPriceAutoFillStatus('success')
        if (result.note) {
          setPriceAutoFillMessage(result.note)
        } else {
          setPriceAutoFillMessage(`Auto-filled with closing price: $${result.price.toFixed(2)}`)
        }
      } catch (error: any) {
        setPriceAutoFillStatus('error')
        setPriceAutoFillMessage(error.detail || 'Could not fetch historical price')
      }
    }

    fetchHistoricalPrice()
  }, [formData.ticker, formData.entry_date, isEditing])

  const handleUseCurrentPrice = () => {
    if (tickerValidation.currentPrice) {
      setFormData((prev) => ({
        ...prev,
        entry_price: tickerValidation.currentPrice!.toString(),
        entry_date: new Date().toISOString().split('T')[0],
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    if (isEditing) {
      const updateData: UpdatePositionRequest = {}
      if (formData.quantity) updateData.quantity = parseFloat(formData.quantity)
      if (formData.exit_price) updateData.exit_price = parseFloat(formData.exit_price)
      if (formData.exit_date) updateData.exit_date = formData.exit_date
      if (formData.notes !== position?.notes) updateData.notes = formData.notes
      if (formData.exit_price && formData.exit_date) updateData.status = 'closed'

      onSubmit(updateData)
    } else {
      const createData: CreatePositionRequest = {
        ticker: formData.ticker.toUpperCase(),
        quantity: parseFloat(formData.quantity),
        entry_price: parseFloat(formData.entry_price),
        entry_date: formData.entry_date,
        notes: formData.notes || undefined,
      }
      onSubmit(createData)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={isEditing ? 'EDIT POSITION' : 'ADD POSITION'}
      maxWidth="500px"
    >
      <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block mb-2 text-primary text-sm">
                TICKER
              </label>
              <div className="relative">
                <Input
                  value={formData.ticker}
                  onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                  placeholder="e.g., AAPL"
                  disabled={isEditing}
                  className={`pr-10 ${
                    tickerValidation.status === 'valid'
                      ? 'border-green-600'
                      : tickerValidation.status === 'invalid'
                        ? 'border-destructive'
                        : ''
                  }`}
                />
                {!isEditing && formData.ticker && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {tickerValidation.status === 'validating' && (
                      <Loader size={16} className="text-primary animate-spin" />
                    )}
                    {tickerValidation.status === 'valid' && <Check size={16} className="text-green-600" />}
                    {tickerValidation.status === 'invalid' && <AlertCircle size={16} className="text-destructive" />}
                  </div>
                )}
              </div>
              {tickerValidation.message && (
                <div className={`text-xs mt-1 font-mono ${
                  tickerValidation.status === 'valid' ? 'text-green-600' : 'text-destructive'
                }`}>
                  {tickerValidation.message}
                </div>
              )}
              {tickerValidation.status === 'valid' && tickerValidation.currentPrice && (
                <button
                  type="button"
                  onClick={handleUseCurrentPrice}
                  className="mt-2 px-2 py-1 text-xs text-primary bg-transparent border border-primary cursor-pointer font-mono hover:bg-primary/10 transition-colors"
                >
                  Use Current Price (${tickerValidation.currentPrice.toFixed(2)})
                </button>
              )}
              {errors.ticker && (
                <div className="text-destructive text-xs mt-1">
                  {errors.ticker}
                </div>
              )}
            </div>

            <div>
              <label className="block mb-2 text-primary text-sm">
                QUANTITY
              </label>
              <Input
                type="number"
                step="0.0001"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="e.g., 100"
              />
              {errors.quantity && (
                <div className="text-destructive text-xs mt-1">
                  {errors.quantity}
                </div>
              )}
            </div>

            {!isEditing && (
              <>
                <div>
                  <label className="block mb-2 text-primary text-sm">
                    ENTRY PRICE
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.entry_price}
                      onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
                      placeholder="e.g., 150.00"
                    />
                    {priceAutoFillStatus === 'loading' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader size={16} className="text-primary animate-spin" />
                      </div>
                    )}
                  </div>
                  {priceAutoFillMessage && (
                    <div className={`text-xs mt-1 font-mono ${
                      priceAutoFillStatus === 'success' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {priceAutoFillMessage}
                    </div>
                  )}
                  {errors.entry_price && (
                    <div className="text-destructive text-xs mt-1">
                      {errors.entry_price}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-primary text-sm">
                    ENTRY DATE
                  </label>
                  <Input
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                  />
                  {errors.entry_date && (
                    <div className="text-destructive text-xs mt-1">
                      {errors.entry_date}
                    </div>
                  )}
                </div>
              </>
            )}

            {isEditing && (
              <>
                <div>
                  <label className="block mb-2 text-primary text-sm">
                    EXIT PRICE (Optional)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.exit_price}
                    onChange={(e) => setFormData({ ...formData, exit_price: e.target.value })}
                    placeholder="e.g., 175.00"
                  />
                  {errors.exit_price && (
                    <div className="text-destructive text-xs mt-1">
                      {errors.exit_price}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-primary text-sm">
                    EXIT DATE (Optional)
                  </label>
                  <Input
                    type="date"
                    value={formData.exit_date}
                    onChange={(e) => setFormData({ ...formData, exit_date: e.target.value })}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block mb-2 text-primary text-sm">
                NOTES (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes about this position"
                className="w-full p-3 bg-secondary border border-input text-foreground font-mono text-sm resize-y min-h-[80px] rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex gap-4 mt-4">
              <Button type="submit" className="flex-1">
                {isEditing ? 'UPDATE' : 'ADD POSITION'}
              </Button>
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                className="flex-1"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </form>
    </Modal>
  )
}

