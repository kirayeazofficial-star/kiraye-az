#!/usr/bin/env bash
set -eo pipefail

SOURCE_DIR="/home/kiraytfg/kirayeal-source"
NODE_BIN="/home/kiraytfg/nodevenv/kirayeal/22/bin/node"
NODE_DIR="/home/kiraytfg/nodevenv/kirayeal/22/bin"
APP_DIR="/home/kiraytfg/kirayeal"
LOG_DIR="/home/kiraytfg/.kirayeal-backups"
LOG_FILE="$LOG_DIR/cpanel-deploy.log"

mkdir -p "$LOG_DIR"
chmod 700 "$LOG_DIR"

# cPanel only launches the job. The production build continues independently,
# so Git Version Control can finish instead of remaining on "in progress".
if pgrep -u "$(id -u)" -f "scripts/deploy-cpanel.mjs $APP_DIR" >/dev/null 2>&1; then
  printf '%s\n' "A Kirayeal deployment is already running." >> "$LOG_FILE"
  exit 0
fi

cd "$SOURCE_DIR"
nohup env PATH="$NODE_DIR:$PATH" "$NODE_BIN" scripts/deploy-cpanel.mjs "$APP_DIR" >> "$LOG_FILE" 2>&1 </dev/null &
printf '%s\n' "$!" > "$LOG_DIR/cpanel-deploy.pid"
exit 0
