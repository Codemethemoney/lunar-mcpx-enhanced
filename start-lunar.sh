#!/bin/bash
# Lunar Claude - Quick Start Script

echo "🌙 Starting Lunar Claude with Proactive Tool Management"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the lunar-mcpx-enhanced directory"
    exit 1
fi

# Function to check if port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
    return $?
}

# Start Lunar Proxy
echo -e "${BLUE}1. Starting Lunar Proxy Server...${NC}"
if check_port 8080; then
    echo -e "${YELLOW}   ⚠️  Port 8080 already in use. Lunar proxy might be running.${NC}"
else
    npm run proxy &
    PROXY_PID=$!
    echo -e "${GREEN}   ✅ Lunar Proxy started (PID: $PROXY_PID)${NC}"
    sleep 3
fi

# Check proxy health
echo -e "${BLUE}2. Checking Lunar Proxy health...${NC}"
if curl -s http://localhost:8080/health | grep -q "running"; then
    echo -e "${GREEN}   ✅ Lunar Proxy is healthy${NC}"
else
    echo -e "${YELLOW}   ⚠️  Lunar Proxy health check failed${NC}"
fi

# Option to start desktop wrapper
echo ""
echo -e "${BLUE}3. Start Lunar Claude Desktop? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${BLUE}   Starting desktop wrapper...${NC}"
    cd desktop-wrapper
    npm start &
    DESKTOP_PID=$!
    cd ..
    echo -e "${GREEN}   ✅ Desktop wrapper started (PID: $DESKTOP_PID)${NC}"
fi

# Instructions
echo ""
echo -e "${GREEN}🚀 Lunar Claude is ready!${NC}"
echo ""
echo "Available interfaces:"
echo "  • Proxy API: http://localhost:8080"
echo "  • WebSocket: ws://localhost:8081"
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "  • Desktop App: Running"
fi
echo ""
echo "To use with Claude Desktop (standard MCP tool):"
echo "  Restart Claude Desktop - tools will be available"
echo ""
echo "To stop all services:"
echo "  Press Ctrl+C"

# Wait for interrupt
trap 'echo -e "\n${YELLOW}Shutting down Lunar Claude...${NC}"; kill $PROXY_PID $DESKTOP_PID 2>/dev/null; exit' INT
wait
