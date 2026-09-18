#!/usr/bin/env bash
#
# Hidden Glow — pull the latest code and redeploy.
#
#   cd /var/www/hiddenglow.pk && bash deploy/update.sh
#
# Builds before restarting, so a broken build leaves the running site alone.

set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_ROOT"

log() { printf '\n\033[1;35m==> %s\033[0m\n' "$1"; }

log "Pulling latest code"
git pull --ff-only

log "Building backend"
cd "$APP_ROOT/backend"
npm ci
npm run build

log "Building frontend"
cd "$APP_ROOT/frontend"
npm ci
npm run build

log "Updating ML dependencies"
cd "$APP_ROOT/ml-service"
./venv/bin/pip install --quiet -r requirements.txt

log "Restarting services"
cd "$APP_ROOT"
pm2 reload ecosystem.config.js --update-env
pm2 save

pm2 status
