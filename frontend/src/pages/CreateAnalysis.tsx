import React, { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CreateAnalysisForm } from '../components/analysis/CreateAnalysisForm'
import { Heading, Text } from '../design-system'

export const CreateAnalysis: React.FC = () => {
  const [searchParams] = useSearchParams()
  const prefilledTicker = useMemo(() => searchParams.get('ticker'), [searchParams])

  return (
    <div className="flex flex-col gap-lg h-full">
      <div className="pb-base border-b border-border">
        <Heading level={1} className="mb-sm">
          {prefilledTicker ? `ANALYZE ${prefilledTicker}` : 'CREATE NEW ANALYSIS'}
        </Heading>
        <Text variant="subdued" size="base">
          Configure your multi-agent trading analysis
        </Text>
      </div>
      <CreateAnalysisForm initialTicker={prefilledTicker || undefined} />
    </div>
  )
}
