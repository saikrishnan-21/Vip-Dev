# Test temporary user creation

Write-Host ""
Write-Host "=== Testing Temp User Creation ===" -ForegroundColor Cyan

$uniqueEmail = "tempuser.delete.$(Get-Random)@example.com"
$tempUserBody = @{
    email = $uniqueEmail
    password = "TempPass123!@#"
    fullName = "Temp User For Deletion"
} | ConvertTo-Json

Write-Host "Attempting to create user: $uniqueEmail" -ForegroundColor Yellow
Write-Host "Request body: $tempUserBody" -ForegroundColor Gray
Write-Host ""

try {
    $tempUserResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $tempUserBody
    Write-Host "[SUCCESS] User created!" -ForegroundColor Green
    Write-Host "User ID: $($tempUserResponse.user._id)" -ForegroundColor Gray
    Write-Host "Email: $($tempUserResponse.user.email)" -ForegroundColor Gray
} catch {
    Write-Host "[FAILED] User creation failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red

    # Try to get response body
    if ($_.ErrorDetails) {
        Write-Host "Error Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
