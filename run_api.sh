#!/bin/bash
# Startup script for Trading Agents API

echo "Starting Trading Agents API..."
echo ""
echo "Make sure you have:"
echo "1. Installed dependencies: pip install -r requirements.txt"
echo "2. Initialized database: python -m api.cli_admin init-database"
echo "3. Created an API key: python -m api.cli_admin create-key 'My Key'"
echo ""
echo "API will be available at: http://localhost:8001"
echo "API Documentation: http://localhost:8001/docs"
echo ""

cd "$(dirname "$0")"
python -m api.main

