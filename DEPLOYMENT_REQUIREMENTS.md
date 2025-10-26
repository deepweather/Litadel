# Deployment Requirements

## Required Software

### 1. Docker (Required for Strategy Code Validation)

The backtest system uses Docker to securely validate AI-generated strategy code in an isolated sandbox.

**Installation:**

macOS:
```bash
brew install --cask docker
# Or download from: https://docs.docker.com/desktop/install/mac-install/
```

Linux:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Or follow: https://docs.docker.com/engine/install/
```

**Verify Installation:**
```bash
docker --version
docker ps
```

**Start Docker:**
- macOS: Open Docker Desktop app
- Linux: `sudo systemctl start docker`

### 2. Python Dependencies

Already in `pyproject.toml`:
- `llm-sandbox[docker]` - Secure code execution sandbox
- All other dependencies managed by `uv`

## What Happens Without Docker?

If Docker is not running on the server:
- ✅ Code generation still works
- ⚠️ Code validation falls back to warning: "Server configuration error"
- ⚠️ Self-healing won't work properly
- ❌ Generated code might have import errors

**Users will see:** "Server configuration error - Docker not available"

**Check server logs for:** Error messages about Docker with installation instructions

## Starting the Application

```bash
# Make sure Docker is running first!
docker ps

# Start backend
cd /Users/marvingabler/Projects/Trading/TradingAgents
uv run python -m api.main

# Start frontend (separate terminal)
cd /Users/marvingabler/Projects/Trading/TradingAgents/frontend
npm run dev
```

## Troubleshooting

**Error: "Server configuration error - Docker not available"**
- Solution: Install and start Docker on the SERVER (not user's machine)
- Check: `docker ps` should work without errors

**Error: "llm-sandbox not installed"**
- Solution: `uv add 'llm-sandbox[docker]'`

**Code validation not working:**
1. Check Docker is running: `docker ps`
2. Check logs for Docker errors
3. Restart Docker Desktop
4. Restart the backend server
