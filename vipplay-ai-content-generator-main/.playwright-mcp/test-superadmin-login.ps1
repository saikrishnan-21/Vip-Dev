# Test superadmin login

$loginBody = @{
    email = "superadmin@example.com"
    password = "SuperSecure123!@#"
} | ConvertTo-Json

Write-Host "Testing superadmin login..."
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody
    Write-Host "[SUCCESS] Login successful" -ForegroundColor Green
    Write-Host "User ID: $($response.user._id)" -ForegroundColor Gray
    Write-Host "Email: $($response.user.email)" -ForegroundColor Gray
    Write-Host "Role: $($response.user.role)" -ForegroundColor Gray
    Write-Host "Token: $($response.token.Substring(0,50))..." -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Login failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}
