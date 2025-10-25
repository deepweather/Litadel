import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Briefcase,
  LayoutDashboard,
  LineChart,
  Plus,
  Settings,
  TrendingUp,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard size={18} />,
  },
  {
    name: 'Analyses',
    path: '/analyses',
    icon: <LineChart size={18} />,
  },
  {
    name: 'New Analysis',
    path: '/analyses/create',
    icon: <Plus size={18} />,
  },
  {
    name: 'Portfolio',
    path: '/portfolio',
    icon: <Briefcase size={18} />,
  },
  {
    name: 'Backtests',
    path: '/backtests',
    icon: <TrendingUp size={18} />,
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: <Settings size={18} />,
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside
      style={{
        width: '16rem',
        borderRight: '1px solid rgba(77, 166, 255, 0.3)',
        backgroundColor: '#0a0e14',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem',
          height: '100%',
        }}
      >


        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  border: isActive ? '1px solid #4da6ff' : '1px solid transparent',
                  backgroundColor: isActive ? '#1a2a3a' : 'transparent',
                  color: isActive ? '#4da6ff' : '#2a3e4a',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.875rem',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#4da6ff';
                    e.currentTarget.style.borderColor = 'rgba(77, 166, 255, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#2a3e4a';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(77, 166, 255, 0.3)',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              color: '#2a3e4a',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <div>VERSION: 1.0.0</div>
            <div>API: Connected</div>
          </div>
        </div>
      </nav>
    </aside>
  );
};
