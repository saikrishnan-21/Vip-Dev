#!/bin/bash
# Update Hugging Face Model Service
# This script updates the HF model service dependencies
# Run this on the EC2 server where the service is deployed

set -e

# Configuration
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/vipplay-ai-media-generator}"
CONDA_ENV="hfmodel"
CONDA_BASE="${CONDA_BASE:-/home/ubuntu/miniconda3}"

echo "========================================="
echo "Updating Hugging Face Model Service"
echo "========================================="
echo "Deploy Path: $DEPLOY_PATH"
echo "Conda Environment: $CONDA_ENV"
echo ""

# Check if deploy path exists
if [ ! -d "$DEPLOY_PATH" ]; then
    echo "❌ Error: Deploy path does not exist: $DEPLOY_PATH"
    echo "Please create the directory first or set DEPLOY_PATH environment variable"
    exit 1
fi

# Check if requirements.txt exists
if [ ! -f "$DEPLOY_PATH/requirements.txt" ]; then
    echo "❌ Error: requirements.txt not found in $DEPLOY_PATH"
    exit 1
fi

# Source conda
if [ -f "$CONDA_BASE/etc/profile.d/conda.sh" ]; then
    echo "📦 Sourcing conda from: $CONDA_BASE/etc/profile.d/conda.sh"
    source "$CONDA_BASE/etc/profile.d/conda.sh"
elif [ -f "$HOME/miniconda3/etc/profile.d/conda.sh" ]; then
    echo "📦 Sourcing conda from: $HOME/miniconda3/etc/profile.d/conda.sh"
    source "$HOME/miniconda3/etc/profile.d/conda.sh"
else
    echo "❌ Error: Could not find conda.sh"
    echo "Tried:"
    echo "  - $CONDA_BASE/etc/profile.d/conda.sh"
    echo "  - $HOME/miniconda3/etc/profile.d/conda.sh"
    exit 1
fi

# Activate conda environment
echo "🔧 Activating conda environment: $CONDA_ENV"
if conda env list | grep -q "^$CONDA_ENV "; then
    conda activate "$CONDA_ENV"
    echo "✅ Activated conda environment: $CONDA_ENV"
else
    echo "❌ Error: Conda environment '$CONDA_ENV' does not exist"
    echo "Available environments:"
    conda env list
    exit 1
fi

# Change to deploy path
echo "📂 Changing to deploy path: $DEPLOY_PATH"
cd "$DEPLOY_PATH"

# Verify we're in the right directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: requirements.txt not found in current directory"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Upgrade pip first
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install/upgrade requirements
echo "📦 Installing/upgrading requirements from requirements.txt..."
pip install -r requirements.txt --upgrade

echo ""
echo "✅ Successfully updated Hugging Face Model Service"
echo ""
echo "Next steps:"
echo "  1. Restart the service: sudo systemctl restart hf-api.service"
echo "  2. Check status: sudo systemctl status hf-api.service"
echo "  3. View logs: sudo journalctl -u hf-api.service -f"

