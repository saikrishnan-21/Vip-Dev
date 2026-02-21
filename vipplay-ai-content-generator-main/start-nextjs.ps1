# Start Next.js Development Server
# Run this script from the project root directory

Write-Host "Starting Next.js Development Server..." -ForegroundColor Cyan
Write-Host "Project: VIPContentAI" -ForegroundColor Green
Write-Host "Port: 3000" -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "node_modules not found. Running pnpm install..." -ForegroundColor Yellow
    pnpm install
}

# Start the Next.js server
Write-Host "Starting server with pnpm dev..." -ForegroundColor Cyan
pnpm dev
