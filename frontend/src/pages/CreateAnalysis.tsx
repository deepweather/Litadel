import React, { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CreateAnalysisForm } from '../components/analysis/CreateAnalysisForm'
import { PageHeader } from '../components/layout/PageHeader'

export const CreateAnalysis: React.FC = () => {
  const [searchParams] = useSearchParams()
  const prefilledTicker = useMemo(() => searchParams.get('ticker'), [searchParams])

  return (
    <div className="flex flex-col gap-6 h-full">
      <PageHeader
        title={prefilledTicker ? `ANALYZE ${prefilledTicker}` : 'CREATE NEW ANALYSIS'}
        subtitle="Configure your multi-agent trading analysis"
      />
      <div className="flex-1 overflow-auto">
        <CreateAnalysisForm initialTicker={prefilledTicker || undefined} />
      </div>
    </div>
  )
}
