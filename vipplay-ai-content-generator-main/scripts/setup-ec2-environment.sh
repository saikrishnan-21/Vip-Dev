#!/bin/bash
# EC2 Environment Setup Script for Ubuntu Server
# This script sets up the EC2 instance for GitHub Actions deployment
# Compatible with: Ubuntu Server 20.04 LTS, 22.04 LTS, 24.04 LTS
# Run this script on a fresh Ubuntu Server EC2 instance

set -e

echo "========================================="
echo "EC2 Environment Setup for VIPContentAI"
echo "Ubuntu Server Configuration"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_PATH="/opt/vipcontentai"
SERVICE_USER="ubuntu"
PYTHON_VERSION="3.10"

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Detect Ubuntu version
echo ""
echo "Detecting Ubuntu version..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    UBUNTU_VERSION=$VERSION_ID
    UBUNTU_CODENAME=$VERSION_CODENAME
    echo "  OS: $NAME"
    echo "  Version: $VERSION_ID ($VERSION_CODENAME)"
    
    # Verify it's Ubuntu
    if [[ "$ID" != "ubuntu" ]]; then
        print_error "This script is designed for Ubuntu Server. Detected: $ID"
        exit 1
    fi
    
    # Check version compatibility
    if [[ "$VERSION_ID" != "20.04" && "$VERSION_ID" != "22.04" && "$VERSION_ID" != "24.04" ]]; then
        print_warning "Ubuntu $VERSION_ID may not be fully tested. Recommended: 22.04 LTS"
    else
        print_status "Ubuntu $VERSION_ID LTS detected (supported)"
    fi
else
    print_error "Cannot detect OS version. /etc/os-release not found."
    exit 1
fi

# 1. System Updates
echo ""
echo "1. Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y apt-transport-https ca-certificates gnupg lsb-release
print_status "System updated"

# 2. Install Essential Tools
echo ""
echo "2. Installing essential tools..."
apt-get install -y curl wget git build-essential jq unzip software-properties-common
print_status "Essential tools installed"

# 3. Install Python 3.10+
echo ""
echo "3. Installing Python $PYTHON_VERSION..."
CURRENT_PYTHON_VERSION=$(python3 --version 2>/dev/null | cut -d' ' -f2 | cut -d'.' -f1,2 || echo "0.0")

if [ "$(printf '%s\n' "3.10" "$CURRENT_PYTHON_VERSION" | sort -V | head -n1)" != "3.10" ]; then
    if [[ "$UBUNTU_VERSION" == "22.04" || "$UBUNTU_VERSION" == "24.04" ]]; then
        # Ubuntu 22.04+ comes with Python 3.10+ by default
        apt-get install -y python3 python3-venv python3-dev python3-pip
    else
        # Ubuntu 20.04 needs Python 3.10 from deadsnakes PPA
        add-apt-repository ppa:deadsnakes/ppa -y
        apt-get update
        apt-get install -y python3.10 python3.10-venv python3.10-dev python3-pip
        update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 1
    fi
else
    print_status "Python $CURRENT_PYTHON_VERSION already installed (meets requirement)"
    apt-get install -y python3-venv python3-dev python3-pip
fi
print_status "Python $(python3 --version) installed"

# 4. Install Miniconda
echo ""
echo "4. Installing Miniconda..."
if ! command -v conda &> /dev/null; then
    if [ -d "$HOME/miniconda3" ]; then
        print_warning "Miniconda directory exists, skipping installation"
    else
        wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh
        bash /tmp/miniconda.sh -b -p $HOME/miniconda3
        rm /tmp/miniconda.sh
        export PATH="$HOME/miniconda3/bin:$PATH"
        echo 'export PATH="$HOME/miniconda3/bin:$PATH"' >> /root/.bashrc
        print_status "Miniconda installed"
    fi
else
    print_status "Miniconda already installed"
fi

# 5. Check for GPU and install NVIDIA drivers (if GPU instance)
echo ""
echo "5. Checking for GPU..."
if lspci | grep -i nvidia &> /dev/null; then
    print_warning "NVIDIA GPU detected"
    if ! command -v nvidia-smi &> /dev/null; then
        print_warning "NVIDIA drivers not installed. Installing..."
        apt-get update
        
        # Install NVIDIA drivers (version depends on Ubuntu version)
        if [[ "$UBUNTU_VERSION" == "22.04" || "$UBUNTU_VERSION" == "24.04" ]]; then
            apt-get install -y nvidia-driver-535 nvidia-utils-535
            CUDA_REPO="ubuntu2204"
        else
            # Ubuntu 20.04
            apt-get install -y nvidia-driver-470 nvidia-utils-470
            CUDA_REPO="ubuntu2004"
        fi
        
        # Install CUDA toolkit
        wget https://developer.download.nvidia.com/compute/cuda/repos/${CUDA_REPO}/x86_64/cuda-keyring_1.1-1_all.deb
        dpkg -i cuda-keyring_1.1-1_all.deb
        apt-get update
        apt-get install -y cuda-toolkit-12-1
        
        print_warning "NVIDIA drivers installed. REBOOT REQUIRED before GPU will work."
    else
        print_status "NVIDIA drivers already installed"
        nvidia-smi
    fi
else
    print_status "No GPU detected (CPU-only mode)"
fi

# 6. Create Deployment Directory
echo ""
echo "6. Creating deployment directory..."
mkdir -p "$DEPLOY_PATH/hf-model-service/outputs"
mkdir -p "$DEPLOY_PATH/api-service"
chown -R $SERVICE_USER:$SERVICE_USER "$DEPLOY_PATH"
print_status "Deployment directory created at $DEPLOY_PATH"

# 7. Configure Firewall
echo ""
echo "7. Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp comment "SSH"
    ufw allow 8000/tcp comment "API Service"
    ufw allow 7860/tcp comment "HF Model Service"
    ufw --force enable
    print_status "Firewall configured"
else
    print_warning "UFW not installed, skipping firewall configuration"
fi

# 8. Setup GitHub Actions Runner User
echo ""
echo "8. Setting up GitHub Actions runner user..."
RUNNER_USER="github-runner"
if id "$RUNNER_USER" &>/dev/null; then
    print_status "Runner user already exists"
else
    useradd -m -s /bin/bash $RUNNER_USER
    usermod -aG sudo $RUNNER_USER
    print_status "Runner user created: $RUNNER_USER"
fi

# 9. Configure Sudo Permissions for Runner
echo ""
echo "9. Configuring sudo permissions..."
SUDOERS_FILE="/etc/sudoers.d/github-runner"
cat > "$SUDOERS_FILE" <<EOF
# GitHub Actions Runner sudo permissions
$RUNNER_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl, /bin/cp, /bin/mkdir, /bin/chown, /bin/chmod, /bin/sed, /bin/tee, /usr/bin/journalctl, /bin/rm
EOF
chmod 0440 "$SUDOERS_FILE"
print_status "Sudo permissions configured"

# 10. Install GitHub Actions Runner (manual step)
echo ""
echo "10. GitHub Actions Runner Installation"
print_warning "Manual step required:"
echo "  1. Go to: https://github.com/YOUR_ORG/YOUR_REPO/settings/actions/runners"
echo "  2. Click 'New self-hosted runner'"
echo "  3. Select 'Linux' and 'x64'"
echo "  4. Copy the configuration commands"
echo "  5. Run them as user: $RUNNER_USER"
echo ""
echo "  Example commands:"
echo "    sudo su - $RUNNER_USER"
echo "    mkdir actions-runner && cd actions-runner"
echo "    curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz"
echo "    tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz"
echo "    ./config.sh --url https://github.com/YOUR_ORG/YOUR_REPO --token YOUR_TOKEN"
echo "    sudo ./svc.sh install"
echo "    sudo ./svc.sh start"

# 11. Create .env file templates
echo ""
echo "11. Creating .env file templates..."
cat > "$DEPLOY_PATH/hf-model-service/.env.example" <<EOF
# Server Configuration
HOST=0.0.0.0
PORT=7860
LOG_LEVEL=info

# Model Configuration
MAX_CACHED_MODELS=2
OUTPUT_DIR=./outputs

# Hugging Face Authentication (Optional)
HF_TOKEN=

# GPU Configuration
CUDA_VISIBLE_DEVICES=0
PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512

# API Key Authentication (Optional)
API_KEY=
EOF

cat > "$DEPLOY_PATH/api-service/.env.example" <<EOF
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=llama3.1:8b
EMBEDDING_MODEL=nomic-embed-text

# Model Parameters
MAX_TOKENS=4096
TEMPERATURE=0.7
TOP_P=0.9
FREQUENCY_PENALTY=0.0
PRESENCE_PENALTY=0.0

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
RELOAD=false

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
EOF

chown -R $SERVICE_USER:$SERVICE_USER "$DEPLOY_PATH"
print_status ".env.example files created"

# 12. Summary
echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Ubuntu Server: $UBUNTU_VERSION ($UBUNTU_CODENAME)"
echo ""
echo "Summary:"
echo "  ✓ System updated"
echo "  ✓ Essential tools installed"
echo "  ✓ Python $(python3 --version | cut -d' ' -f2) installed"
echo "  ✓ Miniconda installed"
if lspci | grep -i nvidia &> /dev/null; then
    if command -v nvidia-smi &> /dev/null; then
        echo "  ✓ NVIDIA drivers installed"
    else
        echo "  ⚠ NVIDIA drivers installed (REBOOT REQUIRED)"
    fi
fi
echo "  ✓ Deployment directory created: $DEPLOY_PATH"
echo "  ✓ Firewall configured"
echo "  ✓ Runner user created: $RUNNER_USER"
echo "  ✓ Sudo permissions configured"
echo ""
echo "Next Steps:"
echo "  1. Install GitHub Actions Runner (see step 10 above)"
echo "  2. Configure GitHub Secrets in repository settings"
echo "  3. Test deployment by pushing to 'stage' branch"
echo ""
if lspci | grep -i nvidia &> /dev/null && ! command -v nvidia-smi &> /dev/null; then
    echo -e "${YELLOW}⚠ IMPORTANT: Reboot required for NVIDIA drivers to work${NC}"
    echo "   Run: sudo reboot"
    echo ""
fi
echo "For detailed documentation, see: docs/EC2-ENVIRONMENT-SETUP.md"
echo "========================================="

