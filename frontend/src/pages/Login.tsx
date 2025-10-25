import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { ASCIIBox } from '../components/ui/ASCIIBox'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { setJwtToken, setApiKey } = useAuthStore()

  const [authMode, setAuthMode] = useState<'login' | 'apikey'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await api.login(username, password)
      setJwtToken(response.access_token, response.username)

      toast.success(`Welcome back, ${response.username}!`, {
        style: {
          background: '#1a2a3a',
          color: '#4da6ff',
          border: '1px solid #4da6ff',
          fontFamily: 'JetBrains Mono, monospace',
        },
      })

      navigate('/analyses')
    } catch (error: any) {
      toast.error(error.detail || 'Login failed', {
        style: {
          background: '#1a2a3a',
          color: '#ff6b6b',
          border: '1px solid #ff6b6b',
          fontFamily: 'JetBrains Mono, monospace',
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim())

      toast.success('API Key configured', {
        style: {
          background: '#1a2a3a',
          color: '#4da6ff',
          border: '1px solid #4da6ff',
          fontFamily: 'JetBrains Mono, monospace',
        },
      })

      navigate('/analyses')
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto 0' }}>
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#4da6ff',
          fontFamily: 'JetBrains Mono, monospace',
          marginBottom: '2rem',
          textAlign: 'center',
        }}
      >
        TRADING AGENTS
      </h1>

      <ASCIIBox title="AUTHENTICATION">
        <div style={{ padding: '2rem' }}>
          {/* Auth Mode Toggle */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              borderBottom: '1px solid rgba(77, 166, 255, 0.3)',
              paddingBottom: '1rem',
            }}
          >
            <button
              onClick={() => setAuthMode('login')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: authMode === 'login' ? '#4da6ff' : 'transparent',
                color: authMode === 'login' ? '#0a1f2e' : '#4da6ff',
                border: '1px solid #4da6ff',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              USERNAME / PASSWORD
            </button>
            <button
              onClick={() => setAuthMode('apikey')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: authMode === 'apikey' ? '#4da6ff' : 'transparent',
                color: authMode === 'apikey' ? '#0a1f2e' : '#4da6ff',
                border: '1px solid #4da6ff',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              API KEY
            </button>
          </div>

          {/* Login Form */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1.5rem' }}>
                <Input
                  label="USERNAME"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <Input
                  label="PASSWORD"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'LOGGING IN...' : 'LOGIN'}
              </Button>

              <div
                style={{
                  marginTop: '1.5rem',
                  fontSize: '0.75rem',
                  color: '#5a6e7a',
                  fontFamily: 'JetBrains Mono, monospace',
                  textAlign: 'center',
                }}
              >
                Contact your administrator to create an account
              </div>
            </form>
          )}

          {/* API Key Form */}
          {authMode === 'apikey' && (
            <form onSubmit={handleApiKeySubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: '#5a6e7a',
                    fontFamily: 'JetBrains Mono, monospace',
                    marginBottom: '1.5rem',
                  }}
                >
                  Enter your API key for direct access. Your key is stored securely in your
                  browser.
                </div>

                <Input
                  label="API KEY"
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter your API key"
                  required
                />
              </div>

              <div style={{ marginTop: '2rem' }}>
                <Button type="submit">CONNECT WITH API KEY</Button>
              </div>
            </form>
          )}
        </div>
      </ASCIIBox>

      <div
        style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#5a6e7a',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        Multi-Agent Trading Analysis Platform
      </div>
    </div>
  )
}

