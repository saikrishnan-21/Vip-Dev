# VIP-10006: Role-Based Access Control (RBAC) - Test Specification

## Feature: Role-Based Access Control
As a system, I need to enforce different permission levels based on user roles

### Test Scenarios

#### Scenario: User role can access user-level features
```gherkin
Given I am logged in with role "user"
When I navigate to "/content/create"
Then I should have access
When I navigate to "/content/my-content"
Then I should have access
When I try to access "/admin/users"
Then I should see "Access Denied"
And I should be redirected to the dashboard
```

#### Scenario: Editor role has additional permissions
```gherkin
Given I am logged in with role "editor"
When I navigate to "/content/review"
Then I should have access
When I try to approve content
Then the action should succeed
When I try to access "/admin/system-config"
Then I should see "Access Denied"
```

#### Scenario: Admin role has elevated permissions
```gherkin
Given I am logged in with role "admin"
When I navigate to "/admin/users"
Then I should have access
When I navigate to "/admin/content"
Then I should have access
When I try to access "/superadmin/ai-config"
Then I should see "Insufficient permissions"
```

#### Scenario: Superadmin role has full access
```gherkin
Given I am logged in with role "superadmin"
When I navigate to "/superadmin/ai-config"
Then I should have access
When I navigate to "/admin/users"
Then I should have access
When I navigate to any protected route
Then I should have access
```

#### Scenario: Unauthorized role cannot access protected endpoints
```gherkin
Given I am logged in with role "user"
When I try to DELETE "/api/admin/users/123"
Then the response status should be 403
And the response should contain "Insufficient permissions"
```

#### Scenario: Role-based UI elements visibility
```gherkin
Given I am logged in with role "user"
When I view the navigation menu
Then I should NOT see "User Management" link
And I should NOT see "System Configuration" link
And I should see "My Content" link
And I should see "Create Content" link
```

#### Scenario: Editor can see approval options
```gherkin
Given I am logged in with role "editor"
And I am viewing content in review status
Then I should see "Approve" button
And I should see "Reject" button
And I should see "Request Changes" button
```

#### Scenario: Admin can manage users
```gherkin
Given I am logged in with role "admin"
When I navigate to "/admin/users"
Then I should see a list of all users
And I should see "Deactivate" buttons
And I should see "Change Role" buttons
And I should be able to edit user information
```

#### Scenario: User cannot change own role
```gherkin
Given I am logged in with role "user"
When I try to PATCH "/api/user/profile" with:
  | role | admin |
Then the response status should be 403
And my role should remain "user"
```

#### Scenario: Admin can promote user to editor
```gherkin
Given I am logged in with role "admin"
And a user exists with role "user" and id "USER123"
When I PATCH "/api/admin/users/USER123" with:
  | role | editor |
Then the response status should be 200
And the user's role should be updated to "editor"
```

## API Tests

#### Scenario: API enforces role-based access
```gherkin
Given I have a valid token with role "user"
When I GET "/api/admin/users"
Then the response status should be 403
And the response should contain "Insufficient permissions"
```

#### Scenario: API allows admin access to admin endpoints
```gherkin
Given I have a valid token with role "admin"
When I GET "/api/admin/users"
Then the response status should be 200
And I should receive the users list
```

#### Scenario: API validates role from token claims
```gherkin
Given I have a tampered token with modified role claim
When I access any protected endpoint
Then the response status should be 401
And the response should contain "Invalid token"
```

#### Scenario: Middleware checks role before processing
```gherkin
Given the endpoint "/api/admin/users" requires "admin" role
When a user with role "user" attempts access
Then the middleware should reject before reaching the handler
And no database queries should be executed
```
