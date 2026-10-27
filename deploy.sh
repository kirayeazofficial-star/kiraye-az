#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="/home/kiraytfg/kirayeal-source"
APP_DIR="/home/kiraytfg/kirayeal"
NODE_ENV_FILE="/home/kiraytfg/nodevenv/kirayeal/22/bin/activate"

cd "$SOURCE_DIR"
source "$NODE_ENV_FILE"
node scripts/deploy-cpanel.mjs "$APP_DIR"
