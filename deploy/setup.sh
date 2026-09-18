#!/usr/bin/env bash
#
# Hidden Glow — first-time VPS provisioning (Ubuntu 22.04 / 24.04).
#
#   git clone https://github.com/Timelinedi55/hiddenglow.pk.git /var/www/hiddenglow.pk
#   cd /var/www/hiddenglow.pk
#   sudo bash deploy/setup.sh
#
# Safe to re-run: it never overwrites an existing .env and never drops data.
# Installs Node 20, MySQL, Python 3, nginx and PM2, creates the database,
# generates secrets, builds all three services and starts them under PM2.

set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_NAME="${DB_NAME:-hiddenglow_db}"
DB_USER="${DB_USER:-hiddenglow}"
DOMAIN="${DOMAIN:-hiddenglow.pk}"

log() { printf '\n\033[1;35m==> %s\033[0m\n' "$1"; }

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo: sudo bash deploy/setup.sh" >&2
  exit 1
fi

# The user who will own the files and run PM2 (not root, if we can help it).
RUN_USER="${SUDO_USER:-root}"

log "Installing system packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git nginx mysql-server python3 python3-venv python3-pip build-essential

if ! command -v node >/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  log "Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

command -v pm2 >/dev/null || { log "Installing PM2"; npm install -g pm2; }

systemctl enable --now mysql

# ── Database ────────────────────────────────────────────────────────
log "Configuring MySQL"
if [[ -f "$APP_ROOT/backend/.env" ]]; then
  DB_PASSWORD="$(grep -E '^DATABASE_PASSWORD=' "$APP_ROOT/backend/.env" | cut -d= -f2-)"
  echo "Reusing the password already in backend/.env"
else
  DB_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=')"
fi

mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

# ── Environment files ───────────────────────────────────────────────
log "Writing environment files"

if [[ -f "$APP_ROOT/backend/.env" ]]; then
  echo "backend/.env exists — left untouched"
else
  ADMIN_PASSWORD="$(openssl rand -base64 18 | tr -d '/+=')"
  cat > "$APP_ROOT/backend/.env" <<ENV
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=${DB_USER}
DATABASE_PASSWORD=${DB_PASSWORD}
DATABASE_NAME=${DB_NAME}
JWT_SECRET=$(openssl rand -base64 48)
ADMIN_DEFAULT_EMAIL=admin@${DOMAIN}
ADMIN_DEFAULT_PASSWORD=${ADMIN_PASSWORD}
UPLOAD_DIR=./uploads
PORT=4001
FRONTEND_URL=https://${DOMAIN}
ENV
  chmod 600 "$APP_ROOT/backend/.env"
  echo "Generated backend/.env — admin login: admin@${DOMAIN} / ${ADMIN_PASSWORD}"
fi

if [[ -f "$APP_ROOT/ml-service/.env" ]]; then
  echo "ml-service/.env exists — left untouched"
else
  cat > "$APP_ROOT/ml-service/.env" <<ENV
DB_HOST=localhost
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
API_PORT=4002
ENV
  chmod 600 "$APP_ROOT/ml-service/.env"
fi

if [[ -f "$APP_ROOT/frontend/.env.production.local" ]]; then
  echo "frontend/.env.production.local exists — left untouched"
else
  cat > "$APP_ROOT/frontend/.env.production.local" <<ENV
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_UPLOADS_URL=https://${DOMAIN}/uploads
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
ENV
fi

# ── Build ───────────────────────────────────────────────────────────
mkdir -p "$APP_ROOT/logs" "$APP_ROOT/backend/uploads"

log "Building backend"
cd "$APP_ROOT/backend" && npm ci && npm run build

log "Building frontend"
cd "$APP_ROOT/frontend" && npm ci && npm run build

log "Setting up ML service"
cd "$APP_ROOT/ml-service"
[[ -d venv ]] || python3 -m venv venv
./venv/bin/pip install --quiet --upgrade pip
./venv/bin/pip install --quiet -r requirements.txt

chown -R "$RUN_USER":"$RUN_USER" "$APP_ROOT"

# ── nginx ───────────────────────────────────────────────────────────
log "Configuring nginx"
sed -e "s|alias /var/www/hiddenglow.pk/backend/uploads/;|alias ${APP_ROOT}/backend/uploads/;|" \
    -e "s|^\( *server_name \).*|\1${DOMAIN} www.${DOMAIN};|" \
    "$APP_ROOT/deploy/nginx.conf" > "/etc/nginx/sites-available/${DOMAIN}"
ln -sfn "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# nginx (as www-data) must be able to traverse into backend/uploads.
chmod o+x "$APP_ROOT" "$APP_ROOT/backend"

# ── Start ───────────────────────────────────────────────────────────
log "Starting services with PM2"
cd "$APP_ROOT"
sudo -u "$RUN_USER" pm2 start ecosystem.config.js
sudo -u "$RUN_USER" pm2 save
pm2 startup systemd -u "$RUN_USER" --hp "$(eval echo ~"$RUN_USER")" >/dev/null

log "Done"
cat <<DONE

  Site:   http://${DOMAIN}
  Admin:  http://${DOMAIN}/admin/login
  Status: pm2 status      Logs: pm2 logs

  The backend creates its schema and seeds demo content on first boot —
  give it ~30s, then check: curl -s localhost:4001/api/products | head -c 200

  Next: point DNS at this server, then enable HTTPS with
    sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}

DONE
