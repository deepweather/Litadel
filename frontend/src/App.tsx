import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { AnalysisList } from './pages/AnalysisList'
import { AnalysisDetail } from './pages/AnalysisDetail'
import { CreateAnalysis } from './pages/CreateAnalysis'
import { PortfolioList } from './pages/PortfolioList'
import { PortfolioDetail } from './pages/PortfolioDetail'
import { CreatePortfolio } from './pages/CreatePortfolio'
import { BacktestList } from './pages/BacktestList'
import { BacktestDetail } from './pages/BacktestDetail'
import { CreateBacktest } from './pages/CreateBacktest'
import { ChatTradingInterface } from './pages/ChatTradingInterface'
import { AssetDetail } from './pages/AssetDetail'
import { Settings } from './pages/Settings'
import { Login } from './pages/Login'
import { useAuthStore } from './stores/authStore'

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
})

// Auth guard component
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { apiKey, jwtToken } = useAuthStore()

  // Check if user is authenticated with either method
  if (!apiKey && !jwtToken) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/analyses"
              element={
                <RequireAuth>
                  <AnalysisList />
                </RequireAuth>
              }
            />
            <Route
              path="/analyses/create"
              element={
                <RequireAuth>
                  <CreateAnalysis />
                </RequireAuth>
              }
            />
            <Route
              path="/analyses/:id"
              element={
                <RequireAuth>
                  <AnalysisDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/portfolio"
              element={
                <RequireAuth>
                  <PortfolioList />
                </RequireAuth>
              }
            />
            <Route
              path="/portfolio/create"
              element={
                <RequireAuth>
                  <CreatePortfolio />
                </RequireAuth>
              }
            />
            <Route
              path="/portfolio/:id"
              element={
                <RequireAuth>
                  <PortfolioDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/backtests"
              element={
                <RequireAuth>
                  <BacktestList />
                </RequireAuth>
              }
            />
            <Route
              path="/backtests/create"
              element={
                <RequireAuth>
                  <CreateBacktest />
                </RequireAuth>
              }
            />
            <Route
              path="/backtests/chat"
              element={
                <RequireAuth>
                  <ChatTradingInterface />
                </RequireAuth>
              }
            />
            <Route
              path="/backtests/:id"
              element={
                <RequireAuth>
                  <BacktestDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/asset/:ticker"
              element={
                <RequireAuth>
                  <AssetDetail />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}

export default App
