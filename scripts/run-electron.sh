#!/usr/bin/env bash
# Build the web app and launch the Electron desktop app.
# Kills any conflicting processes on ports 3847 / 5173 and any stale
# Electron or node server instances before starting fresh.

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

log()  { printf '\033[1;34m[run-electron]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m[run-electron]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[run-electron]\033[0m %s\n' "$*"; }

kill_port() {
  local port="$1"
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    warn "Killing process(es) on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 0.3
  fi
}

kill_by_name() {
  local pattern="$1"
  local pids
  pids=$(pgrep -f "$pattern" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    warn "Killing processes matching '$pattern': $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 0.3
  fi
}

# ---------------------------------------------------------------------------
# 1. Kill anything that would conflict
# ---------------------------------------------------------------------------

log "Clearing conflicting processes..."

# Stale Electron windows from previous runs
kill_by_name "Electron.*agent-dashboard"
kill_by_name "electron.*agent-dashboard"

# Node processes running the dashboard server or Vite for this project
kill_by_name "node server/index.js"
kill_by_name "vite.*agent-dashboard"
kill_by_name "dev.*agent-dashboard"

# Belt-and-suspenders: free the ports themselves
kill_port 3847
kill_port 5173

ok "Ports 3847 and 5173 are clear."

# ---------------------------------------------------------------------------
# 2. Ensure npm dependencies are installed
# ---------------------------------------------------------------------------

if [ ! -d "$REPO/node_modules" ]; then
  log "Installing root dependencies..."
  npm install
fi

if [ ! -d "$REPO/web/node_modules" ]; then
  log "Installing web dependencies..."
  npm install --prefix web
fi

if [ ! -d "$REPO/server/node_modules" ]; then
  log "Installing server dependencies..."
  npm install --prefix server
fi

# ---------------------------------------------------------------------------
# 3. Build the web app
# ---------------------------------------------------------------------------

log "Building web app..."
npm run build
ok "Web build complete."

# ---------------------------------------------------------------------------
# 4. Launch Electron (production mode: server starts inside the app)
# ---------------------------------------------------------------------------

ok "Launching Agent Dashboard..."
ELECTRON_ENV=production node_modules/.bin/electron .
