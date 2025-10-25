import React from 'react'
import { useNavigate } from 'react-router-dom'
import { SystemMetrics } from '../components/dashboard/SystemMetrics'
import { RecentActivity } from '../components/dashboard/RecentActivity'
import { Terminal } from '../components/terminal/Terminal'
import { Plus } from 'lucide-react'
import { LOGO_ASCII } from '../utils/ascii'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.5rem' }}>
      {/* Welcome header */}
      <div className="border border-terminal-border p-6">
        <pre
          style={{
            color: '#4da6ff',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.75rem',
            lineHeight: '1.2',
            marginBottom: '1.5rem',
          }}
        >
          {LOGO_ASCII}
        </pre>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: '#4da6ff',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              CONTROL CENTER
            </h1>
            <p
              style={{
                color: '#2a3e4a',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.875rem',
              }}
            >
              Multi-Agent Trading Analysis System v1.0.0
            </p>
          </div>
          <button
            onClick={() => navigate('/analyses/create')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              border: '2px solid #4da6ff',
              backgroundColor: 'transparent',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(77, 166, 255, 0.1)'
              e.currentTarget.style.borderColor = '#00d4ff'
              e.currentTarget.style.color = '#00d4ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = '#4da6ff'
              e.currentTarget.style.color = '#4da6ff'
            }}
          >
            <Plus size={18} />
            NEW ANALYSIS
          </button>
        </div>
      </div>

      {/* Metrics, Activity, and Terminal */}
      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(77, 166, 255, 0.3)',
            }}
          >
            SYSTEM METRICS
          </div>
          <SystemMetrics />
        </div>
        <div
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}
        >
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(77, 166, 255, 0.3)',
            }}
          >
            RECENT ACTIVITY
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <RecentActivity />
          </div>
        </div>
        <div style={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(77, 166, 255, 0.3)',
            }}
          >
            TERMINAL
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Terminal />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="border border-terminal-border p-6" style={{ marginTop: 'auto' }}>
        <div
          style={{
            fontSize: '1rem',
            fontWeight: 'bold',
            color: '#4da6ff',
            fontFamily: 'JetBrains Mono, monospace',
            marginBottom: '1rem',
            textAlign: 'center',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(77, 166, 255, 0.3)',
          }}
        >
          QUICK LINKS
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/analyses')}
            style={{
              border: '1px solid rgba(77, 166, 255, 0.3)',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4da6ff'
              e.currentTarget.style.backgroundColor = 'rgba(77, 166, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(77, 166, 255, 0.3)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            View All Analyses
          </button>
          <button
            onClick={() => navigate('/analyses/create')}
            style={{
              border: '1px solid rgba(77, 166, 255, 0.3)',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: '#00d4ff',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#00d4ff'
              e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(77, 166, 255, 0.3)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            Create Analysis
          </button>
          <button
            onClick={() => navigate('/settings')}
            style={{
              border: '1px solid rgba(77, 166, 255, 0.3)',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4da6ff'
              e.currentTarget.style.backgroundColor = 'rgba(77, 166, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(77, 166, 255, 0.3)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            Settings
          </button>
          <button
            style={{
              border: '1px solid rgba(77, 166, 255, 0.3)',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: '#2a3e4a',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875rem',
              cursor: 'not-allowed',
            }}
          >
            Documentation
          </button>
        </div>
      </div>
    </div>
  )
}
