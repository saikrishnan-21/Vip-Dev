# VIP-10008: User Logout - Test Specification

## Feature: User Logout
As a logged-in user, I want to securely log out of my account

### Test Scenarios

#### Scenario: Successful logout
```gherkin
Given I am logged in as "john@example.com"
And I am on the dashboard
When I click the user menu
And I click "Logout"
Then I should see "Logged out successfully"
And I should be redirected to the login page
And my JWT token should be removed from localStorage
And I should not be able to access protected pages
```

#### Scenario: Logout clears all session data
```gherkin
Given I am logged in
And I have session data stored
When I logout
Then localStorage should be cleared
And sessionStorage should be cleared
And any cached user data should be removed
```

#### Scenario: Cannot access protected routes after logout
```gherkin
Given I was logged in and have logged out
When I try to navigate to "/content/create"
Then I should be redirected to "/login"
And I should see "Please login to continue"
```

#### Scenario: Logout from multiple devices
```gherkin
Given I am logged in on Device A
And I am logged in on Device B with the same account
When I logout from Device A
Then I should be logged out on Device A
And I should still be logged in on Device B
```

#### Scenario: Global logout from all devices
```gherkin
Given I am logged in on multiple devices
And I am on the account security page
When I click "Logout from all devices"
And I confirm the action
Then all my active sessions should be invalidated
And all devices should require re-login
```

#### Scenario: Logout button visible when logged in
```gherkin
Given I am logged in
When I view any page
Then I should see a user menu icon
And the menu should contain a "Logout" option
```

#### Scenario: Logout with confirmation dialog
```gherkin
Given I am logged in
And I have unsaved changes on the current page
When I click "Logout"
Then I should see a confirmation dialog "You have unsaved changes. Are you sure?"
When I click "Cancel"
Then I should remain logged in
When I click "Logout" again and confirm
Then I should be logged out
```

#### Scenario: Auto-logout after token expiration
```gherkin
Given I am logged in
And my session token expires
When I try to perform any action
Then I should see "Session expired. Please login again"
And I should be redirected to the login page
And a logout should be triggered automatically
```

#### Scenario: Logout endpoint invalidates token
```gherkin
Given I am logged in with token "VALID_TOKEN"
When I POST to "/api/auth/logout"
Then the token should be added to blacklist
When I try to use "VALID_TOKEN" for any request
Then the response status should be 401
And the response should contain "Token revoked"
```

#### Scenario: Remember logout preference
```gherkin
Given I am logged in
When I check "Logout from all devices"
And I logout
Then all my tokens should be invalidated
And any "Remember me" settings should be cleared
```

## API Tests

#### Scenario: API logout endpoint invalidates token
```gherkin
Given I have a valid JWT token
When I POST to "/api/auth/logout" with the token
Then the response status should be 200
And the token should be blacklisted
And subsequent requests with this token should fail
```

#### Scenario: API logout requires authentication
```gherkin
When I POST to "/api/auth/logout" without a token
Then the response status should be 401
```

#### Scenario: API logout all devices
```gherkin
Given I have multiple active tokens for user "USER123"
When I POST to "/api/auth/logout-all" with:
  | userId | USER123 |
Then the response status should be 200
And all tokens for "USER123" should be blacklisted
```

#### Scenario: Blacklisted tokens are not accepted
```gherkin
Given a token is blacklisted
When I use it to access "/api/user/profile"
Then the response status should be 401
And the response should contain "Token revoked"
```

#### Scenario: Token blacklist is checked on all protected routes
```gherkin
Given a blacklisted token
When I try to access any of these endpoints:
  | /api/content/create |
  | /api/user/profile   |
  | /api/media/upload   |
Then all requests should return 401
And all should contain "Token revoked"
```
