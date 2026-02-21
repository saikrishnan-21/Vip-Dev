# Investigate signup endpoint issues

Write-Host ""
Write-Host "=== Signup Endpoint Investigation ===" -ForegroundColor Cyan

# Test 1: Check if signup endpoint exists
Write-Host ""
Write-Host "Test 1: Testing signup endpoint..." -ForegroundColor Yellow
$signupBody = @{
    email = "test.investigation.$(Get-Random)@example.com"
    password = "TestPass123!@#"
    fullName = "Test Investigation User"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $signupBody
    Write-Host "[SUCCESS] Register endpoint works!" -ForegroundColor Green
    Write-Host "User ID: $($response.user._id)" -ForegroundColor Gray
    Write-Host "Email: $($response.user.email)" -ForegroundColor Gray
} catch {
    Write-Host "[FAILED] Register failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red

    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
    }
}

# Test 2: Check if route file exists
Write-Host ""
Write-Host "Test 2: Checking if register route file exists..." -ForegroundColor Yellow
$registerRoutePath = "..\app\api\auth\register\route.ts"
if (Test-Path $registerRoutePath) {
    Write-Host "[SUCCESS] Register route file exists at app/api/auth/register/route.ts" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Register route file NOT found!" -ForegroundColor Red
}

# Test 3: List all auth routes
Write-Host ""
Write-Host "Test 3: Listing all auth API routes..." -ForegroundColor Yellow
Get-ChildItem -Path "..\app\api\auth" -Recurse -Filter "route.ts" | ForEach-Object {
    $relativePath = $_.FullName -replace [regex]::Escape($PWD.Path), "."
    Write-Host "  - $relativePath" -ForegroundColor Gray
}

# Test 4: Try login endpoint (verify Next.js is running)
Write-Host ""
Write-Host "Test 4: Verifying Next.js server is running (test login endpoint)..." -ForegroundColor Yellow
$loginBody = @{
    email = "superadmin@example.com"
    password = "SuperSecure123!@#"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody
    Write-Host "[SUCCESS] Login endpoint works - Next.js server is running" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Login endpoint failed - server may not be running" -ForegroundColor Yellow
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test 5: Check for any recent changes to register route
Write-Host ""
Write-Host "Test 5: Checking register route git history..." -ForegroundColor Yellow
Push-Location ..
try {
    $gitLog = git log --oneline -5 -- app/api/auth/register/route.ts 2>&1
    if ($gitLog) {
        Write-Host "Recent commits affecting register:" -ForegroundColor Gray
        Write-Host $gitLog -ForegroundColor Gray
    } else {
        Write-Host "No recent commits found for register route" -ForegroundColor Gray
    }
} catch {
    Write-Host "Could not check git history" -ForegroundColor Gray
}
Pop-Location

Write-Host ""
Write-Host "=== Investigation Complete ===" -ForegroundColor Cyan
