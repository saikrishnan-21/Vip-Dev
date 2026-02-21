#!/bin/bash
set -euo pipefail

# Usage:
#   ./update-env-secrets.sh owner/repo environment [env_file]

REPO="${1:-}"
ENVIRONMENT="${2:-}"
ENV_FILE="${3:-.env}"

if [ -z "$REPO" ] || [ -z "$ENVIRONMENT" ]; then
  echo "Usage: $0 owner/repo environment [env_file]"
  exit 1
fi

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "ERROR: GITHUB_TOKEN is not set"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: Env file '$ENV_FILE' not found"
  exit 1
fi

for cmd in curl node; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: '$cmd' is required"
    exit 1
  fi
done

echo "Repository : $REPO"
echo "Environment: $ENVIRONMENT"
echo "Env file   : $ENV_FILE"
echo

# ----------------------------------------------------
# Fetch public key
# ----------------------------------------------------
KEY_DATA=$(curl -sS \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$REPO/environments/$ENVIRONMENT/secrets/public-key")

# Parse JSON with Node via stdin (no quoting hell)
PUBLIC_KEY=$(printf '%s' "$KEY_DATA" | node -e '
let d = "";
process.stdin.on("data", c => d += c);
process.stdin.on("end", () => {
  const j = JSON.parse(d);
  console.log(j.key || "");
});
')

KEY_ID=$(printf '%s' "$KEY_DATA" | node -e '
let d = "";
process.stdin.on("data", c => d += c);
process.stdin.on("end", () => {
  const j = JSON.parse(d);
  console.log(j.key_id || "");
});
')

if [ -z "$PUBLIC_KEY" ] || [ -z "$KEY_ID" ]; then
  echo "ERROR: Could not parse public key from GitHub."
  echo "Response:"
  echo "$KEY_DATA"
  exit 1
fi

echo "Updating secrets from '$ENV_FILE'..."
echo

# ----------------------------------------------------
# Encryption function
# ----------------------------------------------------
encrypt_secret () {
  local pubkey="$1"
  local value="$2"

  node - "$pubkey" "$value" << 'EOF'
const sodium = require('tweetsodium');
const [,, key, val] = process.argv;

const keyBytes = Buffer.from(key, 'base64');
const valBytes = Buffer.from(val, 'utf8');

const encrypted = sodium.seal(valBytes, keyBytes);
process.stdout.write(Buffer.from(encrypted).toString('base64'));
EOF
}

# ----------------------------------------------------
# Process .env and send secrets
# ----------------------------------------------------
while IFS='=' read -r key value || [ -n "$key" ]; do
  # skip empty lines
  if [[ "$key" =~ ^[[:space:]]*$ ]]; then
    continue
  fi
  # skip comments
  if [[ "$key" =~ ^[[:space:]]*# ]]; then
    continue
  fi

  # trim key
  key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

  # trim value whitespace
  value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

  # strip surrounding double quotes
  if [[ "$value" == \"*\" ]]; then
    value="${value#\"}"
    value="${value%\"}"
  fi
  # strip surrounding single quotes
  if [[ "$value" == \'*\' ]]; then
    value="${value#\'}"
    value="${value%\'}"
  fi

  if [ -z "$key" ]; then
    continue
  fi

  echo "Setting secret: $key"

  ENCRYPTED_VALUE=$(encrypt_secret "$PUBLIC_KEY" "$value")

  curl -sS -X PUT \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    -d "{\"encrypted_value\":\"$ENCRYPTED_VALUE\",\"key_id\":\"$KEY_ID\"}" \
    "https://api.github.com/repos/$REPO/environments/$ENVIRONMENT/secrets/$key" > /dev/null

done < "$ENV_FILE"

echo
echo "✅ All secrets synced successfully!"
