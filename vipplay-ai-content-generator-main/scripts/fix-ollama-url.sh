#!/bin/bash
# Quick fix script to update OLLAMA_BASE_URL on the server
# Run this on the EC2 server to fix the Ollama connection issue

set -e

BACKEND_PATH="${BACKEND_PATH:-/var/www/vipcontentai-backend}"
ENV_FILE="$BACKEND_PATH/.env"

echo "🔧 Fixing Ollama URL configuration..."
echo "Backend path: $BACKEND_PATH"
echo "Environment file: $ENV_FILE"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ ERROR: .env file not found at $ENV_FILE"
    exit 1
fi

# Backup the .env file
cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Created backup of .env file"

# Update or add OLLAMA_BASE_URL
if grep -q "^OLLAMA_BASE_URL=" "$ENV_FILE"; then
    # Update existing OLLAMA_BASE_URL
    sed -i 's|^OLLAMA_BASE_URL=.*|OLLAMA_BASE_URL=http://44.197.16.15:11434|' "$ENV_FILE"
    echo "✅ Updated existing OLLAMA_BASE_URL"
else
    # Add OLLAMA_BASE_URL if it doesn't exist
    echo "OLLAMA_BASE_URL=http://44.197.16.15:11434" >> "$ENV_FILE"
    echo "✅ Added OLLAMA_BASE_URL"
fi

# Verify the update
echo ""
echo "🔍 Verifying OLLAMA_BASE_URL:"
grep "^OLLAMA_BASE_URL=" "$ENV_FILE" || echo "⚠️  WARNING: OLLAMA_BASE_URL not found"

# Restart the service
echo ""
echo "🔄 Restarting FastAPI service..."
sudo systemctl restart vipcontentai-fastapi.service

# Wait for service to start
sleep 3

# Check service status
echo ""
echo "📊 Service status:"
sudo systemctl status vipcontentai-fastapi.service --no-pager | head -15 || true

# Test health endpoint
echo ""
echo "🏥 Testing health endpoint..."
sleep 2
if curl -f -s http://localhost:8000/health > /dev/null; then
    echo "✅ Health check passed"
    HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
    echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
    
    # Check if Ollama URL is correct
    if echo "$HEALTH_RESPONSE" | grep -q "http://44.197.16.15:11434"; then
        echo ""
        echo "✅ SUCCESS: Ollama URL is correctly set to http://44.197.16.15:11434"
    else
        echo ""
        echo "⚠️  WARNING: Ollama URL may not be set correctly in the response"
    fi
else
    echo "❌ Health check failed"
    echo "Recent logs:"
    sudo journalctl -u vipcontentai-fastapi.service -n 20 --no-pager || true
fi

echo ""
echo "✅ Fix complete!"

