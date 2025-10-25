import React, { useState } from 'react'
import {
  ChevronRight,
  Code,
  Eye,
  Settings,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Zap
} from 'lucide-react'

// Custom YAML syntax highlighter component
const YAMLHighlighter: React.FC<{ code: string }> = ({ code }) => {
  const highlightYAML = (yamlCode: string) => {
    const lines = yamlCode.split('\n')

    return lines.map((line, idx) => {
      // Comments
      if (line.trim().startsWith('#')) {
        return (
          <div key={idx} style={{ color: '#6a9955' }}>
            {line}
          </div>
        )
      }

      // Keys (everything before :)
      const keyMatch = line.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*):/)
      if (keyMatch) {
        const indent = keyMatch[1]
        const key = keyMatch[2]
        const rest = line.substring(keyMatch[0].length)

        return (
          <div key={idx}>
            <span>{indent}</span>
            <span style={{ color: '#9cdcfe' }}>{key}</span>
            <span style={{ color: '#d4d4d4' }}>:</span>
            <span style={{ color: rest.trim().startsWith('#') ? '#6a9955' : '#ce9178' }}>{rest}</span>
          </div>
        )
      }

      // List items
      if (line.trim().startsWith('- ')) {
        const indent = line.match(/^(\s*)/)?.[1] || ''
        const rest = line.substring(indent.length + 2)

        return (
          <div key={idx}>
            <span>{indent}</span>
            <span style={{ color: '#569cd6' }}>- </span>
            <span style={{ color: '#ce9178' }}>{rest}</span>
          </div>
        )
      }

      // Default
      return (
        <div key={idx} style={{ color: '#d4d4d4' }}>
          {line}
        </div>
      )
    })
  }

  return (
    <div style={{
      backgroundColor: '#1e1e1e',
      padding: '1.5rem',
      borderRadius: '8px',
      overflow: 'auto',
      maxHeight: '600px',
      fontFamily: 'Consolas, Monaco, monospace',
      fontSize: '0.875rem',
      lineHeight: '1.5',
    }}>
      <div style={{ display: 'table', width: '100%' }}>
        <div style={{ display: 'table-row-group' }}>
          {code.split('\n').map((_, idx) => (
            <div key={idx} style={{ display: 'table-row' }}>
              <div style={{
                display: 'table-cell',
                paddingRight: '1rem',
                textAlign: 'right',
                color: '#858585',
                userSelect: 'none',
                minWidth: '3em',
              }}>
                {idx + 1}
              </div>
              <div style={{ display: 'table-cell', width: '100%' }}>
                {highlightYAML(code)[idx]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface StrategyVisualizerProps {
  yamlContent: string
}

export const StrategyVisualizer: React.FC<StrategyVisualizerProps> = ({ yamlContent }) => {
  const [viewMode, setViewMode] = useState<'visual' | 'yaml'>('visual')

  // Parse YAML to extract strategy details
  interface StrategyRule {
    type: string
    description?: string
  }

  interface Strategy {
    name: string
    description: string
    universe: string[]
    entry_rules: StrategyRule[]
    exit_rules: StrategyRule[]
    risk_management: Record<string, string>
    parameters: Record<string, string>
    preferences: Record<string, string>
  }

  const parseStrategy = (): Strategy | null => {
    try {
      const lines = yamlContent.split('\n')
      const strategy: Strategy = {
        name: '',
        description: '',
        universe: [],
        entry_rules: [],
        exit_rules: [],
        risk_management: {},
        parameters: {},
        preferences: {},
      }

      let currentSection = ''
      let currentRule: StrategyRule | null = null

      lines.forEach(line => {
        const trimmed = line.trim()

        if (trimmed.startsWith('name:')) {
          strategy.name = trimmed.split('name:')[1].trim().replace(/['"]/g, '')
        } else if (trimmed.startsWith('description:') && !currentRule) {
          strategy.description = trimmed.split('description:')[1].trim().replace(/['"]/g, '')
        } else if (trimmed.startsWith('universe:')) {
          if (trimmed.includes('AI_MANAGED')) {
            strategy.universe = ['AI_MANAGED']
          }
          currentSection = 'universe'
        } else if (trimmed.startsWith('entry_rules:')) {
          currentSection = 'entry_rules'
        } else if (trimmed.startsWith('exit_rules:')) {
          currentSection = 'exit_rules'
        } else if (trimmed.startsWith('risk_management:')) {
          currentSection = 'risk_management'
        } else if (trimmed.startsWith('parameters:')) {
          currentSection = 'parameters'
        } else if (trimmed.startsWith('preferences:')) {
          currentSection = 'preferences'
        } else if (trimmed.startsWith('- ') && currentSection === 'universe') {
          strategy.universe.push(trimmed.substring(2).trim())
        } else if (trimmed.startsWith('- type:')) {
          const type = trimmed.split(':')[1].trim().replace(/['"]/g, '')
          currentRule = { type }
          if (currentSection === 'entry_rules') {
            strategy.entry_rules.push(currentRule)
          } else if (currentSection === 'exit_rules') {
            strategy.exit_rules.push(currentRule)
          }
        } else if (currentRule && trimmed.startsWith('description:')) {
          currentRule.description = trimmed.split('description:')[1].trim().replace(/['"]/g, '')
        } else if (currentSection === 'risk_management' && trimmed.includes(':') && !trimmed.startsWith('description:')) {
          const [key, value] = trimmed.split(':')
          strategy.risk_management[key.trim()] = value.split('#')[0].trim()
        } else if (currentSection === 'parameters' && trimmed.includes(':') && !trimmed.startsWith('description:')) {
          const [key, value] = trimmed.split(':')
          strategy.parameters[key.trim()] = value.split('#')[0].trim().replace(/['"]/g, '')
        } else if (currentSection === 'preferences' && trimmed.includes(':') && !trimmed.startsWith('description:')) {
          const [key, value] = trimmed.split(':')
          strategy.preferences[key.trim()] = value.split('#')[0].trim().replace(/['"]/g, '')
        }
      })

      return strategy
    } catch (e) {
      console.error('Failed to parse strategy:', e)
      return null
    }
  }

  const strategy = parseStrategy()

  if (!strategy) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        Unable to parse strategy. Please check YAML format.
      </div>
    )
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#1a2a3a',
    border: '1px solid #4da6ff',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1rem',
  }

  const sectionTitleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const ruleItemStyle: React.CSSProperties = {
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    border: '1px solid rgba(0, 212, 255, 0.2)',
    borderRadius: '4px',
    padding: '0.75rem',
    marginBottom: '0.5rem',
  }

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    color: '#00d4ff',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    marginRight: '0.5rem',
    marginBottom: '0.5rem',
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* View Mode Toggle */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        borderBottom: '1px solid #2a3e4a',
        paddingBottom: '0.5rem',
      }}>
        <button
          onClick={() => setViewMode('visual')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: viewMode === 'visual' ? 'rgba(0, 212, 255, 0.2)' : 'transparent',
            border: viewMode === 'visual' ? '1px solid #00d4ff' : '1px solid transparent',
            borderRadius: '4px',
            color: viewMode === 'visual' ? '#00d4ff' : '#666',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <Eye size={16} />
          Visual View
        </button>
        <button
          onClick={() => setViewMode('yaml')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: viewMode === 'yaml' ? 'rgba(0, 212, 255, 0.2)' : 'transparent',
            border: viewMode === 'yaml' ? '1px solid #00d4ff' : '1px solid transparent',
            borderRadius: '4px',
            color: viewMode === 'yaml' ? '#00d4ff' : '#666',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <Code size={16} />
          YAML Source
        </button>
      </div>

      {viewMode === 'visual' ? (
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {/* Strategy Header */}
          <div style={{ ...cardStyle, borderColor: '#00d4ff', borderWidth: '2px' }}>
            <h3 style={{ color: '#00d4ff', fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              {strategy.name}
            </h3>
            <p style={{ color: '#8899aa', fontSize: '0.875rem', lineHeight: '1.5' }}>
              {strategy.description}
            </p>
          </div>

          {/* Universe */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <Target size={16} />
              Trading Universe
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {strategy.universe[0] === 'AI_MANAGED' ? (
                <div style={{
                  ...badgeStyle,
                  backgroundColor: 'rgba(147, 51, 234, 0.2)',
                  color: '#a78bfa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <Zap size={14} />
                  AI_MANAGED - AI will select assets
                </div>
              ) : (
                strategy.universe.map((ticker: string, idx: number) => (
                  <span key={idx} style={badgeStyle}>
                    {ticker}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Entry Rules */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <TrendingUp size={16} />
              Entry Rules
            </div>
            {strategy.entry_rules.length > 0 ? (
              strategy.entry_rules.map((rule: any, idx: number) => (
                <div key={idx} style={ruleItemStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <ChevronRight size={14} color="#00d4ff" />
                    <span style={{
                      backgroundColor: 'rgba(0, 212, 255, 0.3)',
                      color: '#00d4ff',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}>
                      {rule.type.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ color: '#8899aa', fontSize: '0.875rem', marginLeft: '1.25rem' }}>
                    {rule.description || 'No description provided'}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: '#666', fontSize: '0.875rem', fontStyle: 'italic' }}>
                No entry rules defined
              </p>
            )}
          </div>

          {/* Exit Rules */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <TrendingDown size={16} />
              Exit Rules
            </div>
            {strategy.exit_rules.length > 0 ? (
              strategy.exit_rules.map((rule: any, idx: number) => (
                <div key={idx} style={ruleItemStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <ChevronRight size={14} color="#00d4ff" />
                    <span style={{
                      backgroundColor: 'rgba(0, 212, 255, 0.3)',
                      color: '#00d4ff',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}>
                      {rule.type.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ color: '#8899aa', fontSize: '0.875rem', marginLeft: '1.25rem' }}>
                    {rule.description || 'No description provided'}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: '#666', fontSize: '0.875rem', fontStyle: 'italic' }}>
                No exit rules defined
              </p>
            )}
          </div>

          {/* Risk Management */}
          {Object.keys(strategy.risk_management).length > 0 && (
            <div style={cardStyle}>
              <div style={sectionTitleStyle}>
                <Shield size={16} />
                Risk Management
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {Object.entries(strategy.risk_management).map(([key, value]: [string, any], idx) => (
                  <div key={idx} style={{ ...ruleItemStyle, marginBottom: 0 }}>
                    <div style={{ color: '#00d4ff', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 'bold' }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parameters & Preferences */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {Object.keys(strategy.parameters).length > 0 && (
              <div style={cardStyle}>
                <div style={sectionTitleStyle}>
                  <Settings size={16} />
                  Parameters
                </div>
                {Object.entries(strategy.parameters).map(([key, value]: [string, any], idx) => (
                  <div key={idx} style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666', fontSize: '0.75rem' }}>
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span style={{ color: '#00d4ff', fontSize: '0.875rem', marginLeft: '0.5rem', fontWeight: 'bold' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {Object.keys(strategy.preferences).length > 0 && (
              <div style={cardStyle}>
                <div style={sectionTitleStyle}>
                  <Settings size={16} />
                  Preferences
                </div>
                {Object.entries(strategy.preferences).map(([key, value]: [string, any], idx) => (
                  <div key={idx} style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666', fontSize: '0.75rem' }}>
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span style={{ color: '#00d4ff', fontSize: '0.875rem', marginLeft: '0.5rem', fontWeight: 'bold' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #4da6ff',
        }}>
          <YAMLHighlighter code={yamlContent} />
        </div>
      )}
    </div>
  )
}

