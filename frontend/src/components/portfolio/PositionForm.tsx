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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#4da6ff',
                  fontSize: '0.875rem',
                }}
              >
                TICKER
              </label>
              <div style={{ position: 'relative' }}>
                <Input
                  value={formData.ticker}
                  onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                  placeholder="e.g., AAPL"
                  disabled={isEditing}
                  style={{
                    paddingRight: '2.5rem',
                    borderColor:
                      tickerValidation.status === 'valid'
                        ? '#00ff00'
                        : tickerValidation.status === 'invalid'
                          ? '#ff0000'
                          : undefined,
                  }}
                />
                {!isEditing && formData.ticker && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    {tickerValidation.status === 'validating' && (
                      <Loader size={16} color="#4da6ff" style={{ animation: 'spin 1s linear infinite' }} />
                    )}
                    {tickerValidation.status === 'valid' && <Check size={16} color="#00ff00" />}
                    {tickerValidation.status === 'invalid' && <AlertCircle size={16} color="#ff0000" />}
                  </div>
                )}
              </div>
              {tickerValidation.message && (
                <div
                  style={{
                    color: tickerValidation.status === 'valid' ? '#00ff00' : '#ff0000',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {tickerValidation.message}
                </div>
              )}
              {tickerValidation.status === 'valid' && tickerValidation.currentPrice && (
                <button
                  type="button"
                  onClick={handleUseCurrentPrice}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    color: '#4da6ff',
                    backgroundColor: 'transparent',
                    border: '1px solid #4da6ff',
                    cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  Use Current Price (${tickerValidation.currentPrice.toFixed(2)})
                </button>
              )}
              {errors.ticker && (
                <div style={{ color: '#ff0000', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.ticker}
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
                }}
              >
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
                <div style={{ color: '#ff0000', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.quantity}
                </div>
              )}
            </div>

            {!isEditing && (
              <>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: '#4da6ff',
                      fontSize: '0.875rem',
                    }}
                  >
                    ENTRY PRICE
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.entry_price}
                      onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
                      placeholder="e.g., 150.00"
                    />
                    {priceAutoFillStatus === 'loading' && (
                      <div
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                      >
                        <Loader size={16} color="#4da6ff" style={{ animation: 'spin 1s linear infinite' }} />
                      </div>
                    )}
                  </div>
                  {priceAutoFillMessage && (
                    <div
                      style={{
                        color: priceAutoFillStatus === 'success' ? '#00ff00' : '#ffaa00',
                        fontSize: '0.75rem',
                        marginTop: '0.25rem',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {priceAutoFillMessage}
                    </div>
                  )}
                  {errors.entry_price && (
                    <div style={{ color: '#ff0000', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {errors.entry_price}
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
                    }}
                  >
                    ENTRY DATE
                  </label>
                  <Input
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                  />
                  {errors.entry_date && (
                    <div style={{ color: '#ff0000', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {errors.entry_date}
                    </div>
                  )}
                </div>
              </>
            )}

            {isEditing && (
              <>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: '#4da6ff',
                      fontSize: '0.875rem',
                    }}
                  >
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
                    <div style={{ color: '#ff0000', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {errors.exit_price}
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
                    }}
                  >
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
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#4da6ff',
                  fontSize: '0.875rem',
                }}
              >
                NOTES (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes about this position"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#1a2a3a',
                  border: '1px solid rgba(77, 166, 255, 0.3)',
                  color: '#fff',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  minHeight: '80px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Button type="submit" style={{ flex: 1 }}>
                {isEditing ? 'UPDATE' : 'ADD POSITION'}
              </Button>
              <Button
                type="button"
                onClick={onCancel}
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
    </Modal>
  )
}

