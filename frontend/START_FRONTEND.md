# Trading Agents Frontend - Quick Start

## Quick Start

### 1. Install Dependencies (First Time Only)

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The frontend will be available at: **http://localhost:5173**

### 3. Configure API Connection

1. Navigate to http://localhost:5173/settings
2. Enter your API key from the backend
3. Verify the API URL is correct (default: http://localhost:8002)

**Note:** Make sure the Trading Agents API is running on port 8002 before using the frontend!

## First Time Setup

When you first open the application:

1. You'll be automatically redirected to the Settings page
2. Enter the API key you received when starting the API server
3. The API key is stored securely in your browser's local storage
4. Once configured, you can start creating analyses!

## Available Commands

```bash
# Development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

## Troubleshooting

**"Invalid or inactive API key"**
- Go to Settings and verify your API key
- Make sure you copied the entire key from the API startup logs
- Check that the API server is running

**"Cannot connect to API"**
- Verify the API URL in Settings (default: http://localhost:8002)
- Make sure the API server is running
- Check for port conflicts

**Frontend not loading**
- Check that port 5173 is not in use
- Try stopping the dev server and starting again
- Clear browser cache and reload

## Development Tips

- The frontend uses hot module replacement (HMR) for instant updates
- Changes to TypeScript files will cause a rebuild
- Changes to CSS will update instantly
- Browser DevTools are your friend for debugging

## Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom hooks
│   ├── services/       # API & WebSocket
│   ├── stores/         # State management
│   ├── types/          # TypeScript types
│   ├── utils/          # Utilities
│   └── styles/         # Global styles
├── public/             # Static assets
└── index.html          # Entry HTML
```

## Features

- **Dashboard**: Overview of all analyses and system metrics
- **Analyses**: List and manage all trading analyses
- **Create Analysis**: Form to start new analysis
- **Analysis Detail**: Real-time view of analysis progress
- **Settings**: Configure API key and URL

## Next Steps

1. Start the API server (see `api/START_API.md`)
2. Start the frontend (`npm run dev`)
3. Configure your API key in Settings
4. Create your first analysis!

Enjoy using Trading Agents! 🚀

