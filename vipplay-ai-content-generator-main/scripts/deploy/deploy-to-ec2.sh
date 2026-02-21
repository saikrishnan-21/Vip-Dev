#!/bin/bash
# Deployment script for EC2 environment
# This script is called by GitHub Actions workflow

set -e

SERVICE_NAME=$1
DEPLOY_PATH=${2:-/opt/vipcontentai}
SERVICE_USER=${3:-ubuntu}

echo "========================================="
echo "Deploying $SERVICE_NAME to EC2"
echo "========================================="

# Function to deploy HF Model Service
deploy_hf_model_service() {
    echo "Deploying Hugging Face Model Service..."
    
    SERVICE_DIR="$DEPLOY_PATH/hf-model-service"
    
    # Create directory
    sudo mkdir -p "$SERVICE_DIR"
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$DEPLOY_PATH"
    
    # Copy files
    sudo cp -r hf-model-service/* "$SERVICE_DIR/"
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$SERVICE_DIR"
    
    # Create outputs directory
    sudo mkdir -p "$SERVICE_DIR/outputs"
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$SERVICE_DIR/outputs"
    
    # Setup conda environment
    if ! command -v conda &> /dev/null; then
        echo "Installing Miniconda..."
        wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh
        bash /tmp/miniconda.sh -b -p $HOME/miniconda3
        export PATH="$HOME/miniconda3/bin:$PATH"
    fi
    
    source "$(conda info --base)/etc/profile.d/conda.sh" || eval "$(conda shell.bash hook)"
    
    if conda env list | grep -q "hfmodel"; then
        conda activate hfmodel
        pip install -r "$SERVICE_DIR/requirements.txt"
    else
        conda create -n hfmodel python=3.10 -y
        conda activate hfmodel
        pip install -r "$SERVICE_DIR/requirements.txt"
    fi
    
    # Install PyTorch
    if command -v nvidia-smi &> /dev/null; then
        pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
    else
        pip install torch torchvision torchaudio
    fi
    
    # Create .env if not exists
    if [ ! -f "$SERVICE_DIR/.env" ]; then
        sudo -u $SERVICE_USER tee "$SERVICE_DIR/.env" > /dev/null <<EOF
HOST=0.0.0.0
PORT=7860
LOG_LEVEL=info
MAX_CACHED_MODELS=2
OUTPUT_DIR=./outputs
CUDA_VISIBLE_DEVICES=0
PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
EOF
    fi
    
    # Create systemd service
    sudo tee /etc/systemd/system/hf-api.service > /dev/null <<EOF
[Unit]
Description=Hugging Face Model API Service
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$SERVICE_DIR
Environment="PATH=$HOME/miniconda3/envs/hfmodel/bin:/usr/local/bin:/usr/bin:/bin"
EnvironmentFile=$SERVICE_DIR/.env
ExecStart=$HOME/miniconda3/envs/hfmodel/bin/uvicorn hf_api:app --host 0.0.0.0 --port 7860 --workers 1
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable hf-api.service
    sudo systemctl restart hf-api.service
    
    echo "✅ Hugging Face Model Service deployed"
}

# Function to deploy API Service
deploy_api_service() {
    echo "Deploying API Service..."
    
    SERVICE_DIR="$DEPLOY_PATH/api-service"
    
    # Create directory
    sudo mkdir -p "$SERVICE_DIR"
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$DEPLOY_PATH"
    
    # Copy files
    sudo cp -r api-service/* "$SERVICE_DIR/"
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$SERVICE_DIR"
    
    # Setup virtual environment
    cd "$SERVICE_DIR"
    sudo -u $SERVICE_USER python3 -m venv venv
    sudo -u $SERVICE_USER ./venv/bin/pip install --upgrade pip
    sudo -u $SERVICE_USER ./venv/bin/pip install -r requirements.txt
    
    # Create .env if not exists
    if [ ! -f "$SERVICE_DIR/.env" ]; then
        sudo -u $SERVICE_USER tee "$SERVICE_DIR/.env" > /dev/null <<EOF
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=llama3.1:8b
EMBEDDING_MODEL=nomic-embed-text
MAX_TOKENS=4096
TEMPERATURE=0.7
TOP_P=0.9
API_HOST=0.0.0.0
API_PORT=8000
RELOAD=false
LOG_LEVEL=INFO
EOF
    fi
    
    # Create systemd service
    sudo tee /etc/systemd/system/vipcontentai-api.service > /dev/null <<EOF
[Unit]
Description=VIPContentAI FastAPI Service
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$SERVICE_DIR
Environment="PATH=$SERVICE_DIR/venv/bin:/usr/local/bin:/usr/bin:/bin"
EnvironmentFile=$SERVICE_DIR/.env
ExecStart=$SERVICE_DIR/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable vipcontentai-api.service
    sudo systemctl restart vipcontentai-api.service
    
    echo "✅ API Service deployed"
}

# Main deployment logic
case $SERVICE_NAME in
    hf-model-service)
        deploy_hf_model_service
        ;;
    api-service)
        deploy_api_service
        ;;
    all)
        deploy_hf_model_service
        deploy_api_service
        ;;
    *)
        echo "Unknown service: $SERVICE_NAME"
        echo "Usage: $0 [hf-model-service|api-service|all] [deploy_path] [user]"
        exit 1
        ;;
esac

echo "========================================="
echo "Deployment Complete"
echo "========================================="

