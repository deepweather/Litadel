#!/bin/bash
# Auto-formatting script for Litadel project

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           Litadel - Auto Formatter                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to script directory
cd "$(dirname "$0")"

# ============================================================
# Python Formatting
# ============================================================
echo -e "${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│ Formatting Python Code (Ruff)...                           │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""

if ! command -v uv &> /dev/null; then
    echo -e "${RED}✗ Error: uv not found. Please install uv first.${NC}"
    echo "Visit: https://docs.astral.sh/uv/getting-started/installation/"
    exit 1
fi

echo "Running Ruff formatter..."
uv run ruff format . --config pyproject.toml
echo -e "${GREEN}✓ Python formatting complete!${NC}"
echo ""

echo "Running Ruff auto-fixes..."
uv run ruff check --fix . --config pyproject.toml
echo -e "${GREEN}✓ Python auto-fixes applied!${NC}"
echo ""

# ============================================================
# Frontend Formatting
# ============================================================
echo -e "${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│ Formatting Frontend Code (ESLint)...                       │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""

if [ -d "frontend" ]; then
    cd frontend

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
        npm install
    fi

    echo "Running ESLint with auto-fix..."
    npm run lint -- --fix 2>/dev/null || npm run lint
    echo -e "${GREEN}✓ Frontend formatting complete!${NC}"

    cd ..
else
    echo -e "${YELLOW}⚠️  Frontend directory not found, skipping...${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo -e "║  ${GREEN}✓ Auto-formatting complete!${NC}                               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Note: Some issues may require manual fixes."
echo "Run ./lint.sh to check for remaining issues."
echo ""
