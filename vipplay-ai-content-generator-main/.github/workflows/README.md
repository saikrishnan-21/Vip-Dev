# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD automation of the VIPContentAI project.

## Available Workflows

### 1. `deploy-ec2-staging-env.yml` (Staging - .env Files Method) ⭐ Recommended

Deploys Next.js frontend and FastAPI backend to EC2 staging environment using `.env.staging` files from the repository.

#### Trigger Conditions

- **Automatic**: Pushes to `stage` branch
- **Runner**: `self-hosted` with label `staging-runner`

#### Services Deployed

1. **Next.js Frontend**
   - Deployed to: Path specified in `EC2_FRONTEND_PATH` secret
   - Port: `3000` (default)
   - Process Manager: PM2 (fallback: nohup)
   - Environment: Creates `.env.production` from GitHub Secrets

2. **FastAPI Backend**
   - Deployed to: Path specified in `EC2_BACKEND_PATH` secret
   - Port: `8000`
   - Systemd service: `vipcontentai-fastapi.service`
   - Environment: Uses inline environment variables

#### Prerequisites

1. **Self-hosted Runner**: `staging-runner` must be configured and running
2. **Required Software**:
   - Node.js 20+
   - pnpm
   - Python 3.10+
   - PM2 (optional, auto-installed)
   - Systemd

3. **GitHub Secrets** (Required):
   - `EC2_HOST`: EC2 instance hostname/IP
   - `EC2_USER`: SSH username
   - `EC2_SSH_KEY`: Private SSH key for EC2 access
   - `EC2_FRONTEND_PATH`: Deployment path for frontend
   - `EC2_BACKEND_PATH`: Deployment path for backend
   - `MONGODB_URI`: MongoDB connection string
   - `JWT_SECRET`: JWT signing secret
   - `FASTAPI_URL`: FastAPI service URL
   - **AWS S3 Credentials** (Required for image storage):
     - `AWS_ACCESS_KEY_ID`: AWS access key for S3
     - `AWS_SECRET_ACCESS_KEY`: AWS secret key for S3
     - `AWS_REGION`: AWS region (e.g., `ap-southeast-2`)
     - `S3_BUCKET_NAME`: S3 bucket name
     - `S3_FOLDER_PREFIX`: Folder prefix (e.g., `dev`, `staging`, `prod`)
   - And many more (see workflow file for complete list)

#### Environment Variables

Environment variables are created inline in the workflow from GitHub Secrets. No `.env` files are used.

---

### 2. `deploy-ec2-production-env.yml` (Production - .env Files Method) ⭐ Recommended

Deploys Next.js frontend and FastAPI backend to EC2 production environment using `.env.production` files from the repository.

#### Trigger Conditions

- **Automatic**: Pushes to `main` or `production` branch
- **Runner**: `self-hosted` with label `production-runner`

#### Services Deployed

1. **Next.js Frontend**
   - Deployed to: Path specified in `EC2_FRONTEND_PATH` secret
   - Port: `3000`
   - Process Manager: PM2 (fallback: nohup)
   - Environment: Uses `.env.staging` → `.env.production`

2. **FastAPI Backend**
   - Deployed to: Path specified in `EC2_BACKEND_PATH` secret
   - Port: `8000`
   - Systemd service: `vipcontentai-fastapi.service`
   - Environment: Uses `api-service/.env.staging` → `api-service/.env`

#### Prerequisites

1. **Self-hosted Runner**: `staging-runner` must be configured and running
2. **Required Software**: Same as above
3. **Environment Files**: Must exist in repository:
   - `.env.staging` (root directory)
   - `api-service/.env.staging` (api-service directory)

4. **GitHub Secrets** (Minimal):
   - `EC2_HOST`: EC2 instance hostname/IP
   - `EC2_USER`: SSH username
   - `EC2_SSH_KEY`: Private SSH key for EC2 access
   - `EC2_FRONTEND_PATH`: Deployment path for frontend
   - `EC2_BACKEND_PATH`: Deployment path for backend

#### Environment Files

The workflow uses `.env.staging` files from the repository:

1. **Frontend**: 
   - Reads `.env.staging` from root
   - Copies to `.env.production` with `PORT=3001` enforced
   - Deploys to server

2. **Backend**:
   - Reads `api-service/.env.staging`
   - Copies to `api-service/.env`
   - Systemd service loads via `EnvironmentFile`

#### Creating Environment Files

**For Staging:**
```bash
# Run the script to create .env.staging files
bash scripts/create-env-staging.sh

# Edit frontend .env.staging
nano .env.staging

# Edit backend .env.staging
nano api-service/.env.staging
```

**For Production:**
```bash
# Run the script to create .env.production files
bash scripts/create-env-production.sh

# Edit frontend .env.production
nano .env.production

# Edit backend .env.production
nano api-service/.env.production
```

#### Advantages of .env Files Method

✅ **Simpler**: No need to manage many GitHub Secrets  
✅ **Version Controlled**: Environment config tracked in git  
✅ **Easier Updates**: Edit files and commit  
✅ **Consistent**: Same config across all deployments  

---

## Comparison: Staging vs Production

| Feature | Staging (`deploy-ec2-staging-env.yml`) | Production (`deploy-ec2-production-env.yml`) |
|---------|--------------------------------------|-------------------------------------------|
| **Environment Source** | `.env.staging` files | `.env.production` files |
| **Trigger Branch** | `stage` | `main` or `production` |
| **Runner** | `staging-runner` | `production-runner` |
| **Port** | 3000 | 3000 |
| **Setup Complexity** | Low (few secrets) | Low (few secrets) |
| **Config Management** | Git repository | Git repository |
| **GitHub Secrets Override** | ✅ Supported | ✅ Recommended for sensitive data |
| **Security** | Config in repo (OK for staging) | Use GitHub Secrets for production |

---

## Deployment Process

Both workflows follow similar steps:

### Frontend Deployment

1. **Checkout**: Clone repository
2. **Setup Node.js**: Install Node.js 20 and pnpm
3. **Install Dependencies**: `pnpm install --frozen-lockfile`
4. **Prepare Environment**: Create `.env.production` from `.env.staging` or secrets
5. **Build**: `pnpm run build`
6. **Archive**: Create `frontend.tar.gz` with build artifacts
7. **Copy to EC2**: SCP archive to server
8. **Deploy**: Extract, install production deps, start with PM2

### Backend Deployment

1. **Checkout**: Clone repository
2. **Prepare Environment**: Create `.env` from `.env.staging` or secrets
3. **Archive**: Create `backend.tar.gz` with api-service
4. **Copy to EC2**: SCP archive to server
5. **Deploy**: Extract, setup venv, install deps, configure systemd, restart service

---

## Service Management

### Frontend (PM2)

```bash
# Check status
pm2 status vipcontentai-frontend

# View logs
pm2 logs vipcontentai-frontend

# Restart
pm2 restart vipcontentai-frontend

# Stop
pm2 stop vipcontentai-frontend
```

### Backend (Systemd)

```bash
# Check status
sudo systemctl status vipcontentai-fastapi.service

# View logs
sudo journalctl -u vipcontentai-fastapi.service -f

# Restart
sudo systemctl restart vipcontentai-fastapi.service

# Stop
sudo systemctl stop vipcontentai-fastapi.service
```

---

## Health Checks

After deployment, verify services are running:

```bash
# Frontend (port 3000 for both workflows)
curl http://localhost:3000/api/health

# Backend
curl http://localhost:8000/health
```

---

## Troubleshooting

### S3 Image Storage Issues

If image generation fails with S3 errors:

1. **Verify S3 credentials are set**:
   ```bash
   # On server, check FastAPI .env
   grep -E "AWS_|S3_" /path/to/backend/.env
   ```

2. **Test S3 connection**:
   ```bash
   # From FastAPI server
   python3 -c "import boto3; s3 = boto3.client('s3', aws_access_key_id='YOUR_KEY', aws_secret_access_key='YOUR_SECRET', region_name='YOUR_REGION'); print(s3.list_buckets())"
   ```

3. **Check S3 bucket permissions**:
   - Ensure IAM user has `s3:PutObject` and `s3:GetObject` permissions
   - Verify bucket exists and is accessible
   - Check bucket CORS configuration if serving images publicly

4. **Verify boto3 is installed**:
   ```bash
   # In FastAPI virtual environment
   source venv/bin/activate
   pip list | grep boto3
   ```

### Frontend Issues

1. **Service won't start**:
   ```bash
   # Check PM2 logs
   pm2 logs vipcontentai-frontend --lines 50
   
   # Check if port is in use
   lsof -i :3000
   ```

2. **Build fails**:
   - Check Node.js version: `node --version` (should be 20+)
   - Check pnpm: `pnpm --version`
   - Review build logs in GitHub Actions

3. **Environment variables not loading**:
   - Verify `.env.production` exists on server
   - Check file permissions: `ls -la .env.production`
   - Ensure `PORT=3000` is set

### Backend Issues

1. **Service won't start**:
   ```bash
   # Check systemd logs
   sudo journalctl -u vipcontentai-fastapi.service -n 50
   
   # Check if .env file exists
   ls -la /path/to/api-service/.env
   ```

2. **Environment variables not loading**:
   - Verify `.env` file exists: `ls -la api-service/.env`
   - Check systemd service file: `sudo cat /etc/systemd/system/vipcontentai-fastapi.service`
   - Ensure `EnvironmentFile` is set correctly

3. **Python dependencies issues**:
   ```bash
   # Activate venv and check
   source /path/to/api-service/venv/bin/activate
   pip list
   ```

### Runner Issues

1. **Runner not responding**:
   - Go to **Settings** → **Actions** → **Runners**
   - Verify `staging-runner` is online
   - Check runner logs on EC2 instance

2. **SSH connection fails**:
   - Verify `EC2_SSH_KEY` secret is correct
   - Check EC2 security group allows SSH
   - Test SSH manually: `ssh -i key.pem user@host`

---

## Configuration Files

### Frontend Environment

- **Development**: `.env.local` (gitignored)
- **Staging**: `.env.staging` (committed) → `.env.production` (on server)
- **Production**: `.env.production` (on server)

### Backend Environment

- **Development**: `api-service/.env` (gitignored)
- **Staging**: `api-service/.env.staging` (committed) → `api-service/.env` (on server)
- **Production**: `api-service/.env` (on server)

### Systemd Service

- **Location**: `/etc/systemd/system/vipcontentai-fastapi.service`
- **Auto-created**: By deployment workflow
- **Environment**: Loads from `api-service/.env` file

---

## Security Best Practices

### For GitHub Secrets Method

✅ Store sensitive values in GitHub Secrets  
✅ Never commit secrets to repository  
✅ Rotate secrets regularly  
✅ Use different secrets per environment  

### For .env Files Method

⚠️ **Warning**: `.env.staging` files are committed to git

✅ Use `.env.staging` for non-sensitive staging config  
✅ Use GitHub Secrets for production  
✅ Never commit `.env.local` or `.env` files  
✅ Review `.env.staging` files before committing  
✅ Use strong JWT secrets even in staging  

---

## Port Configuration

- **Frontend**: Port `3000` (both workflows)
- **Backend**: Port `8000` (both workflows)
- **Ollama**: Port `11434`
- **MongoDB**: Port `27017`

To change ports, update:
1. `.env.staging` files (for new workflow)
2. GitHub Secrets `PORT` (for old workflow)
3. `package.json` scripts (for local development)

---

## Migration Guide

### From Old Workflow to New Workflow

1. **Create .env.staging files**:
   ```bash
   bash scripts/create-env-staging.sh
   ```

2. **Update values** in `.env.staging` and `api-service/.env.staging`

3. **Commit files**:
   ```bash
   git add .env.staging api-service/.env.staging
   git commit -m "Add .env.staging files for new deployment workflow"
   git push
   ```

4. **Verify**: The new workflow will automatically trigger on push to `stage` branch

5. **Keep old workflow**: Both can coexist, or disable the old one in GitHub Actions settings

---

## Additional Resources

- **Environment Variables Guide**: See `ENV_MAINTENANCE.md` in project root
- **Deployment Scripts**: See `scripts/deploy/` directory
- **Docker Compose**: See `scripts/deploy/docker-compose.yml` for local testing

---

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review service logs on EC2 instance
3. Verify environment files and secrets
4. Check runner status in GitHub Settings
