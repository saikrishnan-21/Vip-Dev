# VIP-10004: JWT Token Management - Test Specification

## Feature: JWT Token Management
As a system, I need to manage JWT tokens securely for user authentication and authorization

### Test Scenarios

#### Scenario: Generate valid JWT token on login
```gherkin
Given a user with email "john@example.com" logs in successfully
When the JWT token is generated
Then the token should contain userId claim
And the token should contain email claim
And the token should contain role claim
And the token should have an expiration time
And the token should be signed with the secret key
```

#### Scenario: Verify valid JWT token
```gherkin
Given I have a valid JWT token
When I make a request to "/api/user/profile" with the token
Then the request should be authenticated
And the user data should be accessible from the token
And the response status should be 200
```

#### Scenario: Reject expired JWT token
```gherkin
Given I have an expired JWT token
When I make a request to "/api/user/profile" with the token
Then the request should be rejected
And the response status should be 401
And the response should contain error "Token expired"
```

#### Scenario: Reject invalid JWT token
```gherkin
Given I have an invalid JWT token "INVALID.TOKEN.HERE"
When I make a request to "/api/user/profile" with the token
Then the request should be rejected
And the response status should be 401
And the response should contain error "Invalid token"
```

#### Scenario: Reject tampered JWT token
```gherkin
Given I have a valid JWT token
When I modify the payload of the token
And I make a request to "/api/user/profile" with the tampered token
Then the request should be rejected
And the response status should be 401
And the response should contain error "Token verification failed"
```

#### Scenario: Token refresh before expiration
```gherkin
Given I have a JWT token that expires in 5 minutes
When I make a request to "/api/auth/refresh" with the token
Then I should receive a new JWT token
And the new token should have a fresh expiration time
And the old token should still be valid until it expires
```

#### Scenario: Cannot refresh expired token
```gherkin
Given I have an expired JWT token
When I make a request to "/api/auth/refresh" with the token
Then the response status should be 401
And the response should contain error "Token expired. Please login again"
```

#### Scenario: Logout invalidates token
```gherkin
Given I am logged in with a valid token
When I POST to "/api/auth/logout" with the token
Then the response status should be 200
And the token should be added to a blacklist
When I try to use the same token for another request
Then the request should be rejected with "Token revoked"
```

#### Scenario: Token contains correct user role
```gherkin
Given I am logged in as an admin user
When I decode my JWT token
Then the role claim should be "admin"
Given I am logged in as a regular user
When I decode my JWT token
Then the role claim should be "user"
```

#### Scenario: Token payload does not contain sensitive data
```gherkin
Given any JWT token is generated
When I decode the token payload
Then it should NOT contain the password hash
And it should NOT contain the password reset token
And it should NOT contain sensitive user data
And it should only contain userId, email, role, and metadata
```

## API Tests

#### Scenario: API validates Authorization header format
```gherkin
When I make a request without Authorization header
Then the response status should be 401
When I make a request with malformed header "InvalidFormat"
Then the response status should be 401
When I make a request with "Bearer VALID_TOKEN"
Then the request should be processed
```

#### Scenario: API validates token expiration
```gherkin
Given a token issued 8 days ago with 7 day expiration
When I use the token for any authenticated endpoint
Then the response status should be 401
And the response should contain error "Token expired"
```

#### Scenario: API refresh endpoint updates token
```gherkin
Given I have a valid JWT token
When I POST to "/api/auth/refresh"
Then the response status should be 200
And I should receive a new token
And the new token should have updated issuedAt time
```
