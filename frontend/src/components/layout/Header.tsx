import React, { useEffect, useState } from 'react'

export const Header: React.FC = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Show time in local timezone consistently (no UTC mixing)
  const currentTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return (
    <header
      style={{
        borderBottom: '1px solid rgba(77, 166, 255, 0.3)',
        backgroundColor: '#0a0e14',
        padding: '0.5rem 1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <img
            src="/litadel.png"
            alt="Litadel"
            style={{
              height: '40px',
              filter: 'brightness(1.5)',
            }}
          />
          <div
            style={{
              fontSize: '0.75rem',
              color: '#2a3e4a',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            Multi-Agent Trading System
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.875rem' }}>
          <div style={{ color: '#00d4ff' }}>
            <span style={{ color: '#2a3e4a' }}>TIME:</span> {currentTime}
          </div>
          <div style={{ color: '#4da6ff' }}>
            <span style={{ color: '#2a3e4a' }}>STATUS:</span> <span>ONLINE</span>
          </div>
        </div>
      </div>
    </header>
  )
}
