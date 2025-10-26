import {
  Briefcase,
  Building2,
  FileText,
  Globe,
  MessageSquare,
  Newspaper,
  ShieldAlert,
  Target,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ReportCategory = 'market' | 'sentiment' | 'investment' | 'risk' | 'decision' | 'other'

export interface ReportTypeConfig {
  label: string
  icon: LucideIcon
  category: ReportCategory
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
  description?: string
}

export const REPORT_TYPES: Record<string, ReportTypeConfig> = {
  // Trade Decisions
  FINAL_TRADE_DECISION: {
    label: 'Final Trade Decision',
    icon: Target,
    category: 'decision',
    variant: 'default',
    description: 'Final trading recommendation',
  },
  final_trade_decision: {
    label: 'Final Trade Decision',
    icon: Target,
    category: 'decision',
    variant: 'default',
    description: 'Final trading recommendation',
  },
  TRADE_DECISION: {
    label: 'Trade Decision',
    icon: Target,
    category: 'decision',
    variant: 'default',
    description: 'Trading recommendation',
  },
  trade_decision: {
    label: 'Trade Decision',
    icon: Target,
    category: 'decision',
    variant: 'default',
    description: 'Trading recommendation',
  },

  // Market Analysis
  MACRO_REPORT: {
    label: 'Macro Analysis',
    icon: Globe,
    category: 'market',
    variant: 'secondary',
    description: 'Macroeconomic analysis',
  },
  macro_report: {
    label: 'Macro Analysis',
    icon: Globe,
    category: 'market',
    variant: 'secondary',
    description: 'Macroeconomic analysis',
  },
  MARKET_REPORT: {
    label: 'Market Analysis',
    icon: TrendingUp,
    category: 'market',
    variant: 'secondary',
    description: 'Market trend analysis',
  },
  market_report: {
    label: 'Market Analysis',
    icon: TrendingUp,
    category: 'market',
    variant: 'secondary',
    description: 'Market trend analysis',
  },
  FUNDAMENTALS_REPORT: {
    label: 'Fundamentals Analysis',
    icon: Building2,
    category: 'market',
    variant: 'secondary',
    description: 'Fundamental analysis',
  },
  fundamentals_report: {
    label: 'Fundamentals Analysis',
    icon: Building2,
    category: 'market',
    variant: 'secondary',
    description: 'Fundamental analysis',
  },

  // Sentiment
  NEWS_REPORT: {
    label: 'News Analysis',
    icon: Newspaper,
    category: 'sentiment',
    variant: 'outline',
    description: 'News sentiment analysis',
  },
  news_report: {
    label: 'News Analysis',
    icon: Newspaper,
    category: 'sentiment',
    variant: 'outline',
    description: 'News sentiment analysis',
  },
  SENTIMENT_REPORT: {
    label: 'Sentiment Analysis',
    icon: MessageSquare,
    category: 'sentiment',
    variant: 'outline',
    description: 'Market sentiment analysis',
  },
  sentiment_report: {
    label: 'Sentiment Analysis',
    icon: MessageSquare,
    category: 'sentiment',
    variant: 'outline',
    description: 'Market sentiment analysis',
  },
  social_media_report: {
    label: 'Social Media Analysis',
    icon: MessageSquare,
    category: 'sentiment',
    variant: 'outline',
    description: 'Social media sentiment',
  },

  // Investment Plans
  INVESTMENT_PLAN: {
    label: 'Investment Plan',
    icon: Briefcase,
    category: 'investment',
    variant: 'secondary',
    description: 'Strategic investment plan',
  },
  investment_plan: {
    label: 'Investment Plan',
    icon: Briefcase,
    category: 'investment',
    variant: 'secondary',
    description: 'Strategic investment plan',
  },
  TRADER_INVESTMENT_PLAN: {
    label: 'Trader Investment Plan',
    icon: Briefcase,
    category: 'investment',
    variant: 'secondary',
    description: 'Trader investment strategy',
  },
  trader_investment_plan: {
    label: 'Trader Investment Plan',
    icon: Briefcase,
    category: 'investment',
    variant: 'secondary',
    description: 'Trader investment strategy',
  },

  // Risk
  RISK_REPORT: {
    label: 'Risk Analysis',
    icon: ShieldAlert,
    category: 'risk',
    variant: 'destructive',
    description: 'Risk assessment',
  },
  risk_report: {
    label: 'Risk Analysis',
    icon: ShieldAlert,
    category: 'risk',
    variant: 'destructive',
    description: 'Risk assessment',
  },
  risk_analysis: {
    label: 'Risk Analysis',
    icon: ShieldAlert,
    category: 'risk',
    variant: 'destructive',
    description: 'Risk assessment',
  },
}

export const getReportConfig = (reportType: string): ReportTypeConfig => {
  return (
    REPORT_TYPES[reportType] || {
      label: reportType.replace(/_/g, ' ').toUpperCase(),
      icon: FileText,
      category: 'other',
      variant: 'outline',
      description: 'Analysis report',
    }
  )
}

export const categorizeReportsByType = (reportType: string): ReportCategory => {
  const config = getReportConfig(reportType)
  return config.category
}

