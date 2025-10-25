import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalyses, useCreateAnalysis } from '../../hooks/useAnalyses'
import { useAnalysisStore } from '../../stores/analysisStore'

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success'
  content: string
}

export const Terminal: React.FC = () => {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'output', content: 'LITADEL TERMINAL v1.0.0' },
    { type: 'output', content: 'Type /help for available commands' },
    { type: 'output', content: '' },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [awaitingInput, setAwaitingInput] = useState<{
    type: 'date' | 'confirm'
    command: string
    ticker?: string
  } | null>(null)

  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const createAnalysis = useCreateAnalysis()
  const { data: analyses } = useAnalyses()
  const activeAnalyses = useAnalysisStore((state) => state.activeAnalyses)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])

  const addLine = (type: TerminalLine['type'], content: string) => {
    setLines((prev) => [...prev, { type, content }])
  }

  const executeCommand = (cmd: string) => {
    addLine('input', `> ${cmd}`)

    const parts = cmd.trim().split(/\s+/)
    const command = parts[0].toLowerCase()
    const args = parts.slice(1)

    // Handle awaiting input (like date entry)
    if (awaitingInput) {
      if (awaitingInput.type === 'date') {
        handleDateInput(cmd.trim())
        return
      }
      return
    }

    switch (command) {
      case '/help':
        showHelp()
        break
      case '/new':
        if (args.length === 0) {
          addLine('error', 'Usage: /new <ticker>')
          addLine('output', 'Example: /new BTC')
        } else {
          promptForDate(args[0].toUpperCase())
        }
        break
      case '/list':
        listAnalyses()
        break
      case '/status':
        if (args.length === 0) {
          showActiveStatus()
        } else {
          showAnalysisStatus(args[0])
        }
        break
      case '/view':
        if (args.length === 0) {
          addLine('error', 'Usage: /view <analysis_id>')
        } else {
          viewAnalysis(args[0])
        }
        break
      case '/tickers':
        showTickers()
        break
      case '/clear':
        setLines([])
        break
      case '/settings':
        navigate('/settings')
        addLine('success', 'Navigating to settings...')
        break
      case '/analyses':
        navigate('/analyses')
        addLine('success', 'Navigating to analyses...')
        break
      case '':
        // Empty command, do nothing
        break
      default:
        addLine('error', `Unknown command: ${command}`)
        addLine('output', 'Type /help for available commands')
    }
  }

  const showHelp = () => {
    addLine('output', '')
    addLine('success', 'AVAILABLE COMMANDS:')
    addLine('output', '  /help              - Show this help message')
    addLine('output', '  /new <ticker>      - Create new analysis')
    addLine('output', '  /list              - List all analyses')
    addLine('output', '  /status [id]       - Show analysis status')
    addLine('output', '  /view <id>         - View analysis details')
    addLine('output', '  /tickers           - Show common tickers')
    addLine('output', '  /analyses          - Go to analyses page')
    addLine('output', '  /settings          - Go to settings page')
    addLine('output', '  /clear             - Clear terminal')
    addLine('output', '')
  }

  const promptForDate = (ticker: string) => {
    addLine('output', `Creating analysis for ${ticker}`)
    addLine('output', 'Enter date (YYYY-MM-DD) or press Enter for today:')
    setAwaitingInput({ type: 'date', command: 'new', ticker })
  }

  const handleDateInput = (dateInput: string) => {
    if (!awaitingInput?.ticker) return

    const ticker = awaitingInput.ticker
    let date = new Date().toISOString().split('T')[0]

    if (dateInput.trim()) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
        addLine('error', 'Invalid date format. Use YYYY-MM-DD')
        setAwaitingInput(null)
        return
      }
      date = dateInput.trim()
    }

    addLine('output', `Creating analysis for ${ticker} on ${date}...`)

    createAnalysis.mutate(
      { ticker, analysis_date: date },
      {
        onSuccess: (data) => {
          addLine('success', `✓ Analysis created: ${data.id.slice(0, 8)}`)
          addLine('output', `Status: ${data.status}`)
          addLine('output', '')
        },
        onError: (error: any) => {
          addLine('error', `✗ Failed: ${error.response?.data?.detail || error.message}`)
          addLine('output', '')
        },
      }
    )

    setAwaitingInput(null)
  }

  const listAnalyses = () => {
    if (!analyses?.items || analyses.items.length === 0) {
      addLine('output', 'No analyses found')
      return
    }

    addLine('output', '')
    addLine('success', `ANALYSES (${analyses.items.length}):`)
    analyses.items.slice(0, 10).forEach((analysis) => {
      const status = analysis.status.toUpperCase().padEnd(10)
      const id = analysis.id.slice(0, 8)
      const ticker = analysis.ticker.padEnd(6)
      addLine('output', `  ${id}  ${ticker}  ${status}  ${analysis.analysis_date}`)
    })
    if (analyses.items.length > 10) {
      addLine('output', `  ... and ${analyses.items.length - 10} more`)
    }
    addLine('output', '')
  }

  const showActiveStatus = () => {
    const active = Array.from(activeAnalyses.values())
    if (active.length === 0) {
      addLine('output', 'No active analyses')
      return
    }

    addLine('output', '')
    addLine('success', 'ACTIVE ANALYSES:')
    active.forEach((analysis) => {
      const id = analysis.id.slice(0, 8)
      const status = analysis.status.toUpperCase()
      const progress = analysis.progress_percentage || 0
      addLine('output', `  ${id}  ${analysis.ticker}  ${status}  ${progress}%`)
    })
    addLine('output', '')
  }

  const showAnalysisStatus = (id: string) => {
    const analysis = activeAnalyses.get(id) || analyses?.items.find((a) => a.id.startsWith(id))

    if (!analysis) {
      addLine('error', `Analysis not found: ${id}`)
      return
    }

    addLine('output', '')
    addLine('success', `ANALYSIS ${analysis.id.slice(0, 8)}:`)
    addLine('output', `  Ticker:   ${analysis.ticker}`)
    addLine('output', `  Date:     ${analysis.analysis_date}`)
    addLine('output', `  Status:   ${analysis.status.toUpperCase()}`)
    if (analysis.progress_percentage) {
      addLine('output', `  Progress: ${analysis.progress_percentage}%`)
    }
    if (analysis.current_agent) {
      addLine('output', `  Agent:    ${analysis.current_agent}`)
    }
    addLine('output', '')
  }

  const viewAnalysis = (id: string) => {
    const analysis = analyses?.items.find((a) => a.id.startsWith(id))
    if (!analysis) {
      addLine('error', `Analysis not found: ${id}`)
      return
    }

    navigate(`/analyses/${analysis.id}`)
    addLine('success', `Navigating to analysis ${id}...`)
  }

  const showTickers = () => {
    addLine('output', '')
    addLine('success', 'COMMON TICKERS:')
    addLine('output', '  Stocks:  AAPL MSFT GOOGL AMZN TSLA NVDA')
    addLine('output', '  Crypto:  BTC ETH SOL ADA DOT')
    addLine('output', '  Commodities: BRENT WTI GOLD')
    addLine('output', '')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      executeCommand(input)
      setHistory((prev) => [...prev, input])
      setHistoryIndex(-1)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setInput(history[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= history.length) {
          setHistoryIndex(-1)
          setInput('')
        } else {
          setHistoryIndex(newIndex)
          setInput(history[newIndex])
        }
      }
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        border: '1px solid rgba(77, 166, 255, 0.3)',
        backgroundColor: '#0a0e14',
      }}
    >
      {/* Terminal output */}
      <div
        ref={terminalRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.75rem',
          lineHeight: '1.5',
        }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              color:
                line.type === 'input'
                  ? '#4da6ff'
                  : line.type === 'error'
                    ? '#ff4444'
                    : line.type === 'success'
                      ? '#00d4ff'
                      : '#2a3e4a',
              marginBottom: line.content === '' ? '0.5rem' : '0',
            }}
          >
            {line.content || '\u00A0'}
          </div>
        ))}
      </div>

      {/* Terminal input */}
      <form
        onSubmit={handleSubmit}
        style={{
          borderTop: '1px solid rgba(77, 166, 255, 0.3)',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span
          style={{
            color: '#00d4ff',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.875rem',
          }}
        >
          &gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#4da6ff',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.875rem',
          }}
          placeholder={awaitingInput ? 'Enter value...' : 'Type /help for commands'}
        />
      </form>
    </div>
  )
}
