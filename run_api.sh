#!/bin/bash
# Startup script for Trading Agents API

echo "Starting Trading Agents API..."
echo ""
echo "First time running? The API will automatically:"
echo "  • Initialize the database"
echo "  • Create a default API key (save it!)"
echo ""
echo "API will be available at: http://localhost:8002"
echo "API Documentation: http://localhost:8002/docs"
echo ""

cd "$(dirname "$0")"

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ Error: uv not found. Please install uv first."
    echo "Visit: https://docs.astral.sh/uv/getting-started/installation/"
    exit 1
fi

uv run python -m api.main
