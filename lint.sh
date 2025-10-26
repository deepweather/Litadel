#!/bin/bash
# Linting script for Litadel project

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           Litadel - Code Quality Check                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Change to script directory
cd "$(dirname "$0")"

# Flag to track overall status
OVERALL_STATUS=0

# ============================================================
# Python Linting
# ============================================================
echo -e "${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│ Running Python Linting (Ruff)...                           │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""

if ! command -v uv &> /dev/null; then
    echo -e "${RED}✗ Error: uv not found. Please install uv first.${NC}"
    echo "Visit: https://docs.astral.sh/uv/getting-started/installation/"
    exit 1
fi

echo "Running Ruff check on Python code..."
uv run ruff check . --config pyproject.toml
PYTHON_LINT_STATUS=$?

if [ $PYTHON_LINT_STATUS -eq 0 ]; then
    echo -e "${GREEN}✓ Python linting passed!${NC}"
else
    echo -e "${RED}✗ Python linting found issues${NC}"
    OVERALL_STATUS=1
fi

echo ""
echo -e "${BLUE}Checking Python code formatting...${NC}"
uv run ruff format --check . --config pyproject.toml
PYTHON_FORMAT_STATUS=$?

if [ $PYTHON_FORMAT_STATUS -eq 0 ]; then
    echo -e "${GREEN}✓ Python formatting is correct!${NC}"
else
    echo -e "${YELLOW}⚠️  Python code needs formatting (run ./format.sh to fix)${NC}"
    OVERALL_STATUS=1
fi

echo ""

# ============================================================
# Frontend Linting
# ============================================================
echo -e "${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│ Running Frontend Linting (ESLint)...                       │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""

if [ -d "frontend" ]; then
    cd frontend

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
        npm install
    fi

    echo "Running ESLint on frontend code..."
    npm run lint
    FRONTEND_STATUS=$?

    if [ $FRONTEND_STATUS -eq 0 ]; then
        echo -e "${GREEN}✓ Frontend linting passed!${NC}"
    else
        echo -e "${RED}✗ Frontend linting found issues${NC}"
        OVERALL_STATUS=1
    fi

    cd ..
else
    echo -e "${YELLOW}⚠️  Frontend directory not found, skipping...${NC}"
fi

echo ""

# ============================================================
# Summary
# ============================================================
echo "╔════════════════════════════════════════════════════════════════╗"
if [ $OVERALL_STATUS -eq 0 ]; then
    echo -e "║  ${GREEN}✓ All linting checks passed!${NC}                              ║"
else
    echo -e "║  ${RED}✗ Some linting checks failed. Please fix the issues.${NC}      ║"
fi
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Tip: Run ./format.sh to automatically fix many issues"
echo ""

exit $OVERALL_STATUS
