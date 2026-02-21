# VIP-10001: User Registration - Test Specification

## Feature: User Registration
As a new user, I want to register for an account so that I can access the VIPContentAI platform

### Test Scenarios

#### Scenario: Successful user registration with valid details
```gherkin
Given I am on the registration page
When I enter "john.doe@example.com" in the email field
And I enter "John" in the first name field
And I enter "Doe" in the last name field
And I enter "SecurePass123!" in the password field
And I enter "SecurePass123!" in the confirm password field
And I click the "Register" button
Then I should see a success message "Registration successful"
And I should be redirected to the login page
And I should receive a verification email at "john.doe@example.com"
```

#### Scenario: Registration fails with existing email
```gherkin
Given I am on the registration page
And a user with email "existing@example.com" already exists
When I enter "existing@example.com" in the email field
And I enter "Jane" in the first name field
And I enter "Smith" in the last name field
And I enter "SecurePass123!" in the password field
And I enter "SecurePass123!" in the confirm password field
And I click the "Register" button
Then I should see an error message "Email already registered"
And I should remain on the registration page
```

#### Scenario: Registration fails with invalid email format
```gherkin
Given I am on the registration page
When I enter "invalid-email" in the email field
And I enter "John" in the first name field
And I enter "Doe" in the last name field
And I enter "SecurePass123!" in the password field
And I enter "SecurePass123!" in the confirm password field
And I click the "Register" button
Then I should see an error message "Invalid email format"
And the email field should be highlighted
```

#### Scenario: Registration fails with weak password
```gherkin
Given I am on the registration page
When I enter "john@example.com" in the email field
And I enter "John" in the first name field
And I enter "Doe" in the last name field
And I enter "weak" in the password field
And I enter "weak" in the confirm password field
And I click the "Register" button
Then I should see an error message "Password must be at least 8 characters"
And I should see an error message "Password must contain uppercase letters"
And I should see an error message "Password must contain numbers"
And I should see an error message "Password must contain special characters"
```

#### Scenario: Registration fails with mismatched passwords
```gherkin
Given I am on the registration page
When I enter "john@example.com" in the email field
And I enter "John" in the first name field
And I enter "Doe" in the last name field
And I enter "SecurePass123!" in the password field
And I enter "DifferentPass456!" in the confirm password field
And I click the "Register" button
Then I should see an error message "Passwords do not match"
And both password fields should be highlighted
```

#### Scenario: Registration fails with missing required fields
```gherkin
Given I am on the registration page
When I click the "Register" button without filling any fields
Then I should see an error message "Email is required"
And I should see an error message "First name is required"
And I should see an error message "Last name is required"
And I should see an error message "Password is required"
And all required fields should be highlighted
```

#### Scenario: Password strength indicator shows appropriate strength
```gherkin
Given I am on the registration page
When I enter "weak" in the password field
Then the password strength indicator should show "Weak" in red
When I enter "Better123" in the password field
Then the password strength indicator should show "Medium" in yellow
When I enter "Strong123!@#" in the password field
Then the password strength indicator should show "Strong" in green
```

#### Scenario: Show/hide password functionality works
```gherkin
Given I am on the registration page
When I enter "SecurePass123!" in the password field
Then the password should be masked with dots
When I click the "Show password" icon
Then the password should be visible as "SecurePass123!"
When I click the "Hide password" icon
Then the password should be masked with dots again
```

#### Scenario: Email validation happens on blur
```gherkin
Given I am on the registration page
When I enter "invalid-email" in the email field
And I move focus to the next field
Then I should see an inline error "Invalid email format"
When I clear the email field
And I enter "valid@example.com"
And I move focus to the next field
Then the inline error should disappear
```

#### Scenario: Registration with special characters in name
```gherkin
Given I am on the registration page
When I enter "jean-paul@example.com" in the email field
And I enter "Jean-Paul" in the first name field
And I enter "O'Brien" in the last name field
And I enter "SecurePass123!" in the password field
And I enter "SecurePass123!" in the confirm password field
And I click the "Register" button
Then I should see a success message "Registration successful"
```

## API Tests

#### Scenario: API returns 201 on successful registration
```gherkin
Given I have valid registration data
When I POST to "/api/auth/register" with:
  | email         | john@example.com |
  | firstName     | John             |
  | lastName      | Doe              |
  | password      | SecurePass123!   |
Then the response status should be 201
And the response should contain "userId"
And the response should contain "email" with value "john@example.com"
And the password should be hashed in the database
```

#### Scenario: API returns 409 for duplicate email
```gherkin
Given a user with email "existing@example.com" exists
When I POST to "/api/auth/register" with:
  | email         | existing@example.com |
  | firstName     | John                 |
  | lastName      | Doe                  |
  | password      | SecurePass123!       |
Then the response status should be 409
And the response should contain error "Email already registered"
```

#### Scenario: API validates required fields
```gherkin
When I POST to "/api/auth/register" with empty body
Then the response status should be 400
And the response should contain validation errors for "email"
And the response should contain validation errors for "firstName"
And the response should contain validation errors for "lastName"
And the response should contain validation errors for "password"
```
