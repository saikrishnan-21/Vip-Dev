# VIP-10008 Role-Based Access Control Tests

Write-Host ""
Write-Host "=== VIP-10008 Role-Based Access Control Tests ===" -ForegroundColor Cyan

# Setup: Login as regular user
Write-Host ""
Write-Host "Setup: Login as regular user (testuser.updated.1327848826@example.com)..." -ForegroundColor Yellow
$regularLoginBody = @{
    email = "testuser.updated.1327848826@example.com"
    password = "NewResetPass123!@#"
} | ConvertTo-Json

try {
    $regularLoginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $regularLoginBody
    $regularToken = $regularLoginResponse.token
    $regularUserId = $regularLoginResponse.user._id
    Write-Host "[PASS] Regular user login successful" -ForegroundColor Green
    Write-Host "Regular User ID: $regularUserId" -ForegroundColor Gray
    Write-Host "Regular User Role: $($regularLoginResponse.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Regular user login failed: $_" -ForegroundColor Red
    exit 1
}

# Setup: Login as superadmin
Write-Host ""
Write-Host "Setup: Login as superadmin (superadmin@example.com)..." -ForegroundColor Yellow
$superadminLoginBody = @{
    email = "superadmin@example.com"
    password = "SuperSecure123!@#"
} | ConvertTo-Json

try {
    $superadminLoginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $superadminLoginBody
    $superadminToken = $superadminLoginResponse.token
    $superadminUserId = $superadminLoginResponse.user._id
    Write-Host "[PASS] Superadmin login successful" -ForegroundColor Green
    Write-Host "Superadmin User ID: $superadminUserId" -ForegroundColor Gray
    Write-Host "Superadmin Role: $($superadminLoginResponse.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Superadmin login failed: $_" -ForegroundColor Red
    exit 1
}

# Test 1: Regular user cannot access admin endpoints (403 Forbidden)
Write-Host ""
Write-Host "Test 1: Regular user cannot access GET /api/protected/admin/users (AC7)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users" -Method GET -Headers @{"Authorization" = "Bearer $regularToken"; "Content-Type" = "application/json"}
    Write-Host "[FAIL] Regular user should NOT be able to access admin endpoint" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "[PASS] Regular user correctly denied access (403 Forbidden)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 2: Superadmin can list all users (AC6)
Write-Host ""
Write-Host "Test 2: Superadmin can list all users GET /api/protected/admin/users (AC6)..." -ForegroundColor Yellow
try {
    $usersResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users?page=1&limit=10" -Method GET -Headers @{"Authorization" = "Bearer $superadminToken"; "Content-Type" = "application/json"}
    Write-Host "[PASS] Superadmin successfully retrieved users list" -ForegroundColor Green
    Write-Host "Total Users: $($usersResponse.pagination.total)" -ForegroundColor Gray
    Write-Host "Page: $($usersResponse.pagination.page)/$($usersResponse.pagination.totalPages)" -ForegroundColor Gray

    # Store a regular user ID for later tests (not the superadmin)
    $targetUser = $usersResponse.users | Where-Object { $_.role -eq "user" } | Select-Object -First 1
    if ($targetUser) {
        $targetUserId = $targetUser._id
        Write-Host "Target User ID for tests: $targetUserId" -ForegroundColor Gray
        Write-Host "Target User Email: $($targetUser.email)" -ForegroundColor Gray
    }
} catch {
    Write-Host "[FAIL] Superadmin failed to list users: $_" -ForegroundColor Red
}

# Test 3: Regular user cannot access specific user details (403)
Write-Host ""
Write-Host "Test 3: Regular user cannot access GET /api/protected/admin/users/[userId] (AC7)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users/$targetUserId" -Method GET -Headers @{"Authorization" = "Bearer $regularToken"; "Content-Type" = "application/json"}
    Write-Host "[FAIL] Regular user should NOT be able to access user details" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "[PASS] Regular user correctly denied access (403 Forbidden)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 4: Superadmin can view specific user details (AC1)
Write-Host ""
Write-Host "Test 4: Superadmin can view user details GET /api/protected/admin/users/[userId] (AC1)..." -ForegroundColor Yellow
try {
    $userDetailsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users/$targetUserId" -Method GET -Headers @{"Authorization" = "Bearer $superadminToken"; "Content-Type" = "application/json"}
    Write-Host "[PASS] Superadmin successfully retrieved user details" -ForegroundColor Green
    Write-Host "User Email: $($userDetailsResponse.user.email)" -ForegroundColor Gray
    Write-Host "User Role: $($userDetailsResponse.user.role)" -ForegroundColor Gray
    Write-Host "User Full Name: $($userDetailsResponse.user.fullName)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Superadmin failed to retrieve user details: $_" -ForegroundColor Red
}

# Test 5: Superadmin can view their own details
Write-Host ""
Write-Host "Test 5: Superadmin can view their own details..." -ForegroundColor Yellow
try {
    $selfDetailsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users/$superadminUserId" -Method GET -Headers @{"Authorization" = "Bearer $superadminToken"; "Content-Type" = "application/json"}
    Write-Host "[PASS] Superadmin successfully retrieved their own details" -ForegroundColor Green
    Write-Host "Email: $($selfDetailsResponse.user.email)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Superadmin failed to retrieve own details: $_" -ForegroundColor Red
}

# Test 6: 404 for non-existent user
Write-Host ""
Write-Host "Test 6: GET returns 404 for non-existent user..." -ForegroundColor Yellow
$fakeUserId = "000000000000000000000000"
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users/$fakeUserId" -Method GET -Headers @{"Authorization" = "Bearer $superadminToken"; "Content-Type" = "application/json"}
    Write-Host "[FAIL] Should have returned 404 for non-existent user" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "[PASS] Correctly returned 404 for non-existent user" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 7: Regular user cannot update user role (403)
Write-Host ""
Write-Host "Test 7: Regular user cannot update role PATCH /api/protected/admin/users/[userId]/role (AC7)..." -ForegroundColor Yellow
$updateRoleBody = @{
    role = "superadmin"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users/$targetUserId/role" -Method PATCH -Headers @{"Authorization" = "Bearer $regularToken"; "Content-Type" = "application/json"} -Body $updateRoleBody
    Write-Host "[FAIL] Regular user should NOT be able to update role" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "[PASS] Regular user correctly denied access (403 Forbidden)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 8: Superadmin can promote user to superadmin (AC2)
Write-Host ""
Write-Host "Test 8: Superadmin can promote user to superadmin PATCH /api/protected/admin/users/[userId]/role (AC2)..." -ForegroundColor Yellow
$promoteBody = @{
    role = "superadmin"
} | ConvertTo-Json

try {
    $promoteResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users/$targetUserId/role" -Method PATCH -Headers @{"Authorization" = "Bearer $superadminToken"; "Content-Type" = "application/json"} -Body $promoteBody
    Write-Host "[PASS] User successfully promoted to superadmin" -ForegroundColor Green
    Write-Host "User: $($promoteResponse.user.email)" -ForegroundColor Gray
    Write-Host "New Role: $($promoteResponse.user.role)" -ForegroundColor Gray

    if ($promoteResponse.user.role -eq "superadmin") {
        Write-Host "[PASS] Role change verified" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Role not updated correctly" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to promote user: $_" -ForegroundColor Red
}

# Test 9: Superadmin can demote superadmin to user (AC2)
Write-Host ""
Write-Host "Test 9: Superadmin can demote superadmin to user (AC2)..." -ForegroundColor Yellow
$demoteBody = @{
    role = "user"
} | ConvertTo-Json

try {
    $demoteResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users/$targetUserId/role" -Method PATCH -Headers @{"Authorization" = "Bearer $superadminToken"; "Content-Type" = "application/json"} -Body $demoteBody
    Write-Host "[PASS] Superadmin successfully demoted to user" -ForegroundColor Green
    Write-Host "User: $($demoteResponse.user.email)" -ForegroundColor Gray
    Write-Host "New Role: $($demoteResponse.user.role)" -ForegroundColor Gray

    if ($demoteResponse.user.role -eq "user") {
        Write-Host "[PASS] Role change verified" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Role not updated correctly" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to demote user: $_" -ForegroundColor Red
}

# Test 10: Superadmin cannot demote themselves (AC5)
Write-Host ""
Write-Host "Test 10: Superadmin cannot demote themselves (AC5)..." -ForegroundColor Yellow
$selfDemoteBody = @{
    role = "user"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users/$superadminUserId/role" -Method PATCH -Headers @{"Authorization" = "Bearer $superadminToken"; "Content-Type" = "application/json"} -Body $selfDemoteBody
    Write-Host "[FAIL] Superadmin should NOT be able to demote themselves" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "[PASS] Self-demotion correctly prevented (400 Bad Request)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 11: Invalid role value (validation)
Write-Host ""
Write-Host "Test 11: Invalid role value rejected..." -ForegroundColor Yellow
$invalidRoleBody = @{
    role = "invalid_role"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users/$targetUserId/role" -Method PATCH -Headers @{"Authorization" = "Bearer $superadminToken"; "Content-Type" = "application/json"} -Body $invalidRoleBody
    Write-Host "[FAIL] Invalid role should have been rejected" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "[PASS] Invalid role correctly rejected (400 Bad Request)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 12: 404 for role update on non-existent user
Write-Host ""
Write-Host "Test 12: Role update returns 404 for non-existent user..." -ForegroundColor Yellow
$roleUpdateBody = @{
    role = "user"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users/$fakeUserId/role" -Method PATCH -Headers @{"Authorization" = "Bearer $superadminToken"; "Content-Type" = "application/json"} -Body $roleUpdateBody
    Write-Host "[FAIL] Should have returned 404 for non-existent user" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "[PASS] Correctly returned 404 for non-existent user" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 13: Regular user cannot delete users (403)
Write-Host ""
Write-Host "Test 13: Regular user cannot delete users DELETE /api/protected/admin/users/[userId] (AC7)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users/$targetUserId" -Method DELETE -Headers @{"Authorization" = "Bearer $regularToken"; "Content-Type" = "application/json"}
    Write-Host "[FAIL] Regular user should NOT be able to delete users" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "[PASS] Regular user correctly denied access (403 Forbidden)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 14: Superadmin cannot delete themselves (AC4)
Write-Host ""
Write-Host "Test 14: Superadmin cannot delete themselves (AC4)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users/$superadminUserId" -Method DELETE -Headers @{"Authorization" = "Bearer $superadminToken"; "Content-Type" = "application/json"}
    Write-Host "[FAIL] Superadmin should NOT be able to delete themselves" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "[PASS] Self-deletion correctly prevented (400 Bad Request)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 15: Create a temporary user for deletion test
Write-Host ""
Write-Host "Test 15: Create temporary user for deletion test..." -ForegroundColor Yellow
$uniqueEmail = "tempuser.delete.$(Get-Random)@example.com"
$tempUserBody = @{
    email = $uniqueEmail
    password = "TempPass123!@#"
    confirmPassword = "TempPass123!@#"
    fullName = "Temp User For Deletion"
} | ConvertTo-Json

try {
    $tempUserResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $tempUserBody
    $tempUserId = $tempUserResponse.user._id
    Write-Host "[PASS] Temporary user created successfully" -ForegroundColor Green
    Write-Host "Temp User ID: $tempUserId" -ForegroundColor Gray
    Write-Host "Temp User Email: $uniqueEmail" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Failed to create temporary user: $_" -ForegroundColor Red
}

# Test 16: Superadmin can delete other users (AC3)
Write-Host ""
Write-Host "Test 16: Superadmin can delete other users DELETE /api/protected/admin/users/[userId] (AC3)..." -ForegroundColor Yellow
try {
    $deleteResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users/$tempUserId" -Method DELETE -Headers @{"Authorization" = "Bearer $superadminToken"; "Content-Type" = "application/json"}
    Write-Host "[PASS] User successfully deleted" -ForegroundColor Green
    Write-Host "Deleted User Email: $($deleteResponse.deletedUser.email)" -ForegroundColor Gray
    Write-Host "Message: $($deleteResponse.message)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Failed to delete user: $_" -ForegroundColor Red
}

# Test 17: Verify user was actually deleted (404)
Write-Host ""
Write-Host "Test 17: Verify deleted user no longer exists..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users/$tempUserId" -Method GET -Headers @{"Authorization" = "Bearer $superadminToken"; "Content-Type" = "application/json"}
    Write-Host "[FAIL] Deleted user should not exist anymore" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "[PASS] Deleted user correctly returns 404 (deletion verified)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 18: 404 for deleting non-existent user
Write-Host ""
Write-Host "Test 18: DELETE returns 404 for non-existent user..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users/$fakeUserId" -Method DELETE -Headers @{"Authorization" = "Bearer $superadminToken"; "Content-Type" = "application/json"}
    Write-Host "[FAIL] Should have returned 404 for non-existent user" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "[PASS] Correctly returned 404 for non-existent user" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 19: Pagination works correctly
Write-Host ""
Write-Host "Test 19: List users pagination works correctly..." -ForegroundColor Yellow
try {
    $page1Response = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users?page=1&limit=2" -Method GET -Headers @{"Authorization" = "Bearer $superadminToken"; "Content-Type" = "application/json"}
    Write-Host "[PASS] Page 1 retrieved successfully" -ForegroundColor Green
    Write-Host "Users on Page 1: $($page1Response.users.Count)" -ForegroundColor Gray
    Write-Host "Total Users: $($page1Response.pagination.total)" -ForegroundColor Gray
    Write-Host "Total Pages: $($page1Response.pagination.totalPages)" -ForegroundColor Gray

    if ($page1Response.pagination.totalPages -gt 1) {
        $page2Response = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users?page=2&limit=2" -Method GET -Headers @{"Authorization" = "Bearer $superadminToken"; "Content-Type" = "application/json"}
        Write-Host "[PASS] Page 2 retrieved successfully" -ForegroundColor Green
        Write-Host "Users on Page 2: $($page2Response.users.Count)" -ForegroundColor Gray
    }
} catch {
    Write-Host "[FAIL] Pagination test failed: $_" -ForegroundColor Red
}

# Test 20: Unauthorized access without token (401)
Write-Host ""
Write-Host "Test 20: Requests without token return 401 Unauthorized..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/protected/admin/users" -Method GET -Headers @{"Content-Type" = "application/json"}
    Write-Host "[FAIL] Should have returned 401 without token" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "[PASS] Correctly returned 401 Unauthorized (no token)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== All Tests Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- GET /api/protected/admin/users: TESTED" -ForegroundColor Green
Write-Host "- GET /api/protected/admin/users/[userId]: TESTED" -ForegroundColor Green
Write-Host "- PATCH /api/protected/admin/users/[userId]/role: TESTED" -ForegroundColor Green
Write-Host "- DELETE /api/protected/admin/users/[userId]: TESTED" -ForegroundColor Green
Write-Host "- Superadmin can view any user (AC1): TESTED" -ForegroundColor Green
Write-Host "- Superadmin can update roles (AC2): TESTED" -ForegroundColor Green
Write-Host "- Superadmin can delete users (AC3): TESTED" -ForegroundColor Green
Write-Host "- Superadmin cannot delete self (AC4): TESTED" -ForegroundColor Green
Write-Host "- Superadmin cannot demote self (AC5): TESTED" -ForegroundColor Green
Write-Host "- Role-based middleware (AC6): TESTED" -ForegroundColor Green
Write-Host "- Regular users get 403 (AC7): TESTED" -ForegroundColor Green
Write-Host "- Pagination: TESTED" -ForegroundColor Green
Write-Host "- Validation: TESTED" -ForegroundColor Green
Write-Host "- 404 handling: TESTED" -ForegroundColor Green
Write-Host "- 401 unauthorized: TESTED" -ForegroundColor Green
