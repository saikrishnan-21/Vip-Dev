# Setup script to create superadmin user

Write-Host ""
Write-Host "=== Creating Superadmin User ===" -ForegroundColor Cyan

# Create superadmin user
$signupBody = @{
    email = "superadmin@example.com"
    password = "SuperSecure123!@#"
    fullName = "Super Admin"
} | ConvertTo-Json

try {
    $signupResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $signupBody
    $newUserId = $signupResponse.user._id
    Write-Host "[SUCCESS] Superadmin user created" -ForegroundColor Green
    Write-Host "User ID: $newUserId" -ForegroundColor Gray
    Write-Host "Email: $($signupResponse.user.email)" -ForegroundColor Gray
    Write-Host "Default Role: $($signupResponse.user.role)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Note: User will need to be promoted to superadmin role manually via MongoDB or by another superadmin" -ForegroundColor Yellow
} catch {
    Write-Host "[INFO] User may already exist: $_" -ForegroundColor Yellow
}
