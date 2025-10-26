import React, { useRef, useState } from 'react'
import { AlertCircle, Check, Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal-wrapper'

interface BulkImportProps {
  onImport: (file: File) => Promise<{
    success: boolean
    added_count: number
    error_count: number
    errors: string[]
  }>
  onClose: () => void
}

export const BulkImport: React.FC<BulkImportProps> = ({ onImport, onClose }) => {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    added_count: number
    error_count: number
    errors: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    try {
      const importResult = await onImport(file)
      setResult(importResult)
    } catch (error: any) {
      setResult({
        success: false,
        added_count: 0,
        error_count: 1,
        errors: [error.detail || 'Import failed'],
      })
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = `ticker,quantity,entry_price,entry_date,notes
AAPL,100,150.00,2024-01-15,Apple stock position
BTC,0.5,45000.00,2024-02-20,Bitcoin investment
TSLA,50,200.00,2024-03-10,Tesla position`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'portfolio_import_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="BULK IMPORT POSITIONS"
      maxWidth="600px"
    >
      {/* Instructions */}
        <div
          style={{
            backgroundColor: 'hsl(var(--secondary))',
            border: '1px solid hsl(var(--border))',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <h3 className="text-sm text-primary mb-2">
            HOW TO IMPORT:
          </h3>
          <ol
            style={{
              fontSize: '0.75rem',
              color: '#fff',
              paddingLeft: '1.5rem',
              margin: 0,
            }}
          >
            <li>Download the CSV template below</li>
            <li>Fill in your positions (ticker, quantity, entry_price, entry_date, notes)</li>
            <li>Save the file and upload it here</li>
            <li>Review the results and fix any errors if needed</li>
          </ol>

          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={downloadTemplate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid hsl(var(--primary))',
                color: 'hsl(var(--primary))',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              <Download size={14} />
              <span>DOWNLOAD TEMPLATE</span>
            </button>
          </div>
        </div>

        {/* File Upload */}
        {!result && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'hsl(var(--primary))',
                fontSize: '0.875rem',
              }}
            >
              SELECT CSV FILE
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed hsl(var(--border))',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--primary))'
                e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--border))'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Upload size={48} className="text-primary mx-auto mb-4" />
              <p className="text-primary text-sm mb-2">
                {file ? file.name : 'Click to select CSV file'}
              </p>
              <p style={{ color: '#2a3e4a', fontSize: '0.75rem' }}>
                or drag and drop your CSV file here
              </p>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div
            style={{
              backgroundColor: 'hsl(var(--secondary))',
              border: `2px solid ${result.added_count > 0 ? '#00ff00' : '#ff0000'}`,
              padding: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              {result.added_count > 0 ? (
                <Check size={24} color="#00ff00" />
              ) : (
                <AlertCircle size={24} color="#ff0000" />
              )}
              <h3
                style={{
                  fontSize: '1rem',
                  color: result.added_count > 0 ? '#00ff00' : '#ff0000',
                }}
              >
                IMPORT COMPLETE
              </h3>
            </div>

            <div style={{ fontSize: '0.875rem', color: '#fff', marginBottom: '1rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#00ff00' }}>✓ Successfully added: </span>
                <span style={{ fontWeight: 'bold' }}>{result.added_count} positions</span>
              </div>
              {result.error_count > 0 && (
                <div>
                  <span style={{ color: '#ff0000' }}>✗ Errors: </span>
                  <span style={{ fontWeight: 'bold' }}>{result.error_count}</span>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.875rem', color: '#ff0000', marginBottom: '0.5rem' }}>
                  ERRORS:
                </h4>
                <div
                  style={{
                    backgroundColor: '#0a0e14',
                    padding: '0.75rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    fontSize: '0.75rem',
                    color: '#ff0000',
                    fontFamily: 'monospace',
                  }}
                >
                  {result.errors.map((error, index) => (
                    <div key={index} style={{ marginBottom: '0.25rem' }}>
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          {!result ? (
            <>
              <Button onClick={handleImport} disabled={!file || importing} style={{ flex: 1 }}>
                {importing ? 'IMPORTING...' : 'IMPORT POSITIONS'}
              </Button>
              <Button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  color: '#2a3e4a',
                  borderColor: '#2a3e4a',
                }}
              >
                CANCEL
              </Button>
            </>
          ) : (
            <Button onClick={onClose} style={{ flex: 1 }}>
              CLOSE
            </Button>
          )}
        </div>
    </Modal>
  )
}

