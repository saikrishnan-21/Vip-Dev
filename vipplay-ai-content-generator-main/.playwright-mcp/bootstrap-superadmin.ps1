# Bootstrap script to promote superadmin@example.com to superadmin role and reset password

Write-Host ""
Write-Host "=== Bootstrapping Superadmin ===" -ForegroundColor Cyan

$body = @{
    email = "superadmin@example.com"
    password = "SuperSecure123!@#"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/bootstrap/superadmin" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    Write-Host "[SUCCESS] User promoted to superadmin and password reset" -ForegroundColor Green
    Write-Host "Email: $($response.user.email)" -ForegroundColor Gray
    Write-Host "Role: $($response.user.role)" -ForegroundColor Gray
    Write-Host "Message: $($response.message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "You can now run test-rbac.ps1" -ForegroundColor Yellow
} catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
}
