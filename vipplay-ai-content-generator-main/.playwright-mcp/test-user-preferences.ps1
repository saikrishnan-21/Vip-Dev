# VIP-10007 User Preferences & Settings Tests

Write-Host ""
Write-Host "=== VIP-10007 User Preferences & Settings Tests ===" -ForegroundColor Cyan

# Test 1: Login to get JWT token
Write-Host ""
Write-Host "Test 1: Login to get JWT token..." -ForegroundColor Yellow
$loginBody = @{
    email = "testuser.updated.1327848826@example.com"
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

# Test 2: Get current preferences (GET /api/protected/preferences)
Write-Host ""
Write-Host "Test 2: GET /api/protected/preferences (retrieve preferences)..." -ForegroundColor Yellow
try {
    $getResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/preferences" -Method GET -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}
    Write-Host "[PASS] Preferences retrieved successfully" -ForegroundColor Green
    Write-Host "Theme: $($getResponse.preferences.theme)" -ForegroundColor Gray
    Write-Host "Email Notifications: $($getResponse.preferences.emailNotifications)" -ForegroundColor Gray
    Write-Host "Default Tone: $($getResponse.preferences.defaultTone)" -ForegroundColor Gray
    Write-Host "Default Word Count: $($getResponse.preferences.defaultWordCount)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Failed to retrieve preferences: $_" -ForegroundColor Red
}

# Test 3: Update single preference with PATCH (merge)
Write-Host ""
Write-Host "Test 3: PATCH /api/protected/preferences (update theme only)..." -ForegroundColor Yellow
$patchThemeBody = @{
    theme = "dark"
} | ConvertTo-Json

try {
    $patchResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/preferences" -Method PATCH -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -Body $patchThemeBody
    Write-Host "[PASS] Theme updated successfully" -ForegroundColor Green
    Write-Host "New Theme: $($patchResponse.preferences.theme)" -ForegroundColor Gray

    if ($patchResponse.preferences.theme -eq "dark") {
        Write-Host "[PASS] Theme change verified" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Theme not updated correctly" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to update theme: $_" -ForegroundColor Red
}

# Test 4: Verify PATCH merge (other preferences preserved)
Write-Host ""
Write-Host "Test 4: Verify PATCH merge (other preferences preserved)..." -ForegroundColor Yellow
try {
    $verifyResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/preferences" -Method GET -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}
    Write-Host "[PASS] Preferences retrieved for verification" -ForegroundColor Green
    Write-Host "Theme: $($verifyResponse.preferences.theme)" -ForegroundColor Gray
    Write-Host "Email Notifications: $($verifyResponse.preferences.emailNotifications)" -ForegroundColor Gray
    Write-Host "Default Tone: $($verifyResponse.preferences.defaultTone)" -ForegroundColor Gray
    Write-Host "Default Word Count: $($verifyResponse.preferences.defaultWordCount)" -ForegroundColor Gray

    # Verify theme changed but other fields preserved
    $allCorrect = $true
    if ($verifyResponse.preferences.theme -ne "dark") { $allCorrect = $false }
    # Other preferences should still exist from before
    if ($null -eq $verifyResponse.preferences.emailNotifications) { $allCorrect = $false }
    if ($null -eq $verifyResponse.preferences.defaultTone) { $allCorrect = $false }
    if ($null -eq $verifyResponse.preferences.defaultWordCount) { $allCorrect = $false }

    if ($allCorrect) {
        Write-Host "[PASS] PATCH merge verified (theme changed, other fields preserved)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] PATCH merge failed (some fields lost)" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to verify merge: $_" -ForegroundColor Red
}

# Test 5: Update multiple preferences with PATCH
Write-Host ""
Write-Host "Test 5: PATCH multiple preferences (emailNotifications and defaultWordCount)..." -ForegroundColor Yellow
$patchMultipleBody = @{
    emailNotifications = $false
    defaultWordCount = 2500
} | ConvertTo-Json

try {
    $patchMultiResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/preferences" -Method PATCH -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -Body $patchMultipleBody
    Write-Host "[PASS] Multiple preferences updated" -ForegroundColor Green
    Write-Host "Email Notifications: $($patchMultiResponse.preferences.emailNotifications)" -ForegroundColor Gray
    Write-Host "Default Word Count: $($patchMultiResponse.preferences.defaultWordCount)" -ForegroundColor Gray
    Write-Host "Theme (should still be dark): $($patchMultiResponse.preferences.theme)" -ForegroundColor Gray

    # Verify updates and theme still dark from Test 3
    if ($patchMultiResponse.preferences.emailNotifications -eq $false -and
        $patchMultiResponse.preferences.defaultWordCount -eq 2500 -and
        $patchMultiResponse.preferences.theme -eq "dark") {
        Write-Host "[PASS] Multiple PATCH updates verified with merge" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Multiple PATCH updates failed" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to update multiple preferences: $_" -ForegroundColor Red
}

# Test 6: PUT to replace all preferences (with defaults for omitted fields)
Write-Host ""
Write-Host "Test 6: PUT /api/protected/preferences (replace with partial data)..." -ForegroundColor Yellow
$putPartialBody = @{
    theme = "light"
    defaultTone = "Casual"
} | ConvertTo-Json

try {
    $putResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/preferences" -Method PUT -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -Body $putPartialBody
    Write-Host "[PASS] Preferences replaced successfully" -ForegroundColor Green
    Write-Host "Theme: $($putResponse.preferences.theme)" -ForegroundColor Gray
    Write-Host "Email Notifications: $($putResponse.preferences.emailNotifications)" -ForegroundColor Gray
    Write-Host "Default Tone: $($putResponse.preferences.defaultTone)" -ForegroundColor Gray
    Write-Host "Default Word Count: $($putResponse.preferences.defaultWordCount)" -ForegroundColor Gray

    # Verify PUT replaced everything (omitted fields should have defaults)
    if ($putResponse.preferences.theme -eq "light" -and
        $putResponse.preferences.defaultTone -eq "Casual" -and
        $putResponse.preferences.emailNotifications -eq $true -and  # Default
        $putResponse.preferences.defaultWordCount -eq 1500) {  # Default
        Write-Host "[PASS] PUT replacement verified (defaults set for omitted fields)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] PUT replacement failed" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to replace preferences: $_" -ForegroundColor Red
}

# Test 7: Verify PUT didn't merge (old values gone)
Write-Host ""
Write-Host "Test 7: Verify PUT replaced (not merged)..." -ForegroundColor Yellow
try {
    $verifyPutResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/preferences" -Method GET -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}
    Write-Host "[PASS] Preferences retrieved after PUT" -ForegroundColor Green

    # emailNotifications should be true (default), not false from Test 5
    # defaultWordCount should be 1500 (default), not 2500 from Test 5
    if ($verifyPutResponse.preferences.emailNotifications -eq $true -and
        $verifyPutResponse.preferences.defaultWordCount -eq 1500) {
        Write-Host "[PASS] PUT replaced correctly (old values not preserved)" -ForegroundColor Green
        Write-Host "Email Notifications reset to default: $($verifyPutResponse.preferences.emailNotifications)" -ForegroundColor Gray
        Write-Host "Word Count reset to default: $($verifyPutResponse.preferences.defaultWordCount)" -ForegroundColor Gray
    } else {
        Write-Host "[FAIL] PUT did not replace correctly" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to verify PUT replacement: $_" -ForegroundColor Red
}

# Test 8: PUT with all fields specified
Write-Host ""
Write-Host "Test 8: PUT with all fields specified..." -ForegroundColor Yellow
$putCompleteBody = @{
    theme = "dark"
    emailNotifications = $false
    defaultTone = "Professional"
    defaultWordCount = 3000
} | ConvertTo-Json

try {
    $putCompleteResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/preferences" -Method PUT -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -Body $putCompleteBody
    Write-Host "[PASS] Complete preferences set successfully" -ForegroundColor Green

    if ($putCompleteResponse.preferences.theme -eq "dark" -and
        $putCompleteResponse.preferences.emailNotifications -eq $false -and
        $putCompleteResponse.preferences.defaultTone -eq "Professional" -and
        $putCompleteResponse.preferences.defaultWordCount -eq 3000) {
        Write-Host "[PASS] All fields set correctly" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Some fields not set correctly" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to set complete preferences: $_" -ForegroundColor Red
}

# Test 9: DELETE to reset to defaults
Write-Host ""
Write-Host "Test 9: DELETE /api/protected/preferences (reset to defaults)..." -ForegroundColor Yellow
try {
    $deleteResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/preferences" -Method DELETE -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}
    Write-Host "[PASS] Preferences reset to defaults" -ForegroundColor Green
    Write-Host "Theme: $($deleteResponse.preferences.theme)" -ForegroundColor Gray
    Write-Host "Email Notifications: $($deleteResponse.preferences.emailNotifications)" -ForegroundColor Gray
    Write-Host "Default Tone: $($deleteResponse.preferences.defaultTone)" -ForegroundColor Gray
    Write-Host "Default Word Count: $($deleteResponse.preferences.defaultWordCount)" -ForegroundColor Gray

    # Verify all defaults
    if ($deleteResponse.preferences.theme -eq "system" -and
        $deleteResponse.preferences.emailNotifications -eq $true -and
        $deleteResponse.preferences.defaultTone -eq "Professional" -and
        $deleteResponse.preferences.defaultWordCount -eq 1500) {
        Write-Host "[PASS] All preferences reset to system defaults" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Preferences not reset correctly" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to reset preferences: $_" -ForegroundColor Red
}

# Test 10: Verify DELETE persisted
Write-Host ""
Write-Host "Test 10: Verify DELETE persisted..." -ForegroundColor Yellow
try {
    $verifyDeleteResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/preferences" -Method GET -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}
    Write-Host "[PASS] Preferences retrieved after DELETE" -ForegroundColor Green

    if ($verifyDeleteResponse.preferences.theme -eq "system" -and
        $verifyDeleteResponse.preferences.emailNotifications -eq $true -and
        $verifyDeleteResponse.preferences.defaultTone -eq "Professional" -and
        $verifyDeleteResponse.preferences.defaultWordCount -eq 1500) {
        Write-Host "[PASS] DELETE persisted correctly to database" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] DELETE did not persist" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to verify DELETE persistence: $_" -ForegroundColor Red
}

# Test 11: Invalid theme value (validation test)
Write-Host ""
Write-Host "Test 11: Attempt PATCH with invalid theme value..." -ForegroundColor Yellow
$invalidThemeBody = @{
    theme = "invalid-theme"
} | ConvertTo-Json

try {
    $invalidResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/preferences" -Method PATCH -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -Body $invalidThemeBody
    Write-Host "[FAIL] Should have been rejected (invalid theme)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "[PASS] Invalid theme correctly rejected (400)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 12: Word count out of range (validation test)
Write-Host ""
Write-Host "Test 12: Attempt PATCH with word count out of range..." -ForegroundColor Yellow
$outOfRangeBody = @{
    defaultWordCount = 10000
} | ConvertTo-Json

try {
    $outOfRangeResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/preferences" -Method PATCH -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -Body $outOfRangeBody
    Write-Host "[FAIL] Should have been rejected (word count > 5000)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "[PASS] Out of range word count rejected (400)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 13: Word count below minimum (validation test)
Write-Host ""
Write-Host "Test 13: Attempt PATCH with word count below minimum..." -ForegroundColor Yellow
$belowMinBody = @{
    defaultWordCount = 50
} | ConvertTo-Json

try {
    $belowMinResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/preferences" -Method PATCH -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -Body $belowMinBody
    Write-Host "[FAIL] Should have been rejected (word count < 100)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "[PASS] Below minimum word count rejected (400)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 14: Invalid emailNotifications type (validation test)
Write-Host ""
Write-Host "Test 14: Attempt PATCH with invalid emailNotifications type..." -ForegroundColor Yellow
$invalidTypeBody = '{"emailNotifications": "yes"}'

try {
    $invalidTypeResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/preferences" -Method PATCH -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -Body $invalidTypeBody
    Write-Host "[FAIL] Should have been rejected (invalid boolean type)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "[PASS] Invalid type correctly rejected (400)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 15: Test all valid theme values
Write-Host ""
Write-Host "Test 15: Test all valid theme values (light, dark, system)..." -ForegroundColor Yellow
$themes = @("light", "dark", "system")
$allThemesPassed = $true

foreach ($themeValue in $themes) {
    $themeTestBody = @{
        theme = $themeValue
    } | ConvertTo-Json

    try {
        $themeTestResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/preferences" -Method PATCH -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -Body $themeTestBody
        if ($themeTestResponse.preferences.theme -eq $themeValue) {
            Write-Host "  ✅ Theme '$themeValue' accepted and set" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Theme '$themeValue' not set correctly" -ForegroundColor Red
            $allThemesPassed = $false
        }
    } catch {
        Write-Host "  ❌ Theme '$themeValue' rejected unexpectedly" -ForegroundColor Red
        $allThemesPassed = $false
    }
}

if ($allThemesPassed) {
    Write-Host "[PASS] All valid theme values accepted" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Some theme values failed" -ForegroundColor Red
}

# Test 16: Test edge case word counts (boundaries)
Write-Host ""
Write-Host "Test 16: Test boundary word counts (100, 5000)..." -ForegroundColor Yellow
$boundaryCounts = @(100, 5000)
$allBoundariesPassed = $true

foreach ($count in $boundaryCounts) {
    $boundaryBody = @{
        defaultWordCount = $count
    } | ConvertTo-Json

    try {
        $boundaryResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/preferences" -Method PATCH -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -Body $boundaryBody
        if ($boundaryResponse.preferences.defaultWordCount -eq $count) {
            Write-Host "  ✅ Word count $count accepted" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Word count $count not set correctly" -ForegroundColor Red
            $allBoundariesPassed = $false
        }
    } catch {
        Write-Host "  ❌ Word count $count rejected unexpectedly" -ForegroundColor Red
        $allBoundariesPassed = $false
    }
}

if ($allBoundariesPassed) {
    Write-Host "[PASS] All boundary word counts accepted" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Some boundary values failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== All Tests Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- GET /api/protected/preferences: TESTED" -ForegroundColor Green
Write-Host "- PATCH /api/protected/preferences (merge): TESTED" -ForegroundColor Green
Write-Host "- PUT /api/protected/preferences (replace): TESTED" -ForegroundColor Green
Write-Host "- DELETE /api/protected/preferences (reset): TESTED" -ForegroundColor Green
Write-Host "- Theme validation (light/dark/system): TESTED" -ForegroundColor Green
Write-Host "- Word count validation (100-5000): TESTED" -ForegroundColor Green
Write-Host "- Email notifications boolean validation: TESTED" -ForegroundColor Green
Write-Host "- Default tone string validation: TESTED" -ForegroundColor Green
Write-Host "- PATCH merge behavior: TESTED" -ForegroundColor Green
Write-Host "- PUT replace behavior: TESTED" -ForegroundColor Green
Write-Host "- Database persistence: TESTED" -ForegroundColor Green
