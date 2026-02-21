# Epic E1 - Comprehensive Test Scenarios

> Complete test scenario list for Authentication and User Management epic. Includes positive, negative, edge cases, and out-of-the-box scenarios.

## Test Categories
- ✅ **Positive/Happy Path**: Normal successful flows
- ❌ **Negative**: Invalid inputs, errors, failures
- 🔒 **Security**: Authentication bypass, token manipulation, attacks
- 🎯 **Edge Cases**: Boundary conditions, unusual inputs
- 🔄 **Integration**: Cross-feature interactions
- ⚡ **Performance**: Load, timing, concurrent requests
- 🌐 **Out-of-the-Box**: Unusual but possible scenarios

---

## VIP-10001: User Registration

### Positive Scenarios

**TC-REG-001: Successful Registration with Valid Data**
- User provides valid email, password (8+ chars), and full name
- Account is created, user receives success message and redirects to login

**TC-REG-002: Registration with Minimum Password Length**
- User registers with exactly 8 character password
- Account is created successfully, password is hashed with bcrypt

**TC-REG-003: Registration with Maximum Length Fields**
- User registers with email (254 chars), fullName (200 chars), password (128 chars)
- All fields are accepted and stored correctly

**TC-REG-004: Registration with Special Characters in Name**
- User registers with fullName containing special chars (é, ñ, ü, etc.)
- Name is stored correctly with Unicode support

**TC-REG-005: Registration Sets Default Role**
- New user registers and receives "user" role by default
- Role is correctly assigned and stored in database

**TC-REG-006: Registration Creates Default Preferences**
- New user account has default preferences (theme: system, emailNotifications: true)
- Preferences object is created with all default values

### Negative Scenarios

**TC-REG-007: Registration with Invalid Email Format**
- User submits email without @ symbol or domain
- Validation error returned, account not created, error message displayed

**TC-REG-008: Registration with Duplicate Email**
- User tries to register with email that already exists
- Error message "Email already registered", no duplicate account created

**TC-REG-009: Registration with Password Too Short**
- User submits password with less than 8 characters
- Validation error, password requirement message shown, account not created

**TC-REG-010: Registration with Missing Required Fields**
- User submits form without email, password, or fullName
- Validation errors for each missing field, form not submitted

**TC-REG-011: Registration with Empty String Fields**
- User submits form with empty strings for required fields
- Validation errors triggered, empty strings rejected as invalid

**TC-REG-012: Registration with SQL Injection Attempt**
- User tries to inject SQL in email field (e.g., "admin@test.com'; DROP TABLE users;--")
- Input is sanitized, treated as literal string, no SQL executed

**TC-REG-013: Registration with XSS Attempt**
- User tries to inject script tags in fullName field
- Script tags are escaped/sanitized, stored as plain text

**TC-REG-014: Registration with Extremely Long Email**
- User submits email exceeding 254 characters
- Validation error, email length limit enforced

**TC-REG-015: Registration with Whitespace-Only Fields**
- User submits fields containing only spaces or tabs
- Validation rejects whitespace-only values, error message shown

**TC-REG-016: Registration with Case-Insensitive Email Duplicate**
- User tries to register "Test@Example.com" when "test@example.com" exists
- Duplicate detected, error message shown (case-insensitive check)

### Edge Cases

**TC-REG-017: Registration with Unicode Email**
- User registers with internationalized email (e.g., "测试@例子.测试")
- Email is validated and stored correctly (if supported)

**TC-REG-018: Registration with Password Containing All Character Types**
- User creates password with uppercase, lowercase, numbers, special chars
- Password is accepted and hashed correctly

**TC-REG-019: Registration During High Load**
- Multiple users register simultaneously (10+ concurrent requests)
- All registrations processed correctly, no data corruption

**TC-REG-020: Registration with Email Having Multiple @ Symbols**
- User submits email like "test@@example.com"
- Validation rejects invalid format, error message shown

### Out-of-the-Box Scenarios

**TC-REG-021: Registration with Email as Password**
- User tries to use their email address as password
- Allowed if meets length requirements, but security warning could be shown

**TC-REG-022: Registration with Reversed Email Domain**
- User submits email with reversed domain (e.g., "user@moc.elpmaxe")
- Accepted if valid format, but email verification would fail later

**TC-REG-023: Registration with Zero-Width Characters**
- User includes invisible Unicode characters in email or name
- Characters are preserved but may cause confusion, should be sanitized

**TC-REG-024: Registration with Emoji in Name**
- User includes emoji in fullName field (e.g., "John 😀 Doe")
- Emoji is stored correctly if database supports Unicode

**TC-REG-025: Registration with Password Same as Email**
- User sets password identical to email address
- Allowed but could trigger security warning

---

## VIP-10002: User Login

### Positive Scenarios

**TC-LOGIN-001: Successful Login with Valid Credentials**
- User logs in with correct email and password
- JWT token generated, cookie set, user redirected to dashboard

**TC-LOGIN-002: Login with Case-Insensitive Email**
- User logs in with "Admin@Example.com" when registered as "admin@example.com"
- Login succeeds, email matching is case-insensitive

**TC-LOGIN-003: Login Sets HTTP-Only Cookie**
- User logs in successfully
- Token stored in HTTP-only cookie, not accessible via JavaScript

**TC-LOGIN-004: Login Updates LastLoginAt Timestamp**
- User logs in, lastLoginAt field updated in database
- Timestamp reflects current login time accurately

**TC-LOGIN-005: Login Returns User Data Without Password**
- Successful login response includes user object
- Password/passwordHash fields excluded from response

**TC-LOGIN-006: Login with Remember Me Checked**
- User checks "Remember me" during login
- Token expiration extended or preference stored (if implemented)

### Negative Scenarios

**TC-LOGIN-007: Login with Incorrect Password**
- User enters correct email but wrong password
- Generic error "Invalid email or password" (no user enumeration)

**TC-LOGIN-008: Login with Non-Existent Email**
- User tries to login with email that doesn't exist
- Generic error "Invalid email or password" (no user enumeration)

**TC-LOGIN-009: Login with Empty Email Field**
- User submits login form without email
- Validation error, email required message shown

**TC-LOGIN-010: Login with Empty Password Field**
- User submits login form without password
- Validation error, password required message shown

**TC-LOGIN-011: Login with Invalid Email Format**
- User enters malformed email (e.g., "notanemail")
- Validation error, invalid email format message

**TC-LOGIN-012: Login with SQL Injection in Email**
- User attempts SQL injection in email field
- Input sanitized, treated as literal, login fails normally

**TC-LOGIN-013: Login with XSS in Email Field**
- User attempts script injection in email
- Script tags escaped, no execution, login fails

**TC-LOGIN-014: Login with Password Containing Special Characters**
- User enters password with special chars that might break parsing
- Password handled correctly, compared securely with bcrypt

**TC-LOGIN-015: Login After Account Deletion**
- User tries to login after account was deleted
- Login fails with generic error message

**TC-LOGIN-016: Login with Expired Token from Previous Session**
- User has old expired token, tries to login again
- New token generated, old token replaced

### Security Scenarios

**TC-LOGIN-017: Brute Force Attack Prevention**
- User attempts 100+ failed logins with different passwords
- Rate limiting should trigger, account temporarily locked or CAPTCHA required

**TC-LOGIN-018: Login with Stolen Token**
- Attacker uses valid JWT token from another user
- Token verified, user context extracted correctly, access granted (expected behavior)

**TC-LOGIN-019: Login Token Replay Attack**
- Attacker intercepts and replays login request
- New token generated, old token remains valid until expiration

**TC-LOGIN-020: Login with Modified JWT Token**
- Attacker modifies JWT token payload (e.g., changes role)
- Token signature invalid, login fails, token rejected

**TC-LOGIN-021: Login with Timing Attack Prevention**
- System responds with same timing for invalid email vs invalid password
- Prevents user enumeration through response time analysis

### Edge Cases

**TC-LOGIN-022: Login with Leading/Trailing Spaces in Email**
- User enters " admin@example.com " with spaces
- Email trimmed, login succeeds with trimmed email

**TC-LOGIN-023: Login with Unicode Characters in Password**
- User password contains Unicode characters (e.g., "Pässwörd123")
- Password comparison works correctly with Unicode support

**TC-LOGIN-024: Concurrent Login from Multiple Devices**
- User logs in simultaneously from 2 different browsers
- Both sessions work independently, separate tokens generated

**TC-LOGIN-025: Login During Database Connection Loss**
- Database temporarily unavailable during login attempt
- Error message shown, login fails gracefully, no partial state

### Out-of-the-Box Scenarios

**TC-LOGIN-026: Login with Email as Password**
- User accidentally enters email in password field
- Login fails (password doesn't match), error message shown

**TC-LOGIN-027: Login with Password as Email**
- User accidentally enters password in email field
- Validation fails (invalid email format), error shown

**TC-LOGIN-028: Login with Copy-Pasted Credentials**
- User copies credentials from password manager with hidden characters
- Login succeeds if credentials match exactly

**TC-LOGIN-029: Login with Browser Autofill**
- Browser autofills email and password from saved credentials
- Login works correctly with autofilled values

**TC-LOGIN-030: Login After Password Change**
- User changes password, then tries to login with old password
- Login fails, must use new password

---

## VIP-10003: Password Reset Flow

### Positive Scenarios

**TC-RESET-001: Request Password Reset with Valid Email**
- User requests reset for registered email
- Reset token generated, email sent (if email service configured), success message shown

**TC-RESET-002: Password Reset with Valid Token**
- User clicks reset link with valid token, sets new password
- Password updated, token invalidated, user can login with new password

**TC-RESET-003: Password Reset Token Expiration**
- User requests reset, token expires after 1 hour
- Expired token rejected, user must request new reset

**TC-RESET-004: Password Reset Invalidates Old Token**
- User requests reset twice, uses first token
- First token invalidated when second is generated, only latest token works

**TC-RESET-005: Password Reset with Strong New Password**
- User sets new password meeting all requirements (8+ chars)
- Password accepted, hashed, stored correctly

### Negative Scenarios

**TC-RESET-006: Reset Request with Non-Existent Email**
- User requests reset for email not in database
- Generic success message shown (no email enumeration), no token generated

**TC-RESET-007: Reset Request with Invalid Email Format**
- User submits malformed email in reset request
- Validation error, invalid email format message

**TC-RESET-008: Password Reset with Expired Token**
- User tries to reset password with token older than 1 hour
- Error message, token expired, must request new reset

**TC-RESET-009: Password Reset with Invalid Token**
- User tries to reset with tampered or random token string
- Error message, invalid token, reset fails

**TC-RESET-010: Password Reset with Used Token**
- User resets password, then tries to use same token again
- Token already used, error message, reset fails

**TC-RESET-011: Password Reset with Weak Password**
- User sets new password less than 8 characters
- Validation error, password requirements message shown

**TC-RESET-012: Password Reset with Empty Password**
- User submits reset form without password
- Validation error, password required

**TC-RESET-013: Password Reset Token Replay Attack**
- Attacker intercepts reset token, tries to use it multiple times
- Token invalidated after first use, subsequent attempts fail

### Edge Cases

**TC-RESET-014: Multiple Reset Requests in Short Time**
- User requests password reset 5 times within 1 minute
- Rate limiting should prevent abuse, only latest token valid

**TC-RESET-015: Password Reset During Active Session**
- User requests reset while logged in
- Reset proceeds, but user should be logged out for security

**TC-RESET-016: Password Reset with Special Characters**
- User sets password with special chars that might break hashing
- Password hashed correctly, login works with new password

### Out-of-the-Box Scenarios

**TC-RESET-017: Password Reset Token in URL Fragment**
- Reset link has token in URL fragment (#token=xyz)
- Token should be in query parameter, fragment not sent to server

**TC-RESET-018: Password Reset with Unicode Password**
- User sets password with Unicode characters
- Password accepted and hashed if system supports Unicode

**TC-RESET-019: Password Reset After Account Deletion**
- User requests reset, then account is deleted before using token
- Token validation should check if user exists, fail gracefully

---

## VIP-10004: JWT Token Management

### Positive Scenarios

**TC-JWT-001: Token Generation on Login**
- User logs in successfully
- Valid JWT token generated with userId, email, role, 7-day expiration

**TC-JWT-002: Token Verification on Protected Route**
- User accesses protected route with valid token
- Token verified, user context extracted, request proceeds

**TC-JWT-003: Token Decoding Without Verification**
- System decodes token to read payload (for debugging)
- Payload extracted correctly, but not used for authentication

**TC-JWT-004: Token Contains Correct User Data**
- Token payload includes userId, email, role
- All fields match logged-in user data

**TC-JWT-005: Token Expiration After 7 Days**
- User's token expires after 7 days
- Token rejected, user must login again

### Negative Scenarios

**TC-JWT-006: Token Verification with Invalid Signature**
- Attacker modifies token signature
- Token rejected, verification fails, 401 error returned

**TC-JWT-007: Token Verification with Expired Token**
- User tries to access protected route with expired token
- Token rejected, 401 error, redirect to login

**TC-JWT-008: Token Verification with Missing Token**
- User accesses protected route without token
- 401 error, authentication required message

**TC-JWT-009: Token Verification with Malformed Token**
- User sends corrupted token string
- Token parsing fails, 401 error returned

**TC-JWT-010: Token Verification with Wrong Algorithm**
- Token signed with different algorithm than expected
- Verification fails, token rejected

**TC-JWT-011: Token Verification with Empty Payload**
- Token has empty or null payload
- Verification fails, invalid token error

**TC-JWT-012: Token Verification After User Deletion**
- User's account deleted, but token still valid
- Token verified but user lookup fails, 404 or 401 returned

**TC-JWT-013: Token Verification with Modified Payload**
- Attacker modifies token payload (e.g., changes role to superadmin)
- Signature invalid, token rejected, verification fails

### Security Scenarios

**TC-JWT-014: Token Theft and Reuse**
- Attacker steals valid token, uses it to access account
- Token works (expected), but should be rotated on suspicious activity

**TC-JWT-015: Token Replay Attack**
- Attacker intercepts and replays request with same token
- Request succeeds (expected for stateless JWT), but should monitor for abuse

**TC-JWT-016: Token Brute Force**
- Attacker tries to guess valid token by brute force
- Extremely low probability, but rate limiting should prevent excessive attempts

**TC-JWT-017: Token in URL Query Parameter**
- Token accidentally included in URL (security risk)
- Should use Authorization header or cookie, not URL params

**TC-JWT-018: Token Logging Prevention**
- Token should not appear in server logs or error messages
- Logs sanitized, tokens not logged in plain text

### Edge Cases

**TC-JWT-019: Token Verification at Exact Expiration Time**
- Token expires at specific timestamp, request arrives at that moment
- Token should be rejected (expired), or accepted if checked before expiration

**TC-JWT-020: Token with Future Expiration (Clock Skew)**
- Token has expiration in future due to server clock difference
- Clock skew tolerance should handle small differences

**TC-JWT-021: Token Verification During High Load**
- 1000+ concurrent requests with valid tokens
- All tokens verified correctly, no performance degradation

**TC-JWT-022: Token with Special Characters in Payload**
- User email/name contains special chars encoded in token
- Token encoding/decoding handles special characters correctly

### Out-of-the-Box Scenarios

**TC-JWT-023: Token Generation with Null User Data**
- System tries to generate token with null userId
- Error thrown, token generation fails, login fails

**TC-JWT-024: Token Verification with Multiple Tokens**
- User sends multiple tokens in same request
- System should use first valid token or reject ambiguous request

**TC-JWT-025: Token Expiration Extension**
- User requests token refresh before expiration
- New token generated with extended expiration (if refresh endpoint exists)

---

## VIP-10005: Protected Routes Middleware

### Positive Scenarios

**TC-MW-001: Access Dashboard with Valid Token**
- Authenticated user accesses /dashboard
- Middleware verifies token, request proceeds, dashboard loads

**TC-MW-002: Access Protected API with Valid Token**
- Authenticated user calls /api/protected/me
- Middleware verifies token, API responds with user data

**TC-MW-003: Access Public Route Without Token**
- Unauthenticated user accesses /login
- Middleware allows access, no authentication required

**TC-MW-004: Middleware Checks Cookie First**
- User has token in cookie, middleware checks cookie before header
- Cookie token used, authentication succeeds

**TC-MW-005: Middleware Falls Back to Authorization Header**
- User has token in Authorization header but not cookie
- Header token used, authentication succeeds

**TC-MW-006: Middleware Redirects with Return URL**
- Unauthenticated user tries to access /dashboard/generate
- Redirected to /login?redirect=/dashboard/generate

### Negative Scenarios

**TC-MW-007: Access Dashboard Without Token**
- Unauthenticated user tries to access /dashboard
- Middleware redirects to /login, dashboard not accessible

**TC-MW-008: Access Protected API Without Token**
- Unauthenticated user calls /api/protected/me
- Middleware returns 401 JSON response, no redirect

**TC-MW-009: Access Protected Route with Invalid Token**
- User sends corrupted or invalid token
- Middleware rejects token, redirects to login or returns 401

**TC-MW-010: Access Protected Route with Expired Token**
- User sends expired token
- Middleware detects expiration, redirects to login

**TC-MW-011: Access Protected Route After Logout**
- User logs out, then tries to access /dashboard
- Middleware detects missing/invalid token, redirects to login

**TC-MW-012: Middleware Bypass Attempt**
- Attacker tries to bypass middleware by accessing routes directly
- All protected routes properly guarded, no bypass possible

**TC-MW-013: Middleware with Malformed Cookie**
- Cookie value is malformed or corrupted
- Middleware handles error gracefully, treats as no token

### Security Scenarios

**TC-MW-014: Middleware Token Injection**
- Attacker tries to inject token via URL parameter
- Middleware only checks cookie and header, URL params ignored

**TC-MW-015: Middleware Path Traversal**
- Attacker tries to access /dashboard/../admin
- Path normalized, middleware still applies, access denied if not authorized

**TC-MW-016: Middleware Case Sensitivity**
- Attacker tries /Dashboard (capital D) to bypass
- Middleware handles case-insensitive matching or normalizes paths

**TC-MW-017: Middleware Rate Limiting**
- Attacker makes 1000+ requests to protected routes
- Rate limiting should prevent abuse, excessive requests blocked

### Edge Cases

**TC-MW-018: Middleware with Multiple Cookies**
- Request has multiple cookies, including valid token
- Middleware finds token cookie, authentication succeeds

**TC-MW-019: Middleware with Very Long Token**
- Token string is extremely long (edge case)
- Middleware handles long strings, verification works correctly

**TC-MW-020: Middleware During Server Restart**
- User has valid token, server restarts, token still valid
- Middleware continues to work, token verified against same secret

**TC-MW-021: Middleware with Special Characters in Path**
- Protected route has special chars (e.g., /dashboard/user@123)
- Middleware matches path correctly, authentication works

### Out-of-the-Box Scenarios

**TC-MW-022: Middleware with Token in Both Cookie and Header**
- User sends token in both cookie and Authorization header
- Middleware should prefer cookie, or use first valid one

**TC-MW-023: Middleware with Empty Token String**
- Cookie or header contains empty string for token
- Middleware treats as no token, authentication fails

**TC-MW-024: Middleware with Whitespace in Token**
- Token has leading/trailing whitespace
- Token should be trimmed before verification

**TC-MW-025: Middleware Concurrent Request Handling**
- Multiple requests arrive simultaneously with same token
- All requests processed correctly, no race conditions

---

## VIP-10006: User Profile Management

### Positive Scenarios

**TC-PROF-001: Get Current User Profile**
- Authenticated user calls GET /api/protected/me
- Returns user data (email, fullName, role, preferences) without password

**TC-PROF-002: Update User Full Name**
- User updates fullName via PATCH /api/protected/me
- Name updated in database, updatedAt timestamp set, response includes new data

**TC-PROF-003: Update User Email**
- User updates email to new valid email
- Email updated, uniqueness checked, updatedAt timestamp set

**TC-PROF-004: Update User Preferences**
- User updates theme preference (light/dark/system)
- Preferences merged with existing, updated correctly

**TC-PROF-005: Partial Profile Update**
- User updates only fullName, other fields unchanged
- Only fullName updated, other fields remain same

**TC-PROF-006: Profile Update Returns Fresh Data**
- User updates profile, response includes updated user object
- Response data matches database state after update

### Negative Scenarios

**TC-PROF-007: Update Profile Without Authentication**
- Unauthenticated user tries to update profile
- 401 error, authentication required

**TC-PROF-008: Update Email to Existing Email**
- User tries to change email to one already in use
- 400 error, "Email already in use" message

**TC-PROF-009: Update Profile with Invalid Email Format**
- User tries to set invalid email format
- Validation error, invalid email format message

**TC-PROF-010: Update Profile with Empty Full Name**
- User tries to set empty string for fullName
- Validation error, fullName required or minimum length enforced

**TC-PROF-011: Update Profile with Extremely Long Name**
- User tries to set fullName exceeding 200 characters
- Validation error, length limit enforced

**TC-PROF-012: Update Profile with Invalid Preferences**
- User sends invalid preference values (e.g., theme: "invalid")
- Validation error, invalid preference value message

**TC-PROF-013: Update Profile of Another User**
- User tries to update different user's profile (if endpoint allows userId)
- 403 error, can only update own profile

**TC-PROF-014: Update Profile with SQL Injection**
- User tries to inject SQL in fullName field
- Input sanitized, treated as literal string, no SQL executed

**TC-PROF-015: Update Profile with XSS**
- User tries to inject script in fullName
- Script escaped, stored as plain text, no execution

### Edge Cases

**TC-PROF-016: Update Profile with Unicode Characters**
- User updates name with Unicode chars (é, ñ, emoji)
- Name stored correctly if database supports Unicode

**TC-PROF-017: Update Profile During Concurrent Requests**
- User updates profile from 2 devices simultaneously
- Last write wins, or conflict resolution applied

**TC-PROF-018: Update Profile with Null Values**
- User sends null for optional fields
- Null values handled correctly, fields cleared or ignored

**TC-PROF-019: Update Profile with All Fields**
- User updates email, fullName, and preferences in one request
- All fields updated atomically, transaction succeeds or fails together

### Out-of-the-Box Scenarios

**TC-PROF-020: Update Profile to Same Values**
- User updates email to current email (no change)
- Update succeeds, no error, updatedAt may or may not change

**TC-PROF-021: Update Profile with Whitespace-Only Name**
- User tries to set name with only spaces
- Validation should reject or trim whitespace

**TC-PROF-022: Update Profile After Account Deletion**
- User updates profile, then account is deleted before response
- Update fails gracefully, 404 error returned

**TC-PROF-023: Update Profile with Case-Insensitive Email Duplicate**
- User tries to change email to "Test@Example.com" when "test@example.com" exists
- Duplicate detected, error shown

---

## VIP-10007: User Preferences & Settings

### Positive Scenarios

**TC-PREF-001: Update Theme Preference**
- User changes theme from "system" to "dark"
- Preference saved, UI updates to dark mode

**TC-PREF-002: Update Email Notifications Setting**
- User toggles emailNotifications from true to false
- Preference updated, notification setting saved

**TC-PREF-003: Update Default Tone**
- User changes defaultTone from "Professional" to "Casual"
- Preference saved, used in content generation

**TC-PREF-004: Update Default Word Count**
- User sets defaultWordCount to 2000
- Preference saved, used as default in generation forms

**TC-PREF-005: Update Multiple Preferences at Once**
- User updates theme, emailNotifications, and defaultTone together
- All preferences updated atomically

**TC-PREF-006: Get User Preferences**
- User retrieves preferences via profile endpoint
- All preferences returned correctly with current values

### Negative Scenarios

**TC-PREF-007: Update Preference with Invalid Theme Value**
- User tries to set theme to "purple" (not in enum)
- Validation error, invalid theme value message

**TC-PREF-008: Update Preference with Invalid Word Count**
- User tries to set defaultWordCount to negative number
- Validation error, word count must be positive

**TC-PREF-009: Update Preference with Extremely High Word Count**
- User sets defaultWordCount to 100000
- Validation error or limit enforced (e.g., max 10000)

**TC-PREF-010: Update Preference with Wrong Data Type**
- User sends string for boolean emailNotifications
- Validation error, type mismatch message

**TC-PREF-011: Update Preference Without Authentication**
- Unauthenticated user tries to update preferences
- 401 error, authentication required

### Edge Cases

**TC-PREF-012: Update Preference with Null Value**
- User sends null for optional preference
- Null handled correctly, preference cleared or default used

**TC-PREF-013: Update Preference with Empty Object**
- User sends empty preferences object
- Existing preferences preserved, no changes made

**TC-PREF-014: Update Preference with Extra Fields**
- User sends preferences object with unknown fields
- Extra fields ignored or validation error (strict mode)

### Out-of-the-Box Scenarios

**TC-PREF-015: Update Preference to Same Value**
- User sets theme to current theme value
- Update succeeds, no error, but no actual change

**TC-PREF-016: Update Preference with Special Characters**
- User sets defaultTone with special chars (if allowed)
- Preference stored correctly if validation allows

---

## VIP-10008: Role-Based Access Control

### Positive Scenarios

**TC-RBAC-001: User Role Access to User Resources**
- Regular user accesses user-level resources
- Access granted, user can perform user-level actions

**TC-RBAC-002: Superadmin Access to Admin Resources**
- Superadmin accesses admin-only resources
- Access granted, superadmin can perform admin actions

**TC-RBAC-003: Superadmin Access to User Resources**
- Superadmin accesses user-level resources
- Access granted, superadmin has access to all levels

**TC-RBAC-004: Editor Role Access**
- Editor accesses editor-level resources
- Access granted if editor role has specific permissions

**TC-RBAC-005: Admin Role Access**
- Admin accesses admin-level resources
- Access granted, admin can perform admin actions

**TC-RBAC-006: Role Check in API Endpoints**
- Protected endpoint checks user role before processing
- Role verified, request proceeds if authorized

### Negative Scenarios

**TC-RBAC-007: User Access to Admin Resources**
- Regular user tries to access admin-only endpoint
- 403 error, "Insufficient permissions" message

**TC-RBAC-008: User Access to Superadmin Resources**
- Regular user tries to access superadmin-only endpoint
- 403 error, access denied

**TC-RBAC-009: Editor Access to Admin Resources**
- Editor tries to access admin-only resources
- 403 error if editor doesn't have admin permissions

**TC-RBAC-010: Role Bypass Attempt**
- Attacker tries to modify role in JWT token
- Token signature invalid, modification detected, access denied

**TC-RBAC-011: Role Check with Invalid Role**
- User has invalid role value in database
- Role check fails, default to lowest permission level

**TC-RBAC-012: Role Check After Role Change**
- User's role changed in database, but old token still has old role
- Token role checked, but should verify against database for critical operations

### Security Scenarios

**TC-RBAC-013: Privilege Escalation Attempt**
- Attacker tries to elevate role through API manipulation
- Server-side role verification prevents escalation

**TC-RBAC-014: Role Enumeration**
- Attacker tries to determine available roles
- Role information not exposed unnecessarily

**TC-RBAC-015: Role-Based Rate Limiting**
- Different rate limits for different roles
- Admin/superadmin may have higher limits than regular users

### Edge Cases

**TC-RBAC-016: Role Check with Null Role**
- User has null role in database
- Default to "user" role or error handling

**TC-RBAC-017: Role Check with Multiple Roles**
- System supports users with multiple roles (if implemented)
- All roles checked, highest permission level used

**TC-RBAC-018: Role Check During Role Update**
- User's role updated while they have active session
- Old token may still work until expiration, or force re-login

### Out-of-the-Box Scenarios

**TC-RBAC-019: Role Check with Case Sensitivity**
- Role stored as "SuperAdmin" vs "superadmin"
- Role comparison should be case-insensitive or normalized

**TC-RBAC-020: Role Check with Custom Roles**
- System has custom roles beyond standard (user, editor, admin, superadmin)
- Custom roles handled correctly in permission checks

---

## Integration & Cross-Feature Scenarios

### Integration Scenarios

**TC-INT-001: Register → Login → Access Dashboard Flow**
- User registers, then logs in, then accesses dashboard
- Complete flow works, user sees correct email in dashboard

**TC-INT-002: Login → Update Profile → Logout Flow**
- User logs in, updates profile, then logs out
- All steps work correctly, changes persisted

**TC-INT-003: Password Reset → Login with New Password**
- User resets password, then logs in with new password
- New password works, old password rejected

**TC-INT-004: Multiple Sessions with Same Account**
- User logs in from browser and mobile app simultaneously
- Both sessions work independently, tokens valid separately

**TC-INT-005: Token Expiration During Active Session**
- User's token expires while using application
- User redirected to login, session state preserved if possible

**TC-INT-006: Profile Update Affects All Sessions**
- User updates email, all active sessions see new email
- Changes reflected across sessions (if real-time updates implemented)

### Performance Scenarios

**TC-PERF-001: Concurrent Login Requests**
- 100 users log in simultaneously
- All logins processed correctly, no data corruption

**TC-PERF-002: High Volume Registration**
- 1000 users register within 1 minute
- All registrations processed, database handles load

**TC-PERF-003: Token Verification Performance**
- 10000 token verifications per second
- Verification fast, no performance degradation

**TC-PERF-004: Database Query Optimization**
- User profile lookup with proper indexing
- Queries fast, response time under 100ms

### Out-of-the-Box Integration Scenarios

**TC-OOB-001: Login After Browser Clear**
- User clears browser cookies, then tries to access dashboard
- Redirected to login, must authenticate again

**TC-OOB-002: Login with Incognito Mode**
- User logs in using incognito/private browsing
- Login works, but cookie cleared when window closes

**TC-OOB-003: Login with Disabled Cookies**
- User has cookies disabled in browser
- Login fails or uses alternative method (localStorage fallback)

**TC-OOB-004: Login with Ad Blocker**
- Ad blocker interferes with authentication requests
- System handles gracefully, error message if requests blocked

**TC-OOB-005: Login During Network Interruption**
- Network disconnects during login request
- Error handling, user can retry when connection restored

**TC-OOB-006: Login with Browser Extension Interference**
- Browser extension modifies requests/responses
- System validates all inputs, security not compromised

**TC-OOB-007: Login with Time Zone Differences**
- User in different timezone, token expiration calculated correctly
- Token expiration uses UTC, works across timezones

**TC-OOB-008: Login with Daylight Saving Time Change**
- Token expiration during DST transition
- Token expiration calculated correctly, no issues

**TC-OOB-009: Login with Server Clock Drift**
- Server clock drifts, affects token expiration
- Clock synchronization or tolerance handles drift

**TC-OOB-010: Login with Unicode Domain**
- User accesses site via Unicode domain (if supported)
- Authentication works correctly with Unicode domains

---

## Test Execution Checklist

### Test Environment Setup
- [ ] Database seeded with test users (admin, user, editor)
- [ ] Test users have known passwords
- [ ] JWT_SECRET configured correctly
- [ ] Email service configured (or mocked) for password reset
- [ ] Rate limiting configured
- [ ] Browser DevTools open for network monitoring
- [ ] Console logging enabled for debugging

### Test Execution Order
1. **Registration Tests** (TC-REG-001 to TC-REG-025)
2. **Login Tests** (TC-LOGIN-001 to TC-LOGIN-030)
3. **Password Reset Tests** (TC-RESET-001 to TC-RESET-019)
4. **JWT Token Tests** (TC-JWT-001 to TC-JWT-025)
5. **Middleware Tests** (TC-MW-001 to TC-MW-025)
6. **Profile Management Tests** (TC-PROF-001 to TC-PROF-023)
7. **Preferences Tests** (TC-PREF-001 to TC-PREF-016)
8. **RBAC Tests** (TC-RBAC-001 to TC-RBAC-020)
9. **Integration Tests** (TC-INT-001 to TC-INT-006)
10. **Performance Tests** (TC-PERF-001 to TC-PERF-004)
11. **Out-of-the-Box Tests** (TC-OOB-001 to TC-OOB-010)

### Test Results Tracking
- [ ] Create test results document
- [ ] Mark each test as Pass/Fail/Skip
- [ ] Document bugs found with steps to reproduce
- [ ] Track test coverage percentage
- [ ] Note any test environment issues

### Total Test Count
- **Registration**: 25 tests
- **Login**: 30 tests
- **Password Reset**: 19 tests
- **JWT Token**: 25 tests
- **Middleware**: 25 tests
- **Profile Management**: 23 tests
- **Preferences**: 16 tests
- **RBAC**: 20 tests
- **Integration**: 6 tests
- **Performance**: 4 tests
- **Out-of-the-Box**: 10 tests

**Total: 203 Test Scenarios**

---

## Notes
- All tests should be automated where possible
- Manual testing required for browser-specific scenarios
- Security tests should be performed in isolated environment
- Performance tests require load testing tools
- Some out-of-the-box scenarios may be low priority but valuable for robustness

