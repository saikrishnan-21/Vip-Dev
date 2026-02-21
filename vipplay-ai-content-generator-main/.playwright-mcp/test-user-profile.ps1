# VIP-10006 User Profile Management Tests

Write-Host ""
Write-Host "=== VIP-10006 User Profile Management Tests ===" -ForegroundColor Cyan

# Test 1: Login to get JWT token
Write-Host ""
Write-Host "Test 1: Login to get JWT token..." -ForegroundColor Yellow
$loginBody = @{
    email = "testuser.scenario1.unique@example.com"
    password = "NewResetPass123!@#"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody
    $token = $loginResponse.token
    $userId = $loginResponse.user._id
    Write-Host "[PASS] Login successful" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0,50))..." -ForegroundColor Gray
    Write-Host "User ID: $userId" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Login failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Get current user profile (GET /api/protected/me)
Write-Host ""
Write-Host "Test 2: GET /api/protected/me (retrieve profile)..." -ForegroundColor Yellow
try {
    $profileResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/me" -Method GET -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}
    Write-Host "[PASS] Profile retrieved successfully" -ForegroundColor Green
    Write-Host "Email: $($profileResponse.user.email)" -ForegroundColor Gray
    Write-Host "Full Name: $($profileResponse.user.fullName)" -ForegroundColor Gray
    Write-Host "Role: $($profileResponse.user.role)" -ForegroundColor Gray

    # Store original values for later verification
    $originalEmail = $profileResponse.user.email
    $originalFullName = $profileResponse.user.fullName
} catch {
    Write-Host "[FAIL] Failed to retrieve profile: $_" -ForegroundColor Red
}

# Test 3: Update full name only (PATCH /api/protected/me)
Write-Host ""
Write-Host "Test 3: Update full name only..." -ForegroundColor Yellow
$updateNameBody = @{
    fullName = "Updated Test User"
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/me" -Method PATCH -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -Body $updateNameBody
    Write-Host "[PASS] Full name updated successfully" -ForegroundColor Green
    Write-Host "New Full Name: $($updateResponse.user.fullName)" -ForegroundColor Gray

    if ($updateResponse.user.fullName -eq "Updated Test User") {
        Write-Host "[PASS] Full name change verified" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Full name not updated correctly" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to update full name: $_" -ForegroundColor Red
}

# Test 4: Update preferences (theme)
Write-Host ""
Write-Host "Test 4: Update preferences (theme to dark)..." -ForegroundColor Yellow
$updatePrefsBody = @{
    preferences = @{
        theme = "dark"
    }
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/me" -Method PATCH -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -Body $updatePrefsBody
    Write-Host "[PASS] Preferences updated successfully" -ForegroundColor Green
    Write-Host "Theme: $($updateResponse.user.preferences.theme)" -ForegroundColor Gray

    if ($updateResponse.user.preferences.theme -eq "dark") {
        Write-Host "[PASS] Theme preference verified" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Theme preference not updated correctly" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to update preferences: $_" -ForegroundColor Red
}

# Test 5: Update multiple preferences (merge test)
Write-Host ""
Write-Host "Test 5: Update multiple preferences (merge test)..." -ForegroundColor Yellow
$updateMultiPrefsBody = @{
    preferences = @{
        emailNotifications = $true
        defaultWordCount = 1500
    }
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/me" -Method PATCH -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -Body $updateMultiPrefsBody
    Write-Host "[PASS] Multiple preferences updated successfully" -ForegroundColor Green
    Write-Host "Email Notifications: $($updateResponse.user.preferences.emailNotifications)" -ForegroundColor Gray
    Write-Host "Default Word Count: $($updateResponse.user.preferences.defaultWordCount)" -ForegroundColor Gray
    Write-Host "Theme (should still be dark): $($updateResponse.user.preferences.theme)" -ForegroundColor Gray

    # Verify merge (theme should still be dark from Test 4)
    if ($updateResponse.user.preferences.theme -eq "dark") {
        Write-Host "[PASS] Preferences merged correctly (theme preserved)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Preferences not merged correctly" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to update multiple preferences: $_" -ForegroundColor Red
}

# Test 6: Update full name and preferences together
Write-Host ""
Write-Host "Test 6: Update full name and preferences together..." -ForegroundColor Yellow
$updateBothBody = @{
    fullName = "Combined Update User"
    preferences = @{
        defaultTone = "professional"
    }
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/me" -Method PATCH -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -Body $updateBothBody
    Write-Host "[PASS] Full name and preferences updated together" -ForegroundColor Green
    Write-Host "Full Name: $($updateResponse.user.fullName)" -ForegroundColor Gray
    Write-Host "Default Tone: $($updateResponse.user.preferences.defaultTone)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Failed to update both fields: $_" -ForegroundColor Red
}

# Test 7: Verify profile changes persisted
Write-Host ""
Write-Host "Test 7: Verify all profile changes persisted..." -ForegroundColor Yellow
try {
    $verifyResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/me" -Method GET -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}
    Write-Host "[PASS] Profile retrieved for verification" -ForegroundColor Green
    Write-Host "Full Name: $($verifyResponse.user.fullName)" -ForegroundColor Gray
    Write-Host "Theme: $($verifyResponse.user.preferences.theme)" -ForegroundColor Gray
    Write-Host "Email Notifications: $($verifyResponse.user.preferences.emailNotifications)" -ForegroundColor Gray
    Write-Host "Default Word Count: $($verifyResponse.user.preferences.defaultWordCount)" -ForegroundColor Gray
    Write-Host "Default Tone: $($verifyResponse.user.preferences.defaultTone)" -ForegroundColor Gray

    # Verify all changes
    $allCorrect = $true
    if ($verifyResponse.user.fullName -ne "Combined Update User") { $allCorrect = $false }
    if ($verifyResponse.user.preferences.theme -ne "dark") { $allCorrect = $false }
    if ($verifyResponse.user.preferences.emailNotifications -ne $true) { $allCorrect = $false }
    if ($verifyResponse.user.preferences.defaultWordCount -ne 1500) { $allCorrect = $false }
    if ($verifyResponse.user.preferences.defaultTone -ne "professional") { $allCorrect = $false }

    if ($allCorrect) {
        Write-Host "[PASS] All profile changes persisted correctly" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Some profile changes not persisted" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to verify profile: $_" -ForegroundColor Red
}

# Test 8: Change password with valid current password
Write-Host ""
Write-Host "Test 8: Change password (POST /api/protected/change-password)..." -ForegroundColor Yellow
$changePasswordBody = @{
    currentPassword = "NewResetPass123!@#"
    newPassword = "UpdatedPassword456!@#"
    confirmNewPassword = "UpdatedPassword456!@#"
} | ConvertTo-Json

try {
    $changeResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/change-password" -Method POST -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -Body $changePasswordBody
    Write-Host "[PASS] Password changed successfully" -ForegroundColor Green
    Write-Host "Message: $($changeResponse.message)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Failed to change password: $_" -ForegroundColor Red
}

# Test 9: Verify new password works (login with new password)
Write-Host ""
Write-Host "Test 9: Verify new password works (login with new password)..." -ForegroundColor Yellow
$newLoginBody = @{
    email = "testuser.scenario1.unique@example.com"
    password = "UpdatedPassword456!@#"
} | ConvertTo-Json

try {
    $newLoginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $newLoginBody
    $newToken = $newLoginResponse.token
    Write-Host "[PASS] Login successful with new password" -ForegroundColor Green
    Write-Host "New Token: $($newToken.Substring(0,50))..." -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Login with new password failed: $_" -ForegroundColor Red
}

# Test 10: Verify old password no longer works
Write-Host ""
Write-Host "Test 10: Verify old password no longer works..." -ForegroundColor Yellow
$oldLoginBody = @{
    email = "testuser.scenario1.unique@example.com"
    password = "NewResetPass123!@#"
} | ConvertTo-Json

try {
    $oldLoginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $oldLoginBody
    Write-Host "[FAIL] Old password still works (should have been rejected)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "[PASS] Old password correctly rejected (401 Unauthorized)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 11: Change password with incorrect current password (should fail)
Write-Host ""
Write-Host "Test 11: Attempt password change with incorrect current password..." -ForegroundColor Yellow
$wrongPasswordBody = @{
    currentPassword = "WrongPassword123!@#"
    newPassword = "AnotherPassword789!@#"
    confirmNewPassword = "AnotherPassword789!@#"
} | ConvertTo-Json

try {
    $wrongResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/change-password" -Method POST -Headers @{"Authorization" = "Bearer $newToken"; "Content-Type" = "application/json"} -Body $wrongPasswordBody
    Write-Host "[FAIL] Should have been rejected with incorrect current password" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "[PASS] Correctly rejected incorrect current password (401)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 12: Change password with mismatched new passwords (should fail)
Write-Host ""
Write-Host "Test 12: Attempt password change with mismatched new passwords..." -ForegroundColor Yellow
$mismatchBody = @{
    currentPassword = "UpdatedPassword456!@#"
    newPassword = "MismatchPassword1!@#"
    confirmNewPassword = "MismatchPassword2!@#"
} | ConvertTo-Json

try {
    $mismatchResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/change-password" -Method POST -Headers @{"Authorization" = "Bearer $newToken"; "Content-Type" = "application/json"} -Body $mismatchBody
    Write-Host "[FAIL] Should have been rejected with mismatched passwords" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "[PASS] Correctly rejected mismatched passwords (400)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 13: Change password with weak password (should fail)
Write-Host ""
Write-Host "Test 13: Attempt password change with weak password..." -ForegroundColor Yellow
$weakPasswordBody = @{
    currentPassword = "UpdatedPassword456!@#"
    newPassword = "weak"
    confirmNewPassword = "weak"
} | ConvertTo-Json

try {
    $weakResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/change-password" -Method POST -Headers @{"Authorization" = "Bearer $newToken"; "Content-Type" = "application/json"} -Body $weakPasswordBody
    Write-Host "[FAIL] Should have been rejected with weak password" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "[PASS] Correctly rejected weak password (400)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 14: Update email to unique address
Write-Host ""
Write-Host "Test 14: Update email to unique address..." -ForegroundColor Yellow
$uniqueEmail = "testuser.updated.$(Get-Random)@example.com"
$updateEmailBody = @{
    email = $uniqueEmail
} | ConvertTo-Json

try {
    $emailResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/me" -Method PATCH -Headers @{"Authorization" = "Bearer $newToken"; "Content-Type" = "application/json"} -Body $updateEmailBody
    Write-Host "[PASS] Email updated successfully" -ForegroundColor Green
    Write-Host "New Email: $($emailResponse.user.email)" -ForegroundColor Gray

    if ($emailResponse.user.email -eq $uniqueEmail.ToLower()) {
        Write-Host "[PASS] Email change verified" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Email not updated correctly" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to update email: $_" -ForegroundColor Red
}

# Test 15: Attempt to update email to existing address (should fail)
Write-Host ""
Write-Host "Test 15: Attempt to update email to existing address..." -ForegroundColor Yellow
$duplicateEmailBody = @{
    email = "superadmin@example.com"
} | ConvertTo-Json

try {
    $dupResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/me" -Method PATCH -Headers @{"Authorization" = "Bearer $newToken"; "Content-Type" = "application/json"} -Body $duplicateEmailBody
    Write-Host "[FAIL] Should have been rejected (email already in use)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "[PASS] Correctly rejected duplicate email (400)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 16: Restore original password for future tests
Write-Host ""
Write-Host "Test 16: Restore original password for future tests..." -ForegroundColor Yellow
$restorePasswordBody = @{
    currentPassword = "UpdatedPassword456!@#"
    newPassword = "NewResetPass123!@#"
    confirmNewPassword = "NewResetPass123!@#"
} | ConvertTo-Json

try {
    $restoreResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/change-password" -Method POST -Headers @{"Authorization" = "Bearer $newToken"; "Content-Type" = "application/json"} -Body $restorePasswordBody
    Write-Host "[PASS] Password restored successfully" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Failed to restore password: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== All Tests Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- GET /api/protected/me: TESTED" -ForegroundColor Green
Write-Host "- PATCH /api/protected/me (fullName): TESTED" -ForegroundColor Green
Write-Host "- PATCH /api/protected/me (preferences): TESTED" -ForegroundColor Green
Write-Host "- PATCH /api/protected/me (email): TESTED" -ForegroundColor Green
Write-Host "- POST /api/protected/change-password: TESTED" -ForegroundColor Green
Write-Host "- Password strength validation: TESTED" -ForegroundColor Green
Write-Host "- Current password verification: TESTED" -ForegroundColor Green
Write-Host "- Email uniqueness validation: TESTED" -ForegroundColor Green
Write-Host "- Preferences merge: TESTED" -ForegroundColor Green
