import React from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

const YAMLHighlighter: React.FC<{ code: string }> = ({ code }) => {
  const highlightYAML = (yamlCode: string) => {
    const lines = yamlCode.split('\n')

    return lines.map((line, idx) => {
      if (line.trim().startsWith('#')) {
        return (
          <div key={idx} className="text-green-600">
            {line}
          </div>
        )
      }

      const keyMatch = line.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*):/)
      if (keyMatch) {
        const indent = keyMatch[1]
        const key = keyMatch[2]
        const rest = line.substring(keyMatch[0].length)

        return (
          <div key={idx}>
            <span>{indent}</span>
            <span className="text-blue-400">{key}</span>
            <span className="text-foreground">:</span>
            <span className={rest.trim().startsWith('#') ? 'text-green-600' : 'text-orange-400'}>{rest}</span>
          </div>
        )
      }

      if (line.trim().startsWith('- ')) {
        const indent = line.match(/^(\s*)/)?.[1] || ''
        const rest = line.substring(indent.length + 2)

        return (
          <div key={idx}>
            <span>{indent}</span>
            <span className="text-blue-500">- </span>
            <span className="text-orange-400">{rest}</span>
          </div>
        )
      }

      return (
        <div key={idx} className="text-muted-foreground">
          {line}
        </div>
      )
    })
  }

  return (
    <div className="bg-secondary p-6 rounded-lg overflow-auto max-h-[600px] font-mono text-sm leading-relaxed">
      <div className="table w-full">
        <div className="table-row-group">
          {code.split('\n').map((_, idx) => (
            <div key={idx} className="table-row">
              <div className="table-cell pr-4 text-right text-muted-foreground select-none min-w-[3em]">
                {idx + 1}
              </div>
              <div className="table-cell w-full">
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
      <div className="p-8 text-center text-muted-foreground">
        Unable to parse strategy. Please check YAML format.
      </div>
    )
  }

  return (
    <div className="mt-4">
      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="visual" className="flex items-center gap-2">
            <Eye size={16} />
            Visual View
          </TabsTrigger>
          <TabsTrigger value="yaml" className="flex items-center gap-2">
            <Code size={16} />
            YAML Source
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="max-h-[600px] overflow-y-auto space-y-4">
          {/* Strategy Header */}
          <Card className="border-2 border-blue-500">
            <CardHeader>
              <CardTitle className="text-blue-500 text-xl">{strategy.name}</CardTitle>
              <p className="text-sm text-muted-foreground leading-relaxed">{strategy.description}</p>
            </CardHeader>
          </Card>

          {/* Universe */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wide">
                <Target size={16} />
                Trading Universe
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {strategy.universe[0] === 'AI_MANAGED' ? (
                  <Badge variant="secondary" className="flex items-center gap-2 bg-purple-500/20 text-purple-400 border-purple-400">
                    <Zap size={14} />
                    AI_MANAGED - AI will select assets
                  </Badge>
                ) : (
                  strategy.universe.map((ticker: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-400">
                      {ticker}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Entry Rules */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wide">
                <TrendingUp size={16} />
                Entry Rules
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {strategy.entry_rules.length > 0 ? (
                strategy.entry_rules.map((rule: any, idx: number) => (
                  <div key={idx} className="bg-blue-500/5 border border-blue-500/20 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ChevronRight size={14} className="text-blue-400" />
                      <Badge variant="secondary" className="bg-blue-500/30 text-blue-400 text-xs">
                        {rule.type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {rule.description || 'No description provided'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No entry rules defined</p>
              )}
            </CardContent>
          </Card>

          {/* Exit Rules */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wide">
                <TrendingDown size={16} />
                Exit Rules
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {strategy.exit_rules.length > 0 ? (
                strategy.exit_rules.map((rule: any, idx: number) => (
                  <div key={idx} className="bg-blue-500/5 border border-blue-500/20 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ChevronRight size={14} className="text-blue-400" />
                      <Badge variant="secondary" className="bg-blue-500/30 text-blue-400 text-xs">
                        {rule.type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {rule.description || 'No description provided'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No exit rules defined</p>
              )}
            </CardContent>
          </Card>

          {/* Risk Management */}
          {Object.keys(strategy.risk_management).length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wide">
                  <Shield size={16} />
                  Risk Management
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(strategy.risk_management).map(([key, value]: [string, any], idx) => (
                    <div key={idx} className="bg-blue-500/5 border border-blue-500/20 rounded p-3">
                      <div className="text-blue-400 text-xs mb-1">
                        {key.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div className="text-foreground text-sm font-bold">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parameters & Preferences */}
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(strategy.parameters).length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wide">
                    <Settings size={16} />
                    Parameters
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(strategy.parameters).map(([key, value]: [string, any], idx) => (
                    <div key={idx}>
                      <span className="text-muted-foreground text-xs">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-blue-400 text-sm ml-2 font-bold">
                        {value}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {Object.keys(strategy.preferences).length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wide">
                    <Settings size={16} />
                    Preferences
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(strategy.preferences).map(([key, value]: [string, any], idx) => (
                    <div key={idx}>
                      <span className="text-muted-foreground text-xs">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-blue-400 text-sm ml-2 font-bold">
                        {value}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="yaml">
          <div className="rounded-lg overflow-hidden border border-primary">
            <YAMLHighlighter code={yamlContent} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
