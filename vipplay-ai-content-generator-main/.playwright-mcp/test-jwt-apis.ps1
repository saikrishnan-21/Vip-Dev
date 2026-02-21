# VIP-10004 JWT Token Management API Tests

Write-Host ""
Write-Host "=== VIP-10004 JWT Token Management Tests ===" -ForegroundColor Cyan

# Test 1: Login to get JWT token
Write-Host ""
Write-Host "Test 1: Login to get JWT token..." -ForegroundColor Yellow
$loginBody = @{
    email = "testuser.scenario1.unique@example.com"
    password = "NewResetPass123!@#"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $loginBody

    $token = $loginResponse.token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0,50))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Verify token endpoint
Write-Host ""
Write-Host "Test 2: Verify token endpoint..." -ForegroundColor Yellow
try {
    $verifyResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/verify" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }

    Write-Host "✓ Token verification successful" -ForegroundColor Green
    Write-Host "User: $($verifyResponse.user.email)" -ForegroundColor Gray
    Write-Host "Role: $($verifyResponse.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Token verification failed: $_" -ForegroundColor Red
}

# Test 3: Refresh token endpoint
Write-Host ""
Write-Host "Test 3: Refresh token endpoint..." -ForegroundColor Yellow
try {
    $refreshResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/refresh" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }

    $newToken = $refreshResponse.token
    Write-Host "✓ Token refresh successful" -ForegroundColor Green
    Write-Host "New Token: $($newToken.Substring(0,50))..." -ForegroundColor Gray
    Write-Host "User: $($refreshResponse.user.email)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Token refresh failed: $_" -ForegroundColor Red
}

# Test 4: Logout endpoint
Write-Host ""
Write-Host "Test 4: Logout endpoint..." -ForegroundColor Yellow
try {
    $logoutResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/logout" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }

    Write-Host "✓ Logout successful" -ForegroundColor Green
    Write-Host "Message: $($logoutResponse.message)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Logout failed: $_" -ForegroundColor Red
}

# Test 5: Verify endpoint with invalid token
Write-Host ""
Write-Host "Test 5: Verify endpoint with invalid token..." -ForegroundColor Yellow
try {
    $invalidResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/verify" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer invalid.token.here"
            "Content-Type" = "application/json"
        }

    Write-Host "✗ Should have failed with invalid token" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ Correctly rejected invalid token (401)" -ForegroundColor Green
    } else {
        Write-Host "✗ Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 6: Verify endpoint without token
Write-Host ""
Write-Host "Test 6: Verify endpoint without token..." -ForegroundColor Yellow
try {
    $noTokenResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/verify" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"}

    Write-Host "✗ Should have failed without token" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ Correctly rejected request without token (401)" -ForegroundColor Green
    } else {
        Write-Host "✗ Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 7: Refresh endpoint with new token
Write-Host ""
Write-Host "Test 7: Refresh endpoint with new token..." -ForegroundColor Yellow
try {
    $refresh2Response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/refresh" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $newToken"
            "Content-Type" = "application/json"
        }

    Write-Host "✓ Token refresh with new token successful" -ForegroundColor Green
    Write-Host "User: $($refresh2Response.user.email)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Token refresh failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== All Tests Complete ===" -ForegroundColor Cyan
