#!/usr/bin/env bash
set -euo pipefail

PARAMETER_PATH="${PARAMETER_PATH:-/greencart/dev}"
AWS_REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-ap-southeast-1}}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI is required to load parameters from SSM Parameter Store." >&2
  exit 1
fi

parameters="$(
  aws ssm get-parameters-by-path \
    --path "$PARAMETER_PATH" \
    --recursive \
    --with-decryption \
    --region "$AWS_REGION" \
    --query "Parameters[*].[Name,Value]" \
    --output text
)"

while IFS=$'\t' read -r name value; do
  [ -z "${name:-}" ] && continue
  key="${name##*/}"
  export "$key=$value"
done <<< "$parameters"

cd "$APP_DIR"
exec node server.js
