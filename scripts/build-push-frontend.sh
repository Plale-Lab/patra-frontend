#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

IMAGE="${IMAGE:-plalelab/patra-dev:latest}"
VITE_LIVE_API_BASE_URL="${VITE_LIVE_API_BASE_URL:-https://patrabackend.pods.icicleai.tapis.io}"
VITE_DEFAULT_API_MODE="${VITE_DEFAULT_API_MODE:-live}"
VITE_SUPPORTS_AGENT_TOOLS="${VITE_SUPPORTS_AGENT_TOOLS:-true}"
VITE_SUPPORTS_EDIT_RECORDS="${VITE_SUPPORTS_EDIT_RECORDS:-true}"

echo "Building $IMAGE ..."
docker build \
  --build-arg VITE_DEFAULT_API_MODE="$VITE_DEFAULT_API_MODE" \
  --build-arg VITE_LIVE_API_BASE_URL="$VITE_LIVE_API_BASE_URL" \
  --build-arg VITE_SUPPORTS_AGENT_TOOLS="$VITE_SUPPORTS_AGENT_TOOLS" \
  --build-arg VITE_SUPPORTS_EDIT_RECORDS="$VITE_SUPPORTS_EDIT_RECORDS" \
  -t "$IMAGE" .

echo "Pushing $IMAGE ..."
docker push "$IMAGE"
echo "Done: $IMAGE"

TAPIS_VENV="${TAPIS_VENV:-$HOME/.venvs/tapis}"
TAPIS_PODS_BASE_URL="${TAPIS_PODS_BASE_URL:-}"
TARGET_PODS="${TARGET_PODS:-patra-dev}"

if [[ -n "$TAPIS_PODS_BASE_URL" && -n "${TAPIS_USERNAME:-}" && -n "${TAPIS_PASSWORD:-}" ]]; then
  if [[ ! -x "$TAPIS_VENV/bin/python3" ]]; then
    echo "ERROR: tapipy venv not found at $TAPIS_VENV" >&2
    exit 1
  fi

  echo "Restarting Tapis Pods via tapipy ..."
  "$TAPIS_VENV/bin/python3" << 'PY'
import os
import sys
from tapipy.tapis import Tapis

t = Tapis(
    base_url=os.environ["TAPIS_PODS_BASE_URL"],
    username=os.environ["TAPIS_USERNAME"],
    password=os.environ["TAPIS_PASSWORD"],
)
t.get_tokens()

pods = [item.strip() for item in os.environ.get("TARGET_PODS", "patra-dev").split(",") if item.strip()]
for pod_id in pods:
    try:
        result = t.pods.restart_pod(pod_id=pod_id)
        status = getattr(result, "status_requested", "unknown")
        print(f"  {pod_id}: restart requested (status_requested={status})")
    except Exception as exc:
        print(f"  {pod_id}: FAILED - {exc}", file=sys.stderr)
PY
else
  echo "TAPIS credentials not set; skipping Tapis Pod restarts." >&2
fi
