import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { ASCIIBox } from '../components/ui/ASCIIBox'
import { FormInput as Input } from '@/components/ui/form-input'
import { Button } from '@/components/ui/button'
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
      toast.success('API Key saved')
    }
  }

  const handleSaveApiUrl = () => {
    if (tempApiUrl.trim()) {
      setApiUrl(tempApiUrl.trim())
      toast.success('API URL saved')
    }
  }

  const handleLogout = () => {
    clearAuth()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const handleSwitchToLogin = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="max-w-4xl">
      <Heading level={1} className="mb-8">
        SETTINGS
      </Heading>

      {/* Current Authentication Status */}
      <div className="mb-8">
        <ASCIIBox title="AUTHENTICATION STATUS">
          <div className="flex flex-col gap-4">
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
              <div className="flex gap-4 mt-2">
                <Button onClick={handleLogout}>LOGOUT</Button>
                {authMethod === 'apikey' && (
                  <Button onClick={handleSwitchToLogin}>SWITCH TO USER LOGIN</Button>
                )}
              </div>
            )}

            {!authMethod && (
              <div className="text-destructive font-mono text-sm text-center p-4">
                You are not authenticated. Please login or configure an API key.
              </div>
            )}
          </div>
        </ASCIIBox>
      </div>

      {/* API Key Configuration */}
      <div className="mb-8">
        <ASCIIBox title="API KEY CONFIGURATION">
          <div className="text-sm text-muted-foreground font-mono mb-8">
            {authMethod === 'jwt'
              ? 'You are logged in with a user account. You can optionally configure an API key for direct access.'
              : 'Your API key is stored locally in your browser. Never share your API key with others.'}
          </div>

          <div className="mb-6">
            <Input
              label="API KEY"
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="Enter your API key"
            />
          </div>

          <div className="flex gap-4 items-center">
            <Button onClick={handleSaveApiKey}>SAVE API KEY</Button>
            {apiKey && (
              <span className="text-foreground font-mono text-sm">
                API Key Configured
              </span>
            )}
          </div>
        </ASCIIBox>
      </div>

      {/* API URL Configuration */}
      <div className="mb-8">
        <ASCIIBox title="API URL CONFIGURATION">
          <div className="text-sm text-muted-foreground font-mono mb-8">
            Configure the base URL for the Trading Agents API server.
          </div>

          <div className="mb-6">
            <Input
              label="API URL"
              value={tempApiUrl}
              onChange={(e) => setTempApiUrl(e.target.value)}
              placeholder="http://localhost:8002"
            />
          </div>

          <Button onClick={handleSaveApiUrl}>SAVE API URL</Button>
        </ASCIIBox>
      </div>

      {/* Application Info */}
      <div className="mb-8">
        <ASCIIBox title="APPLICATION INFO">
          <div className="flex flex-col gap-3 text-sm">
            <KeyValueRow
              label="Version"
              value="1.0.0"
            />
            <KeyValueRow
              label="Build"
              value="2025.10.21"
            />
            <KeyValueRow
              label="Environment"
              value={import.meta.env.MODE}
            />
            <KeyValueRow
              label="Status"
              value="OPERATIONAL"
              divider={false}
            />
          </div>
        </ASCIIBox>
      </div>
    </div>
  )
}
