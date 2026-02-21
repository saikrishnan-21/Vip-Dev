#!/bin/bash
# VIPContentAI - Ollama GPU Instance User Data Script
# This script sets up Dockerized Ollama, Node.js API proxy, and Nginx with SSL

set -e
set -x

# Log everything
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "=== VIPContentAI Ollama Setup Started at $(date) ==="

# Variables from Terraform
API_KEY="${api_key}"
DOMAIN_NAME="${domain_name}"
ADMIN_EMAIL="${admin_email}"
OLLAMA_MODELS='${ollama_models}'
OLLAMA_NUM_PARALLEL=${ollama_num_parallel}
OLLAMA_MAX_LOADED=${ollama_max_loaded}
OLLAMA_KEEP_ALIVE="${ollama_keep_alive}"
ENVIRONMENT="${environment}"

# Update system
echo "=== Updating system packages ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y
apt-get install -y jq curl git unzip nginx certbot python3-certbot-nginx

# Verify Docker is installed (DLAMI should have it)
if ! command -v docker &> /dev/null; then
    echo "=== Installing Docker ==="
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker ubuntu || true
    systemctl enable docker
    systemctl start docker
fi

# Verify NVIDIA drivers
echo "=== Verifying NVIDIA GPU ==="
nvidia-smi || echo "WARNING: nvidia-smi not available"

# Verify NVIDIA Container Toolkit
if ! docker run --rm --runtime=nvidia --gpus all nvidia/cuda:12.3.2-base-ubuntu22.04 nvidia-smi; then
    echo "ERROR: NVIDIA Container Toolkit not working properly"
    exit 1
fi

# Create persistent directory for Ollama models
echo "=== Creating Ollama data directory ==="
mkdir -p /var/lib/ollama
chmod 755 /var/lib/ollama

# Pull and run Ollama container
echo "=== Setting up Ollama container ==="
docker pull ollama/ollama:latest
docker rm -f ollama 2>/dev/null || true

docker run -d \
  --name ollama \
  --restart=always \
  --runtime=nvidia \
  --gpus all \
  -e OLLAMA_HOST=0.0.0.0:11434 \
  -e OLLAMA_NUM_PARALLEL=$OLLAMA_NUM_PARALLEL \
  -e OLLAMA_MAX_LOADED_MODELS=$OLLAMA_MAX_LOADED \
  -e OLLAMA_KEEP_ALIVE=$OLLAMA_KEEP_ALIVE \
  -p 127.0.0.1:11434:11434 \
  -v /var/lib/ollama:/root/.ollama \
  ollama/ollama:latest

# Wait for Ollama to be ready
echo "=== Waiting for Ollama to start ==="
sleep 10
for i in {1..30}; do
    if curl -s http://127.0.0.1:11434/api/tags >/dev/null; then
        echo "Ollama is ready"
        break
    fi
    echo "Waiting for Ollama... ($i/30)"
    sleep 2
done

# Pre-pull models
echo "=== Pre-pulling Ollama models ==="
MODELS=$(echo "$OLLAMA_MODELS" | jq -r '.[]')
for model in $MODELS; do
    echo "Pulling model: $model"
    docker exec ollama ollama pull "$model" || echo "Failed to pull $model"
done

# List installed models
echo "=== Installed models ==="
docker exec ollama ollama list

# Set up Node.js API service
echo "=== Setting up Node.js API service ==="

# Create service user
if ! id -u app &>/dev/null; then
    useradd --system --create-home --shell /bin/bash app
fi

# Install Node.js via nvm for the app user
sudo -i -u app bash << 'EOFNODE'
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js LTS
nvm install --lts
nvm use --lts

# Create project directory
mkdir -p ~/ollama-api
cd ~/ollama-api

# Initialize package.json
cat > package.json << 'EOFPKG'
{
  "name": "vipcontentai-ollama-api",
  "version": "1.0.0",
  "type": "module",
  "description": "Node.js API proxy for Ollama",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "node-fetch": "^3.3.2"
  }
}
EOFPKG

# Install dependencies
npm install

# Create server.js
cat > server.js << 'EOFSERVER'
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json({ limit: "10mb" }));

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const API_KEY = process.env.API_KEY || "";

// Middleware: API key authentication
app.use((req, res, next) => {
  if (API_KEY && req.headers.authorization !== `Bearer ${API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (response.ok) {
      const data = await response.json();
      res.json({
        status: "healthy",
        ollama_connected: true,
        models: data.models?.length || 0
      });
    } else {
      res.status(503).json({ status: "unhealthy", ollama_connected: false });
    }
  } catch (error) {
    res.status(503).json({ status: "unhealthy", error: error.message });
  }
});

// List models endpoint
app.get("/models", async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat/generate endpoint with streaming
app.post("/chat", async (req, res) => {
  try {
    const body = {
      model: req.body.model || "llama3.1:8b-instruct-q4_K_M",
      prompt: req.body.prompt || "",
      stream: req.body.stream !== false
    };

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    if (body.stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      for await (const chunk of response.body) {
        res.write(`data: ${chunk.toString()}\n\n`);
      }
      res.end();
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Embeddings endpoint
app.post("/embeddings", async (req, res) => {
  try {
    const body = {
      model: req.body.model || "nomic-embed-text:latest",
      prompt: req.body.text || req.body.prompt || ""
    };

    const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "127.0.0.1", () => {
  console.log(`VIPContentAI Ollama API listening on port ${PORT}`);
  console.log(`Ollama URL: ${OLLAMA_URL}`);
  console.log(`API Key protection: ${API_KEY ? 'enabled' : 'disabled'}`);
});
EOFSERVER

# Install PM2 globally
npm install -g pm2

# Start the service with PM2
API_KEY="${API_KEY}" OLLAMA_URL="http://127.0.0.1:11434" pm2 start server.js --name ollama-api

# Save PM2 process list
pm2 save

# Set up PM2 to start on boot
pm2 startup systemd -u app --hp /home/app | sed 's/sudo //g' | bash

EOFNODE

# Configure Nginx
echo "=== Configuring Nginx ==="
cat > /etc/nginx/sites-available/ollama << EOFNGINX
server {
    listen 80;
    server_name $DOMAIN_NAME;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # WebSocket support for streaming
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts for long-running requests
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }
}
EOFNGINX

ln -sf /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/ollama
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

# Wait for DNS propagation (optional, can skip if DNS is already set)
echo "=== Waiting for DNS propagation (30 seconds) ==="
sleep 30

# Obtain SSL certificate with Let's Encrypt
echo "=== Obtaining SSL certificate ==="
certbot --nginx \
  -d $DOMAIN_NAME \
  --non-interactive \
  --agree-tos \
  --email $ADMIN_EMAIL \
  --redirect

# Set up auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer

# Create CloudWatch Logs agent configuration
echo "=== Setting up CloudWatch Logs agent ==="
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOFCW
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "/aws/ec2/vipcontentai-ollama-$ENVIRONMENT",
            "log_stream_name": "{instance_id}/user-data"
          },
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "/aws/ec2/vipcontentai-ollama-$ENVIRONMENT",
            "log_stream_name": "{instance_id}/nginx-access"
          },
          {
            "file_path": "/var/log/nginx/error.log",
            "log_group_name": "/aws/ec2/vipcontentai-ollama-$ENVIRONMENT",
            "log_stream_name": "{instance_id}/nginx-error"
          }
        ]
      }
    }
  }
}
EOFCW

# Install and start CloudWatch agent if available
if command -v /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl &> /dev/null; then
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config \
      -m ec2 \
      -s \
      -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
fi

# Create a status check script
cat > /usr/local/bin/ollama-status << 'EOFSTATUS'
#!/bin/bash
echo "=== Ollama GPU Instance Status ==="
echo ""
echo "GPU Status:"
nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu,utilization.memory,memory.used,memory.total --format=csv,noheader,nounits
echo ""
echo "Ollama Container:"
docker ps --filter name=ollama --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Loaded Models:"
docker exec ollama ollama ps 2>/dev/null || echo "Unable to query Ollama"
echo ""
echo "Node.js API:"
sudo -u app pm2 status ollama-api 2>/dev/null || echo "PM2 status unavailable"
echo ""
echo "Nginx Status:"
systemctl status nginx --no-pager | grep Active
echo ""
echo "SSL Certificate:"
certbot certificates 2>/dev/null | grep -A2 "Certificate Name" || echo "No certificates found"
EOFSTATUS

chmod +x /usr/local/bin/ollama-status

# Create helpful aliases for ubuntu user
cat >> /home/ubuntu/.bashrc << 'EOFBASH'

# VIPContentAI Ollama Aliases
alias ollama-status='/usr/local/bin/ollama-status'
alias ollama-logs='docker logs -f ollama'
alias ollama-models='docker exec ollama ollama list'
alias ollama-ps='docker exec ollama ollama ps'
alias api-logs='sudo -u app pm2 logs ollama-api'
alias api-restart='sudo -u app pm2 restart ollama-api'
alias nginx-logs='tail -f /var/log/nginx/access.log /var/log/nginx/error.log'

echo ""
echo "VIPContentAI Ollama GPU Instance"
echo "================================="
echo "Commands available:"
echo "  ollama-status    - Show comprehensive status"
echo "  ollama-logs      - View Ollama container logs"
echo "  ollama-models    - List installed models"
echo "  ollama-ps        - Show loaded models and GPU usage"
echo "  api-logs         - View Node.js API logs"
echo "  api-restart      - Restart Node.js API"
echo "  nginx-logs       - View Nginx logs"
echo ""
EOFBASH

# Final status check
echo "=== Setup Complete at $(date) ==="
echo "=== Running status check ==="
/usr/local/bin/ollama-status

echo ""
echo "=== VIPContentAI Ollama GPU Instance Ready ==="
echo "API Endpoint: https://$DOMAIN_NAME/chat"
echo "Health Check: https://$DOMAIN_NAME/health"
echo ""
echo "Test with:"
echo "curl -N -X POST https://$DOMAIN_NAME/chat \\"
echo "  -H 'Authorization: Bearer $API_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"model\":\"llama3.1:8b-instruct-q4_K_M\",\"prompt\":\"Hello from VIPContentAI\"}'"
echo ""
