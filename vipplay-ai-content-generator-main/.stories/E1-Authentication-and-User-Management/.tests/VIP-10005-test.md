# VIP-10005: User Profile Management - Test Specification

## Feature: User Profile Management
As a logged-in user, I want to view and update my profile information

### Test Scenarios

#### Scenario: View own profile
```gherkin
Given I am logged in as "john@example.com"
When I navigate to "/profile"
Then I should see my email "john@example.com"
And I should see my first name "John"
And I should see my last name "Doe"
And I should see my role "user"
And I should see my account creation date
```

#### Scenario: Update profile successfully
```gherkin
Given I am logged in and on my profile page
When I change my first name to "Jonathan"
And I change my last name to "Smith"
And I click the "Save Changes" button
Then I should see a success message "Profile updated successfully"
And my first name should be "Jonathan"
And my last name should be "Smith"
And the header should show "Jonathan Smith"
```

#### Scenario: Update email successfully
```gherkin
Given I am logged in with email "john@example.com"
And I am on my profile page
When I change my email to "john.new@example.com"
And I enter my current password for verification
And I click the "Update Email" button
Then I should see a success message "Email updated. Please verify your new email"
And a verification email should be sent to "john.new@example.com"
And my email should remain "john@example.com" until verified
```

#### Scenario: Cannot update email to existing email
```gherkin
Given I am logged in as "john@example.com"
And another user exists with email "existing@example.com"
When I try to change my email to "existing@example.com"
And I enter my current password
And I click the "Update Email" button
Then I should see an error "Email already in use"
And my email should remain unchanged
```

#### Scenario: Update profile with invalid data
```gherkin
Given I am logged in and on my profile page
When I clear the first name field
And I click the "Save Changes" button
Then I should see an error "First name is required"
And the changes should not be saved
```

#### Scenario: Profile shows last login information
```gherkin
Given I am logged in
When I view my profile page
Then I should see "Last login" with a timestamp
And the timestamp should match my current login time
```

#### Scenario: View account statistics
```gherkin
Given I am logged in and have created 5 articles
And I have 3 published articles
When I view my profile page
Then I should see "Total Content: 5"
And I should see "Published: 3"
And I should see "Drafts: 2"
```

## API Tests

#### Scenario: API returns user profile
```gherkin
Given I am logged in with a valid token
When I GET "/api/user/profile"
Then the response status should be 200
And the response should contain userId
And the response should contain email
And the response should NOT contain password
```

#### Scenario: API updates user profile
```gherkin
Given I am logged in with a valid token
When I PATCH "/api/user/profile" with:
  | firstName | Jonathan |
  | lastName  | Smith    |
Then the response status should be 200
And the database should be updated with new values
```

#### Scenario: API requires authentication for profile access
```gherkin
When I GET "/api/user/profile" without authentication
Then the response status should be 401
```
