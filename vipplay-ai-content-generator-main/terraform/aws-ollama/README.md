# VIPContentAI - AWS Ollama GPU Deployment (Terraform)

This Terraform configuration deploys a production-ready Ollama LLM inference server on AWS with GPU acceleration (NVIDIA L4 or L40S).

## Architecture

```
Internet (HTTPS:443)
    ↓
Nginx (SSL/TLS)
    ↓
Node.js API (localhost:3000) → Bearer Token Auth
    ↓
Ollama (localhost:11434) → GPU Inference
    ↓
NVIDIA L4/L40S GPU
    ↓
EBS gp3 (300GB) → Model Storage
```

## Features

- ✅ **GPU-Accelerated**: NVIDIA L4 (24GB) or L40S (48GB VRAM)
- ✅ **Secure**: Nginx with Let's Encrypt SSL, API key authentication
- ✅ **Scalable**: Configurable parallel requests and model loading
- ✅ **Monitored**: CloudWatch Logs and Alarms
- ✅ **Production-Ready**: Auto-restart, health checks, log rotation
- ✅ **Cost-Optimized**: gp3 volumes, right-sized instances

## Prerequisites

1. **AWS Account** with permissions to create EC2, VPC, SG, IAM, CloudWatch
2. **Terraform** 1.0+ installed
3. **AWS CLI** configured with credentials
4. **SSH Key Pair** created in AWS
5. **Domain Name** pointed to the instance (A record)

## Quick Start

### 1. Clone and Navigate

```bash
cd terraform/aws-ollama
```

### 2. Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
# Required
aws_region        = "us-east-1"
environment       = "prod"
instance_type     = "g6e.xlarge"
key_name          = "your-ssh-key"
ssh_allowed_cidrs = ["1.2.3.4/32"]
domain_name       = "api.vipcontentai.com"
admin_email       = "admin@vipcontentai.com"
api_key           = "secure-random-key-32-chars-min"

# Optional (recommended)
allocate_eip = true
enable_detailed_monitoring = true
route53_zone_id = "Z1234567890ABC"  # If using Route53
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Plan Deployment

```bash
terraform plan -out=tfplan
```

Review the plan carefully. You should see resources like:
- EC2 instance (GPU)
- Security Group
- IAM Role & Instance Profile
- Elastic IP (if enabled)
- CloudWatch Log Group
- CloudWatch Alarms

### 5. Apply Configuration

```bash
terraform apply tfplan
```

This will take **10-15 minutes** to:
- Launch EC2 instance
- Install Docker, Nvidia drivers, Ollama
- Pull LLM models (llama3.1:8b, mistral:7b, nomic-embed-text)
- Set up Node.js API with PM2
- Configure Nginx with SSL via Let's Encrypt
- Set up CloudWatch monitoring

### 6. Verify Deployment

After apply completes, note the outputs:

```bash
terraform output
```

Expected outputs:
```
instance_id = "i-0123456789abcdef0"
instance_public_ip = "54.123.45.67"
ssh_command = "ssh -i ~/.ssh/your-key.pem ubuntu@54.123.45.67"
api_endpoint = "https://api.vipcontentai.com/chat"
```

### 7. SSH to Instance

```bash
ssh -i ~/.ssh/your-key.pem ubuntu@<instance_public_ip>
```

### 8. Check Status

```bash
ollama-status
```

This shows:
- GPU status (temperature, utilization, memory)
- Ollama container status
- Loaded models
- Node.js API status
- Nginx status
- SSL certificate info

### 9. Test API

```bash
curl -N -X POST https://api.vipcontentai.com/chat \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.1:8b-instruct-q4_K_M",
    "prompt": "Write a tagline for VIPContentAI"
  }'
```

## Instance Types & Costs

| Instance Type | GPU | VRAM | Use Case | Cost/hour (us-east-1) |
|---------------|-----|------|----------|-----------------------|
| **g6.xlarge** | NVIDIA L4 | 24GB | 1-2 models (7B-13B) | ~$0.84 |
| **g6e.xlarge** | NVIDIA L40S | 48GB | 2-3 models (7B-13B) or 1 large (70B) | ~$1.01 |
| **g6.2xlarge** | NVIDIA L4 | 24GB | Higher throughput | ~$1.69 |
| **g6e.2xlarge** | NVIDIA L40S | 48GB | Multi-model heavy load | ~$2.03 |

**Recommendation**: Start with `g6e.xlarge` for production multi-model serving.

## Configuration

### Ollama Models

Edit `ollama_models` in `terraform.tfvars`:

```hcl
ollama_models = [
  "llama3.1:8b-instruct-q4_K_M",    # Fast, general-purpose
  "llama3.1:70b-instruct-q4_K_M",   # High-quality (requires g6e.xlarge+)
  "mistral:7b-instruct-q4_K_M",     # Alternative fast model
  "nomic-embed-text:latest",        # Embeddings (768-dim)
  "stable-diffusion-xl:latest"      # Image generation (optional)
]
```

**Note**: 70B models require at least `g6e.xlarge` (48GB VRAM).

### Concurrency Settings

```hcl
ollama_num_parallel = 3    # Concurrent requests (increase with better GPU)
ollama_max_loaded   = 3    # Models in memory (balance VRAM vs. latency)
ollama_keep_alive   = "5m" # Keep models loaded for 5 minutes
```

**Tuning Tips**:
- **More parallelism**: Increase `ollama_num_parallel` (watch GPU memory)
- **More models**: Increase `ollama_max_loaded` (requires more VRAM)
- **Faster switching**: Decrease `ollama_keep_alive` (more model loading overhead)

### Security Groups

By default, the security group allows:
- **443/tcp** from `0.0.0.0/0` (HTTPS - Nginx)
- **80/tcp** from `0.0.0.0/0` (HTTP - Let's Encrypt only)
- **22/tcp** from `ssh_allowed_cidrs` (SSH - your office IP)

**Ollama (11434) and Node.js (3000) are NOT exposed publicly** - they bind to `127.0.0.1`.

## Management

### SSH Aliases (Available on Instance)

```bash
ollama-status     # Comprehensive status dashboard
ollama-logs       # Stream Ollama container logs
ollama-models     # List installed models
ollama-ps         # Show loaded models and GPU usage
api-logs          # View Node.js API logs
api-restart       # Restart Node.js API
nginx-logs        # Stream Nginx access/error logs
```

### Add/Remove Models

```bash
# Add a new model
docker exec ollama ollama pull codellama:13b

# Remove unused model
docker exec ollama ollama rm codellama:13b

# List all models
docker exec ollama ollama list
```

### Update Ollama Container

```bash
docker pull ollama/ollama:latest
docker stop ollama
docker rm ollama
docker run -d \
  --name ollama \
  --restart=always \
  --runtime=nvidia \
  --gpus all \
  -e OLLAMA_HOST=0.0.0.0:11434 \
  -e OLLAMA_NUM_PARALLEL=3 \
  -e OLLAMA_MAX_LOADED_MODELS=3 \
  -e OLLAMA_KEEP_ALIVE=5m \
  -p 127.0.0.1:11434:11434 \
  -v /var/lib/ollama:/root/.ollama \
  ollama/ollama:latest
```

### Restart Node.js API

```bash
sudo -u app pm2 restart ollama-api
```

### Renew SSL Certificate

```bash
sudo certbot renew --dry-run  # Test renewal
sudo certbot renew            # Actual renewal (runs automatically via cron)
```

## Monitoring

### CloudWatch Logs

Log groups created:
- `/aws/ec2/vipcontentai-ollama-{environment}`

Log streams:
- `{instance_id}/user-data` - Setup logs
- `{instance_id}/nginx-access` - API access logs
- `{instance_id}/nginx-error` - Nginx errors

### CloudWatch Alarms

Alarms created:
- **High CPU** - Triggers when CPU > 90% for 10 minutes
- **Status Check Failed** - Triggers when instance status checks fail

To receive notifications, set `alarm_sns_topic_arn` in `terraform.tfvars`.

### GPU Monitoring

```bash
# Real-time GPU stats
nvidia-smi -l 1

# GPU utilization over time
watch -n 1 nvidia-smi

# See what models are loaded on GPU
docker exec ollama ollama ps
```

## Scaling

### Vertical Scaling (Bigger Instance)

1. Stop instance: `terraform apply -var="instance_type=g6e.2xlarge"`
2. Terraform will replace the instance
3. User data script runs again, reinstalling everything

**Note**: User data script is idempotent and safe to run multiple times.

### Horizontal Scaling (Multiple Instances)

For high availability and load balancing:

1. Create an Application Load Balancer (ALB)
2. Create a Launch Template from this configuration
3. Create an Auto Scaling Group (ASG) with min=2, desired=2, max=4
4. Point ALB to ASG target group (port 3000)
5. Use Route53 to point domain to ALB

**Future Enhancement**: We can create a separate Terraform module for this.

## Backup & Disaster Recovery

### EBS Snapshots

```bash
# Create snapshot via AWS CLI
aws ec2 create-snapshot \
  --volume-id <volume-id> \
  --description "VIPContentAI Ollama models backup"

# Or use AWS Backup service (recommended)
```

### Restore from Snapshot

1. Create new volume from snapshot
2. Launch new instance with this volume
3. Ollama models will be available immediately

### Model Backup (Manual)

```bash
# Backup models directory
tar -czf ollama-models-backup.tar.gz /var/lib/ollama

# Copy to S3
aws s3 cp ollama-models-backup.tar.gz s3://your-backup-bucket/
```

## Cost Optimization

### Tips to Reduce Costs

1. **Stop when not in use**: `terraform apply -var="instance_type=t3.micro"` (placeholder)
2. **Use Spot Instances**: Add spot configuration (60-70% savings)
3. **Right-size**: Start with `g6.xlarge`, upgrade only if needed
4. **Remove unused models**: Each model ~4-7GB storage
5. **Use Savings Plans**: Commit to 1-year or 3-year for 30-40% discount

### Monthly Cost Estimate (us-east-1)

| Component | Cost |
|-----------|------|
| g6e.xlarge (24/7) | ~$730/month |
| EBS gp3 300GB | ~$24/month |
| Elastic IP (unused) | $0/month |
| CloudWatch Logs (1GB/month) | ~$0.50/month |
| **Total** | **~$755/month** |

**Cost Reduction**: Run only 8 hours/day = ~$250/month

## Troubleshooting

### Ollama Not Responding

```bash
# Check container status
docker ps -a | grep ollama

# Check logs
docker logs ollama --tail 100

# Restart container
docker restart ollama
```

### GPU Not Available

```bash
# Check nvidia-smi
nvidia-smi

# Check NVIDIA Container Toolkit
docker run --rm --runtime=nvidia --gpus all nvidia/cuda:12.3.2-base-ubuntu22.04 nvidia-smi

# If fails, reinstall nvidia-container-toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Node.js API Not Responding

```bash
# Check PM2 status
sudo -u app pm2 status

# View logs
sudo -u app pm2 logs ollama-api

# Restart API
sudo -u app pm2 restart ollama-api

# Full restart
sudo -u app pm2 delete ollama-api
sudo -u app bash -c "cd ~/ollama-api && API_KEY=xxx pm2 start server.js --name ollama-api"
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

This will delete:
- EC2 instance
- Security Group
- IAM Role & Policies
- Elastic IP (if created)
- CloudWatch Log Group
- CloudWatch Alarms

**Warning**: The EBS volume will be deleted, losing all downloaded models. Create a snapshot first if you want to keep them.

## Advanced Configuration

### Custom Models

To add custom models, edit `user-data.sh` and add:

```bash
docker exec ollama ollama pull your-custom-model:tag
```

### GPU Memory Optimization

For multiple large models, tune CUDA memory allocation:

```bash
docker run -d \
  --name ollama \
  ... \
  -e CUDA_VISIBLE_DEVICES=0 \
  -e CUDA_MEM_LIMIT=22GB \
  ...
```

### Integration with VIPContentAI

In your Next.js `.env.local`:

```env
FASTAPI_AI_SERVICE_URL=https://api.vipcontentai.com
OLLAMA_API_KEY=your-bearer-token
```

In FastAPI `api-service/.env`:

```env
OLLAMA_BASE_URL=https://api.vipcontentai.com
OLLAMA_API_KEY=your-bearer-token
```

## Support

For issues:
1. Check CloudWatch Logs: `/aws/ec2/vipcontentai-ollama-{env}`
2. SSH to instance and run `ollama-status`
3. Review Terraform plan: `terraform plan`
4. Consult AWS documentation for GPU instances

## References

- [Ollama Documentation](https://ollama.ai/docs)
- [AWS GPU Instances](https://aws.amazon.com/ec2/instance-types/g6/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/)

---

**Built for VIPContentAI** 🚀 | Production-ready Ollama deployment on AWS
