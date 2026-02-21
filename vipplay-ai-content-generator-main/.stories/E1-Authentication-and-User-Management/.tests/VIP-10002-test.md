# VIP-10002: User Login - Test Specification

## Feature: User Login
As a registered user, I want to log in to my account so that I can access the platform features

### Test Scenarios

#### Scenario: Successful login with valid credentials
```gherkin
Given I am on the login page
And a user exists with email "john@example.com" and password "SecurePass123!"
When I enter "john@example.com" in the email field
And I enter "SecurePass123!" in the password field
And I click the "Login" button
Then I should see a success message "Login successful"
And I should be redirected to the dashboard
And I should see my name "John Doe" in the header
And a JWT token should be stored in localStorage
```

#### Scenario: Login fails with incorrect password
```gherkin
Given I am on the login page
And a user exists with email "john@example.com"
When I enter "john@example.com" in the email field
And I enter "WrongPassword123!" in the password field
And I click the "Login" button
Then I should see an error message "Invalid email or password"
And I should remain on the login page
And no token should be stored
```

#### Scenario: Login fails with non-existent email
```gherkin
Given I am on the login page
When I enter "nonexistent@example.com" in the email field
And I enter "SecurePass123!" in the password field
And I click the "Login" button
Then I should see an error message "Invalid email or password"
And I should remain on the login page
```

#### Scenario: Login fails with empty credentials
```gherkin
Given I am on the login page
When I click the "Login" button without entering credentials
Then I should see an error message "Email is required"
And I should see an error message "Password is required"
And the email field should be highlighted
And the password field should be highlighted
```

#### Scenario: Login fails for inactive account
```gherkin
Given I am on the login page
And a user exists with email "inactive@example.com" but is marked as inactive
When I enter "inactive@example.com" in the email field
And I enter "SecurePass123!" in the password field
And I click the "Login" button
Then I should see an error message "Account is inactive. Please contact support."
And I should remain on the login page
```

#### Scenario: Remember me checkbox persists session
```gherkin
Given I am on the login page
And a user exists with email "john@example.com"
When I enter "john@example.com" in the email field
And I enter "SecurePass123!" in the password field
And I check the "Remember me" checkbox
And I click the "Login" button
Then I should be logged in successfully
And the JWT token should have an extended expiration time
When I close the browser and reopen it
Then I should still be logged in
```

#### Scenario: Without remember me, session is shorter
```gherkin
Given I am on the login page
And a user exists with email "john@example.com"
When I enter "john@example.com" in the email field
And I enter "SecurePass123!" in the password field
And I do NOT check the "Remember me" checkbox
And I click the "Login" button
Then I should be logged in successfully
And the JWT token should have a standard expiration time
```

#### Scenario: Login redirect to intended page after authentication
```gherkin
Given I am not logged in
When I try to access "/content/create" directly
Then I should be redirected to the login page
And the URL should contain "redirect=/content/create"
When I enter "john@example.com" in the email field
And I enter "SecurePass123!" in the password field
And I click the "Login" button
Then I should be redirected to "/content/create"
```

#### Scenario: Show/hide password toggle works
```gherkin
Given I am on the login page
When I enter "SecurePass123!" in the password field
Then the password should be masked
When I click the "Show password" icon
Then the password should be visible as "SecurePass123!"
When I click the "Hide password" icon
Then the password should be masked again
```

#### Scenario: Login form prevents multiple submissions
```gherkin
Given I am on the login page
When I enter "john@example.com" in the email field
And I enter "SecurePass123!" in the password field
And I click the "Login" button
Then the login button should be disabled
And I should see a loading indicator
When the login completes
Then the button should be enabled again
```

#### Scenario: Rate limiting prevents brute force attempts
```gherkin
Given I am on the login page
When I attempt to login with wrong credentials 5 times
Then I should see an error message "Too many login attempts"
And the login button should be disabled for 15 minutes
And I should see a message "Please try again in 15 minutes"
```

## API Tests

#### Scenario: API returns JWT token on successful login
```gherkin
Given a user exists with email "john@example.com" and password "SecurePass123!"
When I POST to "/api/auth/login" with:
  | email    | john@example.com |
  | password | SecurePass123!   |
Then the response status should be 200
And the response should contain "token"
And the response should contain "user" with email "john@example.com"
And the token should be a valid JWT
And the token should contain userId claim
```

#### Scenario: API returns 401 for invalid credentials
```gherkin
When I POST to "/api/auth/login" with:
  | email    | john@example.com  |
  | password | WrongPassword123! |
Then the response status should be 401
And the response should contain error "Invalid credentials"
And no token should be returned
```

#### Scenario: API validates required fields
```gherkin
When I POST to "/api/auth/login" with empty body
Then the response status should be 400
And the response should contain validation errors for "email"
And the response should contain validation errors for "password"
```

#### Scenario: API token expires after configured time
```gherkin
Given I have a valid JWT token issued 8 days ago
When I make a request to "/api/user/profile" with expired token
Then the response status should be 401
And the response should contain error "Token expired"
```

#### Scenario: API prevents SQL injection in login
```gherkin
When I POST to "/api/auth/login" with:
  | email    | admin'-- |
  | password | anything |
Then the response status should be 401
And no SQL error should be thrown
And the input should be sanitized
```
