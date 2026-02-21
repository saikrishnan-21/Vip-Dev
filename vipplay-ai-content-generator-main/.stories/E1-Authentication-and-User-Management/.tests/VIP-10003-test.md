# VIP-10003: Password Reset - Test Specification

## Feature: Password Reset
As a user who forgot my password, I want to reset it so that I can regain access to my account

### Test Scenarios

#### Scenario: Request password reset with valid email
```gherkin
Given I am on the forgot password page
And a user exists with email "john@example.com"
When I enter "john@example.com" in the email field
And I click the "Send Reset Link" button
Then I should see a success message "Password reset link sent to your email"
And I should receive an email with a reset link
And the reset link should be valid for 1 hour
```

#### Scenario: Request password reset with non-existent email
```gherkin
Given I am on the forgot password page
When I enter "nonexistent@example.com" in the email field
And I click the "Send Reset Link" button
Then I should see a generic message "If the email exists, a reset link will be sent"
And no email should be sent
```

#### Scenario: Successfully reset password with valid token
```gherkin
Given I have a valid password reset token
And I am on the password reset page with the token
When I enter "NewSecurePass123!" in the new password field
And I enter "NewSecurePass123!" in the confirm password field
And I click the "Reset Password" button
Then I should see a success message "Password reset successful"
And I should be redirected to the login page
And I should be able to login with the new password
And the old password should no longer work
```

#### Scenario: Reset password fails with expired token
```gherkin
Given I have an expired password reset token
And I am on the password reset page with the token
When I enter "NewSecurePass123!" in the new password field
And I enter "NewSecurePass123!" in the confirm password field
And I click the "Reset Password" button
Then I should see an error message "Reset link has expired"
And I should see a link to "Request new reset link"
```

#### Scenario: Reset password fails with invalid token
```gherkin
Given I am on the password reset page with an invalid token
When I enter "NewSecurePass123!" in the new password field
And I enter "NewSecurePass123!" in the confirm password field
And I click the "Reset Password" button
Then I should see an error message "Invalid reset link"
And I should be redirected to the forgot password page
```

#### Scenario: Reset password fails with weak new password
```gherkin
Given I have a valid password reset token
And I am on the password reset page
When I enter "weak" in the new password field
And I enter "weak" in the confirm password field
And I click the "Reset Password" button
Then I should see password strength errors
And the password should not be reset
```

#### Scenario: Reset password fails with mismatched passwords
```gherkin
Given I have a valid password reset token
And I am on the password reset page
When I enter "NewSecurePass123!" in the new password field
And I enter "DifferentPass456!" in the confirm password field
And I click the "Reset Password" button
Then I should see an error message "Passwords do not match"
```

#### Scenario: Reset token can only be used once
```gherkin
Given I have a valid password reset token
When I successfully reset my password using the token
And I try to use the same token again
Then I should see an error message "Reset link has already been used"
And I should be directed to request a new link
```

#### Scenario: Multiple reset requests invalidate previous tokens
```gherkin
Given I request a password reset for "john@example.com"
And I receive a reset token "TOKEN1"
When I request another password reset for "john@example.com"
And I receive a new reset token "TOKEN2"
Then "TOKEN1" should be invalid
And only "TOKEN2" should work
```

## API Tests

#### Scenario: API sends password reset email
```gherkin
Given a user exists with email "john@example.com"
When I POST to "/api/auth/forgot-password" with:
  | email | john@example.com |
Then the response status should be 200
And an email should be queued for sending
And the email should contain a valid reset token
```

#### Scenario: API validates reset token
```gherkin
Given a valid reset token "VALID_TOKEN"
When I POST to "/api/auth/reset-password" with:
  | token       | VALID_TOKEN      |
  | newPassword | NewSecurePass123! |
Then the response status should be 200
And the password should be updated in the database
And the password should be properly hashed
```

#### Scenario: API rejects expired reset token
```gherkin
Given an expired reset token "EXPIRED_TOKEN"
When I POST to "/api/auth/reset-password" with:
  | token       | EXPIRED_TOKEN    |
  | newPassword | NewSecurePass123! |
Then the response status should be 400
And the response should contain error "Token expired"
```
