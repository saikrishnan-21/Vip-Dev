# Start FastAPI AI Service
# Run this script from the project root directory

Write-Host "Starting FastAPI AI Service..." -ForegroundColor Cyan
Write-Host "Service: VIPContentAI AI Microservice" -ForegroundColor Green
Write-Host "Port: 8000" -ForegroundColor Green
Write-Host ""

# Navigate to api-service directory
Set-Location -Path "api-service"

# Check if virtual environment exists
if (-Not (Test-Path ".venv")) {
    Write-Host "Virtual environment not found. Creating .venv..." -ForegroundColor Yellow
    python -m venv .venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& ".venv\Scripts\Activate.ps1"

# Check if requirements are installed
Write-Host "Checking dependencies..." -ForegroundColor Cyan
python -m pip install --quiet -r requirements.txt

# Start the FastAPI server
Write-Host ""
Write-Host "Starting FastAPI server on http://127.0.0.1:8000..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
python -m uvicorn main:app --reload --port 8000

# Return to project root when stopped
Set-Location -Path ".."
