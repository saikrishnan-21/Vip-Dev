# VIP-10303: Inline Content Editor - Test Specification

## Feature: Inline Content Editor
Automated test specification for VIP-10303

### UI/Component Tests

#### Scenario: Enter edit mode for editable content
```gherkin
Given I am logged in as an authorized user
And I am viewing content details for content with status "review" or "approved"
When I click the "Edit" button in the detail view header
Then the content preview should be replaced with an edit form
And the title field should be editable with current value
And the content textarea should be editable with current value
And keywords should be displayed as removable badges
And "Save Changes" and "Discard" buttons should be visible
```

#### Scenario: Edit title field
```gherkin
Given I am in edit mode for a content item
When I modify the title field
Then the character counter should update showing "X/500"
And the unsaved changes indicator should appear
And the Save button should become enabled
And if I exceed 500 characters, validation should prevent saving
```

#### Scenario: Edit content field
```gherkin
Given I am in edit mode for a content item
When I modify the content textarea
Then the character counter should update showing "X/50,000"
And the unsaved changes indicator should appear
And the Save button should become enabled
And if content is less than 50 characters, validation should show error
And if content exceeds 50,000 characters, validation should prevent saving
```

#### Scenario: Add and remove keywords
```gherkin
Given I am in edit mode for a content item
When I type a keyword in the keywords input and press Enter
Then the keyword should be added as a badge
And the keyword counter should update showing "X/10"
And I can click the badge to remove the keyword
And if I try to add more than 10 keywords, the input should be disabled
And duplicate keywords should not be added
```

#### Scenario: Save changes successfully
```gherkin
Given I am in edit mode and have made changes
When I click the "Save Changes" button
Then a loading state should be shown ("Saving...")
And the API should be called with PATCH /api/content/[id]
And the request should include title, content, and keywords
And upon success, edit mode should exit
And the updated content should be displayed
And the unsaved changes indicator should disappear
And lastEditedBy and updatedAt should be updated
```

#### Scenario: Discard changes
```gherkin
Given I am in edit mode and have made unsaved changes
When I click the "Discard" button
Then a confirmation dialog should appear: "Discard unsaved changes?"
When I confirm the dialog
Then all changes should be reverted to original values
And edit mode should exit
And the original content should be displayed
```

#### Scenario: Cannot edit published content
```gherkin
Given I am viewing content details for content with status "published"
When I view the detail panel
Then the Edit button should be disabled
And the button should show tooltip: "Published articles cannot be edited"
And if I try to edit via API directly, I should receive 400 error
```

#### Scenario: Cannot edit archived content
```gherkin
Given I am viewing content details for content with status "archived"
When I view the detail panel
Then the Edit button should be disabled
And edit mode should not be accessible
```

#### Scenario: Unsaved changes indicator
```gherkin
Given I am in edit mode
When I make any change to title, content, or keywords
Then a yellow warning banner should appear: "You have unsaved changes"
And the banner should persist until I save or discard
And the Save button should be enabled only when there are actual changes
```

#### Scenario: Validation errors display
```gherkin
Given I am in edit mode
When I try to save with empty title
Then an error message should display: "Title is required"
And the error should be shown in a red banner
And the save operation should not proceed
When I fix the title but content is less than 50 characters
Then an error message should display: "Content must be at least 50 characters"
And the save operation should not proceed
```

#### Scenario: Edit mode preserves original data
```gherkin
Given I am viewing content details
When I enter edit mode
Then the edit form should be pre-populated with current values
And title should match the original title
And content should match the original content
And keywords should match the original keywords array
```

### API Tests

#### Scenario: PATCH /api/content/[id] - successful edit
```gherkin
Given I have a valid JWT token
And I have content with status "review" or "approved" that belongs to me
When I make a PATCH request to /api/content/[id] with valid title, content, keywords
Then the response status should be 200 OK
And the response should include updated content
And updatedAt should be set to current timestamp
And lastEditedBy should be set to my user ID
And the content should be updated in the database
```

#### Scenario: PATCH /api/content/[id] - cannot edit published content
```gherkin
Given I have a valid JWT token
And I have content with status "published" that belongs to me
When I make a PATCH request to /api/content/[id]
Then the response status should be 400 Bad Request
And the error message should indicate: "Cannot edit published content"
And no changes should be made to the database
```

#### Scenario: PATCH /api/content/[id] - cannot edit other user's content
```gherkin
Given I have a valid JWT token for User A
And User B has content that I try to edit
When I make a PATCH request to /api/content/[UserBContentId]
Then the response status should be 404 Not Found
And no changes should be made to User B's content
And the error should not reveal that the content exists
```

#### Scenario: PATCH /api/content/[id] - validation errors
```gherkin
Given I have a valid JWT token
When I make a PATCH request with title exceeding 500 characters
Then the response status should be 400 Bad Request
And the error should indicate title length violation
When I make a PATCH request with content less than 50 characters
Then the response status should be 400 Bad Request
And the error should indicate content length violation
```

#### Scenario: PATCH /api/content/[id] - no changes made
```gherkin
Given I have a valid JWT token
And I have editable content
When I make a PATCH request with the same values (no actual changes)
Then the response status should be 400 Bad Request
And the error message should indicate: "No changes made"
And no database update should occur
```

### Negative Test Cases

#### Scenario: Edit with invalid content ID
```gherkin
Given I am in edit mode
When I try to save with an invalid content ID format
Then the API should return 400 Bad Request
And the error should indicate "Invalid content ID"
And no changes should be saved
```

#### Scenario: Network error during save
```gherkin
Given I am in edit mode and have made changes
And the network request fails
When I click "Save Changes"
Then an error message should display: "Failed to save changes"
And edit mode should remain active
And changes should not be lost
And I should be able to retry saving
```

#### Scenario: Concurrent edit attempts
```gherkin
Given I am editing content
And another user edits the same content simultaneously
When I save my changes
Then the save should succeed
And my changes should overwrite the other user's changes
And no merge conflict handling is required (last write wins)
```

#### Scenario: Edit with XSS payload in content
```gherkin
Given I am in edit mode
When I enter XSS payload: "<script>alert('xss')</script>" in the content field
And I save the changes
Then the content should be saved as-is
And when displayed, the script should be escaped
And no JavaScript should execute
```

#### Scenario: Edit with extremely long content
```gherkin
Given I am in edit mode
When I paste content that exceeds 50,000 characters
Then the textarea should enforce maxLength={50000}
And I should not be able to type beyond the limit
And validation should prevent saving if limit is exceeded
```

#### Scenario: Rapid edit mode toggling
```gherkin
Given I am viewing content details
When I rapidly toggle edit mode on and off multiple times
Then no errors should occur
And the UI should remain responsive
And data should not be corrupted
```

#### Scenario: Edit with special characters and unicode
```gherkin
Given I am in edit mode
When I enter special characters: "!@#$%^&*()" and unicode: "你好世界"
And I save the changes
Then the content should be saved correctly
And special characters should be preserved
And unicode should display correctly
```

#### Scenario: Edit keywords with duplicates
```gherkin
Given I am in edit mode
When I try to add the same keyword twice
Then the duplicate keyword should not be added
And the keyword list should remain unique
And no error should occur
```

#### Scenario: Edit with empty keywords array
```gherkin
Given I am in edit mode
When I remove all keywords
And I save the changes
Then the save should succeed
And keywords should be saved as an empty array
And no validation error should occur
```

#### Scenario: Edit mode timeout or session expiry
```gherkin
Given I am in edit mode with unsaved changes
And my session expires
When I try to save
Then I should receive a 401 Unauthorized error
And I should be redirected to login
And my unsaved changes should be lost
```

#### Scenario: Validation - invalid input handling
```gherkin
Given I am on the relevant page/endpoint
When I submit invalid or incomplete data
Then I should see clear validation error messages
And the error messages should guide me to correct the input
And no partial changes should be saved
And the form/UI should remain in a consistent state
```

#### Scenario: Authorization - permission check
```gherkin
Given I am logged in with insufficient permissions
When I attempt to access this feature
Then I should receive an "Access Denied" or 403 error
And I should not be able to view sensitive data
And no unauthorized actions should be permitted
```

#### Scenario: Edge cases - boundary conditions
```gherkin
Given I am testing boundary conditions
When I provide edge case inputs (empty, null, maximum length, special characters)
Then the system should handle them gracefully
And appropriate error messages or warnings should appear
And the system should remain stable
```

#### Scenario: Error handling - system failures
```gherkin
Given a system dependency is unavailable
When I attempt to use this feature
Then I should see a user-friendly error message
And the error should be logged for debugging
And the system should provide recovery options if available
```

## API Tests

#### Scenario: API - successful request
```gherkin
Given I have a valid authentication token
And I have proper permissions
When I make the API request with valid data
Then the response status should be 2xx (success)
And the response should contain the expected data structure
And the response should include all required fields
```

#### Scenario: API - authentication required
```gherkin
Given I make a request without an authentication token
When I access this API endpoint
Then the response status should be 401 Unauthorized
And the response should indicate authentication is required
```

#### Scenario: API - authorization check
```gherkin
Given I have a valid token but insufficient permissions
When I access this API endpoint
Then the response status should be 403 Forbidden
And the response should indicate insufficient permissions
```

#### Scenario: API - validation errors
```gherkin
Given I make a request with invalid data
When the API processes the request
Then the response status should be 400 Bad Request
And the response should include detailed validation errors
And each error should specify the field and issue
```

#### Scenario: API - rate limiting
```gherkin
Given rate limiting is enabled
When I exceed the rate limit
Then the response status should be 429 Too Many Requests
And the response should include retry-after header
```

## Performance Tests

#### Scenario: Response time
```gherkin
Given normal system load
When I perform this operation
Then the response time should be under 2 seconds for 95th percentile
And the response time should be under 5 seconds for 99th percentile
```

## Security Tests

#### Scenario: SQL injection prevention
```gherkin
Given I submit input with SQL injection patterns
When the system processes the input
Then the SQL injection should be prevented
And no database errors should be exposed
```

#### Scenario: XSS prevention
```gherkin
Given I submit input with XSS payloads
When the content is displayed
Then the XSS should be properly escaped/sanitized
And no scripts should execute
```

## Notes
- Review and enhance this specification with feature-specific scenarios
- Add integration tests for third-party dependencies
- Include accessibility tests (WCAG 2.1 AA compliance)
- Add mobile responsiveness tests if applicable
- Consider adding load tests for critical paths
