# FastAPI Error Troubleshooting Guide

This guide helps diagnose and fix common FastAPI errors in the VIPContentAI AI Service.

## Table of Contents

1. [Understanding Error Responses](#understanding-error-responses)
2. [Common Error Scenarios](#common-error-scenarios)
3. [Checking Service Status](#checking-service-status)
4. [Viewing Logs](#viewing-logs)
5. [Debugging Steps](#debugging-steps)
6. [Environment Variables](#environment-variables)

## Understanding Error Responses

With the enhanced error handling, all errors now return detailed JSON responses:

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description",
  "type": "ExceptionType",
  "path": "GET /api/endpoint",
  "timestamp": "2025-01-15T10:30:00.123456",
  "traceback": "Full traceback (only in DEBUG mode)"
}
```

### HTTP Status Codes

- **200 OK**: Request successful
- **400 Bad Request**: Invalid request parameters
- **422 Unprocessable Entity**: Validation error (Pydantic)
- **500 Internal Server Error**: Unhandled exception
- **503 Service Unavailable**: Service dependency unavailable (e.g., Ollama)

## Common Error Scenarios

### 1. 500 Internal Server Error

**Symptoms:**
- Generic "Internal Server Error" response
- Service appears to be running

**Diagnosis Steps:**

1. **Check service logs:**
   ```bash
   # If using systemd
   sudo journalctl -u vipcontentai-backend -n 100 --no-pager
   
   # If using PM2
   pm2 logs vipcontentai-backend --lines 100
   
   # If running directly
   # Check console output or log file
   ```

2. **Check health endpoint:**
   ```bash
   curl http://localhost:8000/health
   ```

3. **Enable DEBUG logging:**
   ```bash
   # In .env file
   LOG_LEVEL=DEBUG
   ```

4. **Check error response details:**
   - The error response now includes:
     - Exception type
     - Full error message
     - Request path
     - Timestamp
     - Traceback (if DEBUG mode)

**Common Causes:**

- **Ollama connection failure:**
  ```bash
  # Check Ollama is running
  curl http://localhost:11434/api/tags
  
  # Check OLLAMA_BASE_URL in .env
  echo $OLLAMA_BASE_URL
  ```

- **Missing environment variables:**
  ```bash
  # Check required variables
  cat api-service/.env | grep -E "OLLAMA_BASE_URL|DEFAULT_MODEL"
  ```

- **Import errors:**
  ```bash
  # Check Python dependencies
  cd api-service
  pip list | grep -E "fastapi|crewai|ollama"
  ```

- **Port conflicts:**
  ```bash
  # Check if port 8000 is in use
  sudo lsof -i :8000
  # or
  netstat -tuln | grep 8000
  ```

### 2. 503 Service Unavailable

**Symptoms:**
- Health check returns "degraded" or "unhealthy"
- Ollama connection issues

**Diagnosis Steps:**

1. **Check Ollama service:**
   ```bash
   # Test Ollama directly
   curl http://localhost:11434/api/tags
   
   # Check Ollama logs
   # If using Docker:
   docker logs ollama
   # If using systemd:
   sudo journalctl -u ollama -n 50
   ```

2. **Verify Ollama URL:**
   ```bash
   # Check environment variable
   grep OLLAMA_BASE_URL api-service/.env
   
   # Test connection
   curl $(grep OLLAMA_BASE_URL api-service/.env | cut -d'=' -f2)/api/tags
   ```

3. **Check network connectivity:**
   ```bash
   # If Ollama is on remote server
   ping <ollama-server-ip>
   telnet <ollama-server-ip> 11434
   ```

**Common Fixes:**

- **Ollama not running:**
  ```bash
  # Start Ollama
  # Docker:
  docker start ollama
  # Systemd:
  sudo systemctl start ollama
  ```

- **Wrong Ollama URL:**
  ```bash
  # Update .env file
  OLLAMA_BASE_URL=http://localhost:11434
  # or for remote:
  OLLAMA_BASE_URL=http://44.197.16.15:11434
  ```

- **Firewall blocking:**
  ```bash
  # Check firewall rules
  sudo ufw status
  # Allow port if needed
  sudo ufw allow 11434/tcp
  ```

### 3. 422 Validation Error

**Symptoms:**
- Request validation fails
- Error response includes validation details

**Diagnosis:**

The error response includes detailed validation information:

```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "loc": ["body", "topic"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Common Causes:**

- Missing required fields
- Wrong data types
- Invalid enum values
- String length violations

**Fix:**

- Check request body matches API schema
- Review API documentation at `/docs`
- Ensure all required fields are present

### 4. Connection Refused / Cannot Connect

**Symptoms:**
- Cannot reach FastAPI service
- Connection refused errors

**Diagnosis Steps:**

1. **Check if service is running:**
   ```bash
   # Systemd
   sudo systemctl status vipcontentai-backend
   
   # PM2
   pm2 status
   
   # Direct process
   ps aux | grep uvicorn
   ```

2. **Check port binding:**
   ```bash
   # Check if port is listening
   sudo netstat -tuln | grep 8000
   # or
   sudo ss -tuln | grep 8000
   ```

3. **Check firewall:**
   ```bash
   sudo ufw status
   sudo iptables -L -n | grep 8000
   ```

**Common Fixes:**

- **Service not started:**
  ```bash
  # Start service
  sudo systemctl start vipcontentai-backend
  # or
  pm2 start ecosystem.config.js
  ```

- **Wrong host binding:**
  ```bash
  # Check API_HOST in .env
  # Should be 0.0.0.0 for external access
  API_HOST=0.0.0.0
  ```

- **Port conflict:**
  ```bash
  # Find process using port 8000
  sudo lsof -i :8000
  # Kill or change port
  ```

## Checking Service Status

### Health Check Endpoint

```bash
# Basic health check
curl http://localhost:8000/health

# Expected response:
{
  "status": "healthy",
  "service": "VIPContentAI AI Service",
  "ollama_url": "http://localhost:11434",
  "ollama_connected": true,
  "timestamp": "2025-01-15T10:30:00.123456"
}
```

### List Available Models

```bash
# Check if Ollama models are accessible
curl http://localhost:8000/models
```

### Test Model Connection

```bash
# Test a specific model
curl -X POST http://localhost:8000/models/test \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.1:8b", "prompt": "Hello"}'
```

## Viewing Logs

### Date/Time-Based Log Files

The service now uses date/time-based log files with automatic rotation:

**Log File Locations:**
- **Main logs**: `api-service/logs/app.log` (all log levels)
- **Error logs**: `api-service/logs/error.log` (errors and critical only)
- **Log rotation**: Daily at midnight
- **Retention**: 30 days of logs kept automatically

**Log File Naming:**
- Current day: `app.log` and `error.log`
- Previous days: `app.log.2025-01-15`, `error.log.2025-01-15`, etc.

**Viewing Logs:**

```bash
# View current main log file
tail -f api-service/logs/app.log

# View current error log file
tail -f api-service/logs/error.log

# View logs from specific date
cat api-service/logs/app.log.2025-01-15

# View errors from specific date
cat api-service/logs/error.log.2025-01-15

# Search logs for specific text
grep "ERROR" api-service/logs/app.log

# View last 100 lines
tail -n 100 api-service/logs/app.log

# View logs from last hour
grep "$(date -d '1 hour ago' '+%Y-%m-%d %H')" api-service/logs/app.log
```

### Systemd Service Logs

```bash
# View recent logs
sudo journalctl -u vipcontentai-backend -n 100

# Follow logs in real-time
sudo journalctl -u vipcontentai-backend -f

# View logs from specific time
sudo journalctl -u vipcontentai-backend --since "1 hour ago"

# View error logs only
sudo journalctl -u vipcontentai-backend -p err -n 50
```

### PM2 Logs

```bash
# View all logs
pm2 logs vipcontentai-backend

# View last 100 lines
pm2 logs vipcontentai-backend --lines 100

# View error logs only
pm2 logs vipcontentai-backend --err --lines 100

# Clear logs
pm2 flush vipcontentai-backend
```

### Direct Process Logs

If running directly with uvicorn, logs are written to both:
- Console (stdout)
- Log files in `logs/` directory

### Log Levels

Set log level in `.env`:

```bash
# Options: DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_LEVEL=DEBUG  # Most verbose
LOG_LEVEL=INFO   # Default
LOG_LEVEL=ERROR  # Errors only
```

**Note:** Log files are created automatically in the `logs/` directory when the service starts.

## Debugging Steps

### Step 1: Enable Debug Logging

```bash
# Edit api-service/.env
LOG_LEVEL=DEBUG

# Restart service
sudo systemctl restart vipcontentai-backend
# or
pm2 restart vipcontentai-backend
```

### Step 2: Check Service Startup

Look for startup logs:

```
============================================================
Starting VIPContentAI AI Service
============================================================
Ollama URL: http://localhost:11434
Default Model: llama3.1:8b
API Host: 0.0.0.0
API Port: 8000
Log Level: DEBUG
CORS Origins: http://localhost:3000
✅ Ollama service is healthy
============================================================
```

### Step 3: Test Endpoints

```bash
# Test root endpoint
curl http://localhost:8000/

# Test health
curl http://localhost:8000/health

# Test with detailed output
curl -v http://localhost:8000/health
```

### Step 4: Check Error Response

When an error occurs, the response now includes:

- **Exception type**: What kind of error occurred
- **Error message**: Human-readable description
- **Path**: Which endpoint failed
- **Timestamp**: When it occurred
- **Traceback**: Full stack trace (DEBUG mode only)

Example error response:

```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Connection refused to Ollama service",
  "type": "ConnectionError",
  "path": "POST /api/generation/topic",
  "timestamp": "2025-01-15T10:30:00.123456",
  "traceback": "Traceback (most recent call last):\n  ..."
}
```

### Step 5: Check Request Logs

All requests are now logged with:

- Request method and path
- Client IP address
- Response status code
- Request duration

Example log entry:

```
2025-01-15 10:30:00 - INFO - Request: POST /api/generation/topic | Client: 192.168.1.100
2025-01-15 10:30:05 - INFO - Response: POST /api/generation/topic | Status: 200 | Duration: 5.123s
```

## Environment Variables

### Required Variables

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=llama3.1:8b
QUALITY_MODEL=llama3.1:70b
EMBEDDING_MODEL=nomic-embed-text

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=INFO

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000
```

### Verify Environment Variables

```bash
# Check all variables are set
cd api-service
cat .env

# Test variable loading
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('OLLAMA_BASE_URL'))"
```

### Common Environment Issues

1. **Missing .env file:**
   ```bash
   # Create from template
   cp api-service/.env.example api-service/.env
   # Edit with actual values
   nano api-service/.env
   ```

2. **Wrong file location:**
   ```bash
   # .env should be in api-service/ directory
   ls -la api-service/.env
   ```

3. **Variable not loaded:**
   ```bash
   # Ensure load_dotenv() is called before using variables
   # Check main.py imports
   ```

## Quick Diagnostic Commands

```bash
# 1. Check service status
sudo systemctl status vipcontentai-backend

# 2. Check health endpoint
curl http://localhost:8000/health

# 3. Check Ollama connection
curl http://localhost:11434/api/tags

# 4. View recent errors
sudo journalctl -u vipcontentai-backend -p err -n 20

# 5. Test API endpoint
curl -X POST http://localhost:8000/api/generation/topic \
  -H "Content-Type: application/json" \
  -d '{"topic": "test", "word_count": 100}'

# 6. Check port binding
sudo netstat -tuln | grep 8000

# 7. Check environment variables
cd api-service && cat .env | grep -v "^#"

# 8. Check Python dependencies
cd api-service && pip list | grep -E "fastapi|uvicorn|crewai"
```

## Getting Help

If errors persist:

1. **Enable DEBUG logging** and reproduce the error
2. **Capture full error response** (including traceback)
3. **Check service logs** for detailed error messages
4. **Verify environment variables** are correctly set
5. **Test Ollama connection** independently
6. **Check network connectivity** between services

## Error Response Examples

### Successful Request

```json
{
  "success": true,
  "content": "Generated content...",
  "message": "Content generated successfully",
  "metadata": {...}
}
```

### Validation Error

```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "loc": ["body", "topic"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ],
  "path": "POST /api/generation/topic",
  "timestamp": "2025-01-15T10:30:00.123456"
}
```

### Internal Server Error

```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Connection refused to Ollama service",
  "type": "ConnectionError",
  "path": "POST /api/generation/topic",
  "timestamp": "2025-01-15T10:30:00.123456",
  "traceback": "Traceback (most recent call last):\n..."
}
```

### Service Unavailable

```json
{
  "success": false,
  "error": "Service unhealthy: Connection refused",
  "status_code": 503,
  "path": "GET /health",
  "timestamp": "2025-01-15T10:30:00.123456"
}
```
