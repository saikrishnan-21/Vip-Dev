# How to Start FastAPI Service

## The Error
If you see: `ERROR: Error loading ASGI app. Could not import module "main"`

This means you're running uvicorn from the **wrong directory**.

## Solution

### ✅ Correct Way (Run from api-service directory)

```bash
# 1. Navigate to api-service directory
cd api-service

# 2. Activate virtual environment (if using one)
.venv\Scripts\activate  # Windows
# or
source .venv/bin/activate  # Linux/Mac

# 3. Run uvicorn from api-service directory
uvicorn main:app --reload --port 8000
```

### ❌ Wrong Way (Running from root directory)

```bash
# DON'T do this from the root directory:
cd C:\projects\vipplay\vipplay-ai-content-generator
uvicorn main:app --reload  # ❌ This will fail!
```

## Alternative: Use Python to Run

You can also run it directly with Python:

```bash
cd api-service
python main.py
```

This will use the `if __name__ == "__main__"` block in main.py.

## Verify It's Working

Once started, you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

Then visit: http://localhost:8000/docs

## Quick Start Script

Create a `start.bat` (Windows) or `start.sh` (Linux/Mac) in `api-service/`:

**Windows (start.bat):**
```batch
@echo off
cd /d %~dp0
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
)
uvicorn main:app --reload --port 8000
```

**Linux/Mac (start.sh):**
```bash
#!/bin/bash
cd "$(dirname "$0")"
if [ -f .venv/bin/activate ]; then
    source .venv/bin/activate
fi
uvicorn main:app --reload --port 8000
```

Then just run:
```bash
# Windows
start.bat

# Linux/Mac
chmod +x start.sh
./start.sh
```

