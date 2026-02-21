# VIP-10007: Email Verification - Test Specification

## Feature: Email Verification
As a system, I need to verify user email addresses to ensure account authenticity

### Test Scenarios

#### Scenario: New user receives verification email
```gherkin
Given a new user registers with email "newuser@example.com"
Then a verification email should be sent to "newuser@example.com"
And the email should contain a unique verification token
And the verification link should be valid for 24 hours
And the user's emailVerified status should be false
```

#### Scenario: User verifies email successfully
```gherkin
Given a user with unverified email exists
And they receive a verification email with token "VALID_TOKEN"
When they click the verification link with token "VALID_TOKEN"
Then they should see "Email verified successfully"
And their emailVerified status should be true
And they should be redirected to login page
```

#### Scenario: Verification fails with expired token
```gherkin
Given a user has an expired verification token
When they click the verification link
Then they should see "Verification link expired"
And they should see an option to "Resend verification email"
And their emailVerified status should remain false
```

#### Scenario: Verification fails with invalid token
```gherkin
Given an invalid verification token "INVALID123"
When a user tries to verify with this token
Then they should see "Invalid verification link"
And they should be redirected to registration page
```

#### Scenario: Already verified email cannot be verified again
```gherkin
Given a user with verified email
And they have an old verification token
When they try to use the old token
Then they should see "Email already verified"
And they should be redirected to login page
```

#### Scenario: Resend verification email
```gherkin
Given a user with unverified email "user@example.com"
And they are on the login page
When they click "Resend verification email"
And they enter "user@example.com"
And they click "Send"
Then they should see "Verification email sent"
And a new verification email should be sent
And the old token should be invalidated
```

#### Scenario: Cannot login with unverified email (if required)
```gherkin
Given email verification is required for login
And a user with unverified email exists
When they try to login with correct credentials
Then they should see "Please verify your email before logging in"
And they should see a "Resend verification email" link
And they should not be logged in
```

#### Scenario: Verified badge shows in profile
```gherkin
Given I am logged in with verified email
When I view my profile page
Then I should see a "Verified" badge next to my email
And the badge should be green with a checkmark
```

#### Scenario: Unverified indicator shows in profile
```gherkin
Given I am logged in with unverified email
When I view my profile page
Then I should see "Unverified" status
And I should see a "Verify Email" button
When I click "Verify Email"
Then a new verification email should be sent
```

#### Scenario: Email change triggers re-verification
```gherkin
Given I am logged in with verified email "old@example.com"
When I change my email to "new@example.com"
Then my emailVerified status should become false
And a verification email should be sent to "new@example.com"
And my account should show "Pending verification for new@example.com"
```

## API Tests

#### Scenario: API sends verification email on registration
```gherkin
When a user registers at "/api/auth/register"
Then an email job should be created
And the email should contain verification token
And the token should be stored with userId in database
```

#### Scenario: API verifies email with valid token
```gherkin
Given a valid verification token "VALID_TOKEN"
When I GET "/api/auth/verify-email?token=VALID_TOKEN"
Then the response status should be 200
And the user's emailVerified should be true in database
And the verification token should be deleted
```

#### Scenario: API rejects expired verification token
```gherkin
Given an expired verification token
When I GET "/api/auth/verify-email?token=EXPIRED_TOKEN"
Then the response status should be 400
And the response should contain "Token expired"
```

#### Scenario: API resends verification email
```gherkin
Given a user with unverified email
When I POST "/api/auth/resend-verification" with:
  | email | user@example.com |
Then the response status should be 200
And a new verification email should be queued
And old tokens should be invalidated
```
