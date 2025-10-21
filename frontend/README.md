# Trading Agents Terminal Frontend

A React-based terminal/ASCII-style frontend for the Trading Agents multi-agent trading analysis system.

## Features

- **Terminal-Inspired UI**: Bloomberg Terminal-style interface with ASCII aesthetics
- **Real-Time Updates**: WebSocket integration for live analysis progress
- **Agent Pipeline Visualization**: Visual representation of the multi-agent workflow
- **Analysis Management**: Create, monitor, and manage trading analyses
- **Report Viewer**: View and download analysis reports
- **Log Viewer**: Real-time execution logs with filtering

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** with custom terminal theme
- **TanStack Query** (React Query) for data fetching
- **Zustand** for state management
- **React Router** for navigation
- **Lucide React** for icons
- **Framer Motion** for animations

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Trading Agents API server running (default: http://localhost:8002)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at http://localhost:5173

### Configuration

Create a `.env` file:

```
VITE_API_URL=http://localhost:8002
```

### First Time Setup

1. Navigate to the Settings page
2. Enter your API key (get one from the API server)
3. Configure the API URL if different from default
4. Start creating analyses!

## Project Structure

```
src/
├── components/
│   ├── layout/         # Header, Sidebar, StatusBar, Layout
│   ├── ui/             # Reusable UI components (ASCIIBox, Button, etc.)
│   ├── analysis/       # Analysis-related components
│   ├── agents/         # Agent pipeline visualization
│   └── dashboard/      # Dashboard components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API and WebSocket services
├── stores/             # Zustand stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── styles/             # Global styles
```

## Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

## Features Guide

### Dashboard

- System metrics overview
- Recent activity feed
- Quick links to common actions

### Analysis Management

- Create new analyses with custom parameters
- View all analyses in a sortable table
- Real-time status updates
- Detailed analysis view with agent pipeline

### Real-Time Monitoring

- WebSocket connection for live updates
- Agent pipeline progress visualization
- Live log streaming
- Progress bars and status indicators

### Reports

- Tabbed interface for different report types
- Markdown rendering
- Copy to clipboard
- Download as text file

### Settings

- API key configuration
- API URL configuration
- Application information

## Styling

The application uses a custom terminal/ASCII theme with:

- Green (#00ff00) - Primary color
- Cyan (#00ffff) - Accent color
- Yellow (#ffff00) - Warning color
- Red (#ff0000) - Error color
- Dark background (#0a0e14)

All components follow the ASCII/terminal aesthetic with box-drawing characters and monospace fonts.

## Development

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/layout/Sidebar.tsx`

### Adding New Components

1. Create component in appropriate directory under `src/components/`
2. Use existing UI components for consistency
3. Follow terminal styling conventions

### API Integration

All API calls go through `src/services/api.ts`. Use the custom hooks in `src/hooks/` for data fetching:

```typescript
import { useAnalyses } from '../hooks/useAnalyses';

const { data, isLoading } = useAnalyses();
```

## Deployment

```bash
# Build for production
npm run build

# Preview the build
npm run preview
```

The built files will be in the `dist/` directory. Deploy to any static hosting service (Vercel, Netlify, etc.).

## License

Part of the Trading Agents project.
