// Analysis Domain Types

export const ANALYST_TYPES = ['macro', 'market', 'news', 'fundamentals', 'social'] as const

export type AnalystType = (typeof ANALYST_TYPES)[number]

export const AGENT_NAMES = [
  'Macro Analyst',
  'Market Analyst',
  'News Analyst',
  'Fundamentals Analyst',
  'Social Media Analyst',
  'Bull Researcher',
  'Bear Researcher',
  'Research Manager',
  'Trader',
  'Risky Analyst',
  'Conservative Analyst',
  'Neutral Analyst',
  'Risk Manager',
] as const

export type AgentName = (typeof AGENT_NAMES)[number]

export interface AgentStatus {
  name: AgentName
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number
  startTime?: string
  endTime?: string
}

export interface AnalysisFormData {
  ticker: string
  analysisDate: string
  selectedAnalysts: AnalystType[]
  researchDepth: number
}

export const REPORT_TYPES = [
  'macro_report',
  'market_report',
  'news_report',
  'fundamentals_report',
  'sentiment_report',
  'investment_plan',
] as const

export type ReportType = (typeof REPORT_TYPES)[number]

export interface ReportSection {
  type: ReportType
  title: string
  content: string
}
