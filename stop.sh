#!/bin/bash

# ─────────────────────────────────────────────
#  OrganChain — Stop Script
#  Usage: ./stop.sh          (keeps Fabric running)
#         ./stop.sh --full   (also tears down Fabric)
# ─────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGS="$ROOT/.logs"

GREEN='\033[0;32m'
NC='\033[0m'
ok() { echo -e "${GREEN}✅ $1${NC}"; }

# Kill backend
if [ -f "$LOGS/backend.pid" ]; then
    kill "$(cat $LOGS/backend.pid)" 2>/dev/null && ok "Backend stopped"
    rm -f "$LOGS/backend.pid"
else
    pkill -f "node server.js" 2>/dev/null && ok "Backend stopped"
fi

# Kill IPFS
if [ -f "$LOGS/ipfs.pid" ]; then
    kill "$(cat $LOGS/ipfs.pid)" 2>/dev/null && ok "IPFS daemon stopped"
    rm -f "$LOGS/ipfs.pid"
else
    pkill -f "ipfs daemon" 2>/dev/null && ok "IPFS daemon stopped"
fi

# Full teardown (optional)
if [ "$1" = "--full" ]; then
    echo "Tearing down Fabric network..."
    export PATH="$ROOT/fabric-samples/bin:$PATH"
    cd "$ROOT/fabric-samples/test-network"
    ./network.sh down
    ok "Fabric network stopped"
    echo ""
    echo "⚠️  NOTE: After --full teardown, you must redeploy chaincode and re-seed data on next start."
fi

echo ""
echo "Done! Run ./start.sh to restart."
