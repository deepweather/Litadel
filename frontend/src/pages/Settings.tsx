import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { ASCIIBox } from '../components/ui/ASCIIBox'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import toast from 'react-hot-toast'

export const Settings: React.FC = () => {
  const navigate = useNavigate()
  const { apiKey, apiUrl, username, authMethod, setApiKey, setApiUrl, clearAuth } = useAuthStore()
  const [tempApiKey, setTempApiKey] = useState(apiKey || '')
  const [tempApiUrl, setTempApiUrl] = useState(apiUrl)

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim())
      toast.success('API Key saved', {
        style: {
          background: '#1a2a3a',
          color: '#4da6ff',
          border: '1px solid #4da6ff',
          fontFamily: 'JetBrains Mono, monospace',
        },
      })
    }
  }

  const handleSaveApiUrl = () => {
    if (tempApiUrl.trim()) {
      setApiUrl(tempApiUrl.trim())
      toast.success('API URL saved', {
        style: {
          background: '#1a2a3a',
          color: '#4da6ff',
          border: '1px solid #4da6ff',
          fontFamily: 'JetBrains Mono, monospace',
        },
      })
    }
  }

  const handleLogout = () => {
    clearAuth()
    toast.success('Logged out successfully', {
      style: {
        background: '#1a2a3a',
        color: '#4da6ff',
        border: '1px solid #4da6ff',
        fontFamily: 'JetBrains Mono, monospace',
      },
    })
    navigate('/login')
  }

  const handleSwitchToLogin = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <h1
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#4da6ff',
          fontFamily: 'JetBrains Mono, monospace',
          marginBottom: '2rem',
        }}
      >
        SETTINGS
      </h1>

      {/* Current Authentication Status */}
      <div style={{ marginBottom: '2rem' }}>
        <ASCIIBox title="AUTHENTICATION STATUS">
          <div style={{ padding: '1rem' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid rgba(77, 166, 255, 0.2)',
                }}
              >
                <span
                  style={{
                    color: '#5a6e7a',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.875rem',
                  }}
                >
                  Authentication Method
                </span>
                <span
                  style={{
                    color: '#4da6ff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                  }}
                >
                  {authMethod === 'jwt' ? 'USERNAME / PASSWORD' : authMethod === 'apikey' ? 'API KEY' : 'NOT AUTHENTICATED'}
                </span>
              </div>

              {authMethod === 'jwt' && username && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid rgba(77, 166, 255, 0.2)',
                  }}
                >
                  <span
                    style={{
                      color: '#5a6e7a',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.875rem',
                    }}
                  >
                    Logged in as
                  </span>
                  <span
                    style={{
                      color: '#4da6ff',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.875rem',
                    }}
                  >
                    {username}
                  </span>
                </div>
              )}

              {authMethod && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <Button onClick={handleLogout}>LOGOUT</Button>
                  {authMethod === 'apikey' && (
                    <Button onClick={handleSwitchToLogin}>SWITCH TO USER LOGIN</Button>
                  )}
                </div>
              )}

              {!authMethod && (
                <div
                  style={{
                    color: '#ff6b6b',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    padding: '1rem',
                  }}
                >
                  You are not authenticated. Please login or configure an API key.
                </div>
              )}
            </div>
          </div>
        </ASCIIBox>
      </div>

      {/* API Key Configuration */}
      <div style={{ marginBottom: '2rem' }}>
        <ASCIIBox title="API KEY CONFIGURATION">
          <div style={{ padding: '1rem' }}>
            <div
              style={{
                fontSize: '0.875rem',
                color: '#5a6e7a',
                fontFamily: 'JetBrains Mono, monospace',
                marginBottom: '2rem',
              }}
            >
              {authMethod === 'jwt'
                ? 'You are logged in with a user account. You can optionally configure an API key for direct access.'
                : 'Your API key is stored locally in your browser. Never share your API key with others.'}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <Input
                label="API KEY"
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Enter your API key"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Button onClick={handleSaveApiKey}>SAVE API KEY</Button>
              {apiKey && (
                <span
                  style={{
                    color: '#4da6ff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.875rem',
                  }}
                >
                  API Key Configured
                </span>
              )}
            </div>
          </div>
        </ASCIIBox>
      </div>

      {/* API URL Configuration */}
      <div style={{ marginBottom: '2rem' }}>
        <ASCIIBox title="API URL CONFIGURATION">
          <div style={{ padding: '1rem' }}>
            <div
              style={{
                fontSize: '0.875rem',
                color: '#5a6e7a',
                fontFamily: 'JetBrains Mono, monospace',
                marginBottom: '2rem',
              }}
            >
              Configure the base URL for the Trading Agents API server.
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <Input
                label="API URL"
                value={tempApiUrl}
                onChange={(e) => setTempApiUrl(e.target.value)}
                placeholder="http://localhost:8002"
              />
            </div>

            <Button onClick={handleSaveApiUrl}>SAVE API URL</Button>
          </div>
        </ASCIIBox>
      </div>

      {/* Application Info */}
      <div style={{ marginBottom: '2rem' }}>
        <ASCIIBox title="APPLICATION INFO">
          <div style={{ padding: '1rem' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                fontSize: '0.875rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(77, 166, 255, 0.2)',
                  paddingBottom: '0.75rem',
                }}
              >
                <span style={{ color: '#5a6e7a', fontFamily: 'JetBrains Mono, monospace' }}>
                  Version
                </span>
                <span style={{ color: '#4da6ff', fontFamily: 'JetBrains Mono, monospace' }}>
                  1.0.0
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(77, 166, 255, 0.2)',
                  paddingBottom: '0.75rem',
                }}
              >
                <span style={{ color: '#5a6e7a', fontFamily: 'JetBrains Mono, monospace' }}>
                  Build
                </span>
                <span style={{ color: '#4da6ff', fontFamily: 'JetBrains Mono, monospace' }}>
                  2025.10.21
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(77, 166, 255, 0.2)',
                  paddingBottom: '0.75rem',
                }}
              >
                <span style={{ color: '#5a6e7a', fontFamily: 'JetBrains Mono, monospace' }}>
                  Environment
                </span>
                <span style={{ color: '#4da6ff', fontFamily: 'JetBrains Mono, monospace' }}>
                  {import.meta.env.MODE}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ color: '#5a6e7a', fontFamily: 'JetBrains Mono, monospace' }}>
                  Status
                </span>
                <span style={{ color: '#4da6ff', fontFamily: 'JetBrains Mono, monospace' }}>
                  OPERATIONAL
                </span>
              </div>
            </div>
          </div>
        </ASCIIBox>
      </div>
    </div>
  )
}
