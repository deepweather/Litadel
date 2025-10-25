# Litadel Frontend

React + TypeScript web interface for the Litadel trading agents platform.

## Features

- **Modern UI** with terminal-style design
- **Real-time updates** via WebSocket
- **Analysis management** - create, monitor, and review analyses
- **Interactive charts** - market data visualization
- **Live logs & reports** - watch agents work in real-time
- **Agent pipeline visualization** - see which agents are active

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 3. Configure API Connection

The frontend connects to the API at `http://localhost:8002` by default.

To change this, update the API URL in the frontend settings page.

## Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

The built files will be in `frontend/dist/`.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TanStack Query** - Data fetching & caching
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Recharts** - Chart visualization
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── agents/    # Agent pipeline visualization
│   ├── analysis/  # Analysis forms, logs, reports
│   ├── dashboard/ # Dashboard widgets
│   └── terminal/  # Terminal-style components
├── pages/         # Main page components
├── hooks/         # Custom React hooks
├── stores/        # Zustand state stores
├── services/      # API & WebSocket services
├── types/         # TypeScript type definitions
└── utils/         # Helper functions
```

## Development

```bash
# Run dev server with hot reload
npm run dev

# Type check
npm run build

# Lint code
npm run lint
```

## Features Explained

### Real-time Updates
The frontend uses WebSocket connections to receive live updates from the API during analysis execution. This provides instant feedback on:
- Analysis status & progress
- Current agent activity
- New logs as they're generated
- Reports as they're completed

### Agent Pipeline
The agent pipeline component shows all agents involved in an analysis and their current status:
- ⚪ Pending - Not yet started
- 🔵 Running - Currently active
- ✅ Completed - Finished successfully
- ❌ Failed - Encountered an error

### Smart Caching
- WebSocket-driven updates (no polling!)
- Optimistic UI updates
- Debounced query invalidations
- Automatic cache management via TanStack Query
