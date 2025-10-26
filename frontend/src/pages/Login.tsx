import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { api } from '../services/api'
import { toast } from 'sonner'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { setJwtToken, setApiKey } = useAuthStore()

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
      toast.success(`Welcome back, ${response.username}!`)
      navigate('/analyses')
    } catch (error: any) {
      toast.error(error.detail || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim())
      toast.success('API Key configured')
      navigate('/analyses')
    }
  }

  return (
    <div className="max-w-[600px] mx-auto mt-16">
      <h1 className="text-4xl font-bold text-primary font-mono mb-8 text-center">
        TRADING AGENTS
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>AUTHENTICATION</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Username / Password</TabsTrigger>
              <TabsTrigger value="apikey">API Key</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="username">USERNAME</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <Label htmlFor="password">PASSWORD</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'LOGGING IN...' : 'LOGIN'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="apikey">
              <form onSubmit={handleApiKeySubmit} className="space-y-4">
                <div>
                  <Label htmlFor="apikey">API KEY</Label>
                  <Input
                    id="apikey"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    required
                    placeholder="Enter API key"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Contact admin for an API key
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  CONNECT
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
