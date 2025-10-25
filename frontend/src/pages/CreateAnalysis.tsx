import React from 'react'
import { CreateAnalysisForm } from '../components/analysis/CreateAnalysisForm'

export const CreateAnalysis: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(77, 166, 255, 0.3)',
        }}
      >
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#4da6ff',
            fontFamily: 'JetBrains Mono, monospace',
            marginBottom: '0.5rem',
          }}
        >
          CREATE NEW ANALYSIS
        </h1>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#5a6e7a',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          Configure your multi-agent trading analysis
        </p>
      </div>
      <CreateAnalysisForm />
    </div>
  )
}
