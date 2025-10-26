import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { ASCIIBox } from '../components/ui/ASCIIBox'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { KeyValueRow } from '../components/common/KeyValueRow'
import { Heading } from '../design-system'
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
    <div className="max-w-4xl">
      <Heading level={1} className="mb-xl">
        SETTINGS
      </Heading>

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
              <KeyValueRow
                label="Authentication Method"
                value={authMethod === 'jwt' ? 'USERNAME / PASSWORD' : authMethod === 'apikey' ? 'API KEY' : 'NOT AUTHENTICATED'}
                valueBold={true}
              />

              {authMethod === 'jwt' && username && (
                <KeyValueRow
                  label="Logged in as"
                  value={username}
                />
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
              <KeyValueRow
                label="Version"
                value="1.0.0"
                style={{ paddingBottom: '0.75rem' }}
              />
              <KeyValueRow
                label="Build"
                value="2025.10.21"
                style={{ paddingBottom: '0.75rem' }}
              />
              <KeyValueRow
                label="Environment"
                value={import.meta.env.MODE}
                style={{ paddingBottom: '0.75rem' }}
              />
              <KeyValueRow
                label="Status"
                value="OPERATIONAL"
                divider={false}
              />
            </div>
          </div>
        </ASCIIBox>
      </div>
    </div>
  )
}
