#!/bin/sh
set -eu

API_BASE_URL="${API_BASE_URL:-${VITE_API_BASE_URL:-http://localhost:8000}}"
ADMIN_USERNAMES="${ADMIN_USERNAMES:-${VITE_ADMIN_USERNAMES:-williamq96}}"

cat > /usr/share/nginx/html/env.js <<EOF
window.__PATRA_CONFIG__ = {
  API_BASE_URL: "${API_BASE_URL}",
  ADMIN_USERNAMES: "${ADMIN_USERNAMES}"
};
EOF
