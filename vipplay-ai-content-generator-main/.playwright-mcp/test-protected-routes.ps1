# VIP-10005 Protected Routes Middleware Tests

Write-Host ""
Write-Host "=== VIP-10005 Protected Routes Middleware Tests ===" -ForegroundColor Cyan

# Test 1: Access protected endpoint without token
Write-Host ""
Write-Host "Test 1: Access protected endpoint without token..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/me" -Method GET -Headers @{"Content-Type"="application/json"}
    Write-Host "[FAIL] Should have been rejected without token" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "[PASS] Correctly rejected (401 Unauthorized)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 2: Login to get JWT token
Write-Host ""
Write-Host "Test 2: Login to get JWT token..." -ForegroundColor Yellow
$loginBody = @{
    email = "testuser.scenario1.unique@example.com"
    password = "NewResetPass123!@#"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody
    $token = $loginResponse.token
    Write-Host "[PASS] Login successful" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0,50))..." -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Login failed: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Access protected /api/protected/me with valid token
Write-Host ""
Write-Host "Test 3: GET /api/protected/me with valid token..." -ForegroundColor Yellow
try {
    $meResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/me" -Method GET -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}
    Write-Host "[PASS] Successfully accessed protected endpoint" -ForegroundColor Green
    Write-Host "User: $($meResponse.user.email)" -ForegroundColor Gray
    Write-Host "Role: $($meResponse.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Failed to access protected endpoint: $_" -ForegroundColor Red
}

# Test 4: Access superadmin endpoint with regular user token (should fail)
Write-Host ""
Write-Host "Test 4: Access superadmin endpoint with regular user..." -ForegroundColor Yellow
try {
    $adminResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users" -Method GET -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}
    Write-Host "[FAIL] Should have been rejected (insufficient permissions)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "[PASS] Correctly rejected (403 Forbidden)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 5: Create superadmin user for testing
Write-Host ""
Write-Host "Test 5: Create superadmin user..." -ForegroundColor Yellow
$superadminBody = @{
    email = "superadmin@example.com"
    password = "SuperAdmin123!@#"
    fullName = "Super Admin"
    confirmPassword = "SuperAdmin123!@#"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $superadminBody
    Write-Host "[INFO] Superadmin user created (or already exists)" -ForegroundColor Cyan
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "[INFO] Superadmin user already exists" -ForegroundColor Cyan
    } else {
        Write-Host "[WARN] Could not create superadmin: $_" -ForegroundColor Yellow
    }
}

# Test 6: Update user to superadmin role via MongoDB
Write-Host ""
Write-Host "Test 6: Update user to superadmin role..." -ForegroundColor Yellow
Write-Host "[INFO] Manual MongoDB update required to set role='superadmin'" -ForegroundColor Cyan
Write-Host "[INFO] Skipping superadmin tests for now" -ForegroundColor Cyan

# Test 7: Update profile (PATCH /api/protected/me)
Write-Host ""
Write-Host "Test 7: Update profile (PATCH /api/protected/me)..." -ForegroundColor Yellow
$updateBody = @{
    fullName = "Test User Updated"
    preferences = @{
        theme = "dark"
    }
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/me" -Method PATCH -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -Body $updateBody
    Write-Host "[PASS] Profile updated successfully" -ForegroundColor Green
    Write-Host "New Name: $($updateResponse.user.fullName)" -ForegroundColor Gray
    Write-Host "Theme: $($updateResponse.user.preferences.theme)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Profile update failed: $_" -ForegroundColor Red
}

# Test 8: Verify updated profile
Write-Host ""
Write-Host "Test 8: Verify updated profile..." -ForegroundColor Yellow
try {
    $verifyResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/me" -Method GET -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}
    if ($verifyResponse.user.fullName -eq "Test User Updated") {
        Write-Host "[PASS] Profile changes persisted correctly" -ForegroundColor Green
        Write-Host "Full Name: $($verifyResponse.user.fullName)" -ForegroundColor Gray
    } else {
        Write-Host "[FAIL] Profile changes not persisted" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to verify profile: $_" -ForegroundColor Red
}

# Test 9: Test with invalid token
Write-Host ""
Write-Host "Test 9: Access protected endpoint with invalid token..." -ForegroundColor Yellow
try {
    $invalidResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/me" -Method GET -Headers @{"Authorization" = "Bearer invalid.token.here"; "Content-Type" = "application/json"}
    Write-Host "[FAIL] Should have been rejected with invalid token" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "[PASS] Correctly rejected invalid token (401)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 10: Test refresh token and use new token
Write-Host ""
Write-Host "Test 10: Refresh token and use new token..." -ForegroundColor Yellow
try {
    $refreshResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/refresh" -Method POST -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}
    $newToken = $refreshResponse.token
    Write-Host "[PASS] Token refreshed" -ForegroundColor Green

    # Use new token to access protected endpoint
    $testNewToken = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/me" -Method GET -Headers @{"Authorization" = "Bearer $newToken"; "Content-Type" = "application/json"}
    Write-Host "[PASS] New token works for protected endpoints" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Token refresh or usage failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== All Tests Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- Middleware protection: TESTED" -ForegroundColor Green
Write-Host "- withAuth() HOF: TESTED" -ForegroundColor Green
Write-Host "- withSuperadmin() HOF: TESTED (403 for regular user)" -ForegroundColor Green
Write-Host "- Protected /api/protected/me: TESTED" -ForegroundColor Green
Write-Host "- Profile updates: TESTED" -ForegroundColor Green
Write-Host "- Token validation: TESTED" -ForegroundColor Green
