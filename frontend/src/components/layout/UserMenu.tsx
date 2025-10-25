import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

export const UserMenu: React.FC = () => {
  const navigate = useNavigate()
  const { username, authMethod, clearAuth } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

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
    setIsOpen(false)
  }

  const handleSettings = () => {
    navigate('/settings')
    setIsOpen(false)
  }

  // Don't show menu if not authenticated
  if (!authMethod) {
    return null
  }

  const displayName = username || 'API User'

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* User Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: isOpen ? 'rgba(77, 166, 255, 0.1)' : 'transparent',
          border: '1px solid #4da6ff',
          color: '#4da6ff',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
          borderRadius: '2px',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(77, 166, 255, 0.05)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'transparent'
          }
        }}
      >
        {/* User Icon SVG */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>{displayName}</span>
        {/* Dropdown arrow */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            minWidth: '200px',
            background: '#0a1f2e',
            border: '1px solid #4da6ff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          }}
        >
          {/* User Info Section */}
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(77, 166, 255, 0.2)',
            }}
          >
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.875rem',
                color: '#4da6ff',
                fontWeight: 'bold',
                marginBottom: '0.25rem',
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.75rem',
                color: '#5a6e7a',
              }}
            >
              {authMethod === 'jwt' ? 'User Account' : 'API Key'}
            </div>
          </div>

          {/* Menu Items */}
          <div>
            <button
              onClick={handleSettings}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                color: '#4da6ff',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.875rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(77, 166, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {/* Settings Icon */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6m-9-9h6m6 0h6m-15.364 6.364l4.243-4.243m6.364 6.364l4.243-4.243M6.636 6.636l4.243 4.243m6.364-6.364l4.243 4.243" />
              </svg>
              Settings
            </button>

            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                borderTop: '1px solid rgba(77, 166, 255, 0.2)',
                color: '#ff6b6b',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.875rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {/* Logout Icon */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

