#!/bin/bash

# ─────────────────────────────────────────────
#  OrganChain — Full Stack Startup Script
#  Usage: ./start.sh
# ─────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGS="$ROOT/.logs"
mkdir -p "$LOGS"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⏳ $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; }

echo ""
echo "  ██████  ██████   ██████   █████  ███    ██  ██████ ██   ██  █████  ██ ███    ██ "
echo " ██    ██ ██   ██ ██       ██   ██ ████   ██ ██      ██   ██ ██   ██ ██ ████   ██"
echo " ██    ██ ██████  ██   ███ ███████ ██ ██  ██ ██      ███████ ███████ ██ ██ ██  ██"
echo " ██    ██ ██   ██ ██    ██ ██   ██ ██  ██ ██ ██      ██   ██ ██   ██ ██ ██  ██ ██"
echo "  ██████  ██   ██  ██████  ██   ██ ██   ████  ██████ ██   ██ ██   ██ ██ ██   ████"
echo ""
echo "  Organ Donation Blockchain Platform — Starting up..."
echo "─────────────────────────────────────────────────────"
echo ""

# ── 1. Fabric Network ────────────────────────
warn "Checking Fabric network..."
PEER_RUNNING=$(docker ps --filter "name=peer0.org1.example.com" --filter "status=running" -q)

if [ -n "$PEER_RUNNING" ]; then
    ok "Fabric network already running (Docker containers up)"
else
    warn "Starting Fabric test-network on 'organchannel'..."
    export PATH="$ROOT/fabric-samples/bin:$PATH"
    cd "$ROOT/fabric-samples/test-network"
    ./network.sh up -c organchannel > "$LOGS/fabric.log" 2>&1
    if [ $? -eq 0 ]; then
        ok "Fabric network started"
    else
        err "Fabric network failed to start. Check $LOGS/fabric.log"
        exit 1
    fi
fi

# ── 2. IPFS Daemon ──────────────────────────
warn "Checking IPFS daemon..."
IPFS_RUNNING=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5001/api/v0/version --max-time 2 -X POST 2>/dev/null)

if [ "$IPFS_RUNNING" = "200" ]; then
    ok "IPFS daemon already running"
else
    warn "Starting IPFS daemon..."
    IPFS_PATH="$ROOT/.ipfs" nohup "$ROOT/bin/ipfs" daemon > "$LOGS/ipfs.log" 2>&1 &
    echo $! > "$LOGS/ipfs.pid"
    # Wait for it to come up
    for i in {1..15}; do
        sleep 1
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5001/api/v0/version --max-time 2 -X POST 2>/dev/null)
        if [ "$STATUS" = "200" ]; then break; fi
    done
    ok "IPFS daemon started (logs: $LOGS/ipfs.log)"
fi

# ── 3. Backend API ───────────────────────────
warn "Checking backend API..."
BACKEND_RUNNING=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health --max-time 2 2>/dev/null)

if [ "$BACKEND_RUNNING" = "200" ]; then
    ok "Backend already running on port 3001"
else
    warn "Starting backend API..."
    cd "$ROOT/backend"
    nohup node server.js > "$LOGS/backend.log" 2>&1 &
    echo $! > "$LOGS/backend.pid"
    # Wait for it to come up
    for i in {1..15}; do
        sleep 1
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health --max-time 2 2>/dev/null)
        if [ "$STATUS" = "200" ]; then break; fi
    done
    ok "Backend started on http://localhost:3001 (logs: $LOGS/backend.log)"
fi

# ── 4. Frontend ──────────────────────────────
warn "Starting frontend (Vite dev server)..."
cd "$ROOT"

# Check if a browser command is available and open it after 3s
if command -v xdg-open &> /dev/null; then
    (sleep 4 && xdg-open http://localhost:5173) &
fi

echo ""
echo "─────────────────────────────────────────────────────"
ok "All services started!"
echo ""
echo "  🌐 App        →  http://localhost:5173"
echo "  🖥️  Backend   →  http://localhost:3001/api/health"
echo "  📦 IPFS WebUI →  http://localhost:5001/webui"
echo ""
echo "  Press Ctrl+C to stop the frontend."
echo "  Run ./stop.sh to stop backend + IPFS."
echo "─────────────────────────────────────────────────────"
echo ""

npm run dev
