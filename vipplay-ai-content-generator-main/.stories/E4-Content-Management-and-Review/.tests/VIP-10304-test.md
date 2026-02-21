# VIP-10304: Approve Content Workflow - Test Specification

## Feature: Approve Content Workflow
Automated test specification for VIP-10304

### UI/Component Tests

#### Scenario: Approve pending content
```gherkin
Given I am logged in as an authorized user
And I am viewing content details for content with status "pending" or "review"
When I click the "Approve Article" button
Then a confirmation dialog should appear
And the dialog should show: "Approve Article" title
And the dialog should show: "Are you sure you want to approve this article?"
When I confirm the approval
Then the API should be called with POST /api/content/[id]/approve
And the request body should include: { action: "approve" }
And the content status should change to "approved"
And a success toast should appear
And the content list should refresh
And the detail view should show "approved" status badge
```

#### Scenario: Approve rejected content (re-approve)
```gherkin
Given I am viewing content details for content with status "rejected"
When I click the "Approve Article" button
Then a confirmation dialog should appear
When I confirm the approval
Then the content status should change from "rejected" to "approved"
And approvedAt and approvedBy should be set
And rejectionReason should be cleared
And a success toast should appear
```

#### Scenario: Approve button visibility
```gherkin
Given I am viewing content details
When the content status is "pending", "review", or "rejected"
Then the "Approve Article" button should be visible
When the content status is "approved" or "published"
Then the "Approve Article" button should not be visible
When the content status is "archived"
Then the "Approve Article" button should not be visible
```

#### Scenario: Confirmation dialog content
```gherkin
Given I click the "Approve Article" button
When the confirmation dialog appears
Then the dialog title should be "Approve Article"
And the dialog description should mention the article will be ready for export
And there should be "Cancel" and "Approve" buttons
And clicking "Cancel" should close the dialog without changes
```

#### Scenario: Loading state during approval
```gherkin
Given I have confirmed the approval dialog
When the API request is in progress
Then the approve button should show loading state
And the button should be disabled
And no other actions should be possible
And once complete, the loading state should clear
```

#### Scenario: Real-time list update after approval
```gherkin
Given I have approved content from the detail view
When the approval completes successfully
Then the content list should automatically refresh
And the approved content should show "approved" status badge
And the content should move to the approved filter if active
And the status summary cards should update
```

### API Tests

#### Scenario: POST /api/content/[id]/approve - successful approval
```gherkin
Given I have a valid JWT token
And I have content with status "pending", "review", or "rejected" that belongs to me
When I make a POST request to /api/content/[id]/approve with { action: "approve" }
Then the response status should be 200 OK
And the response should include success: true
And the response should include updated content object
And the content status should be "approved"
And approvedAt should be set to current timestamp
And approvedBy should be set to my user ID
And updatedAt should be updated
And lastEditedBy should be set to my user ID
```

#### Scenario: POST /api/content/[id]/approve - cannot approve already approved content
```gherkin
Given I have a valid JWT token
And I have content with status "approved" that belongs to me
When I make a POST request to /api/content/[id]/approve
Then the response status should be 400 Bad Request
And the error message should indicate content cannot be approved
And no changes should be made to the database
```

#### Scenario: POST /api/content/[id]/approve - cannot approve published content
```gherkin
Given I have a valid JWT token
And I have content with status "published" that belongs to me
When I make a POST request to /api/content/[id]/approve
Then the response status should be 400 Bad Request
And the error message should indicate content cannot be approved
And no changes should be made to the database
```

#### Scenario: POST /api/content/[id]/approve - user isolation
```gherkin
Given I have a valid JWT token for User A
And User B has content that I try to approve
When I make a POST request to /api/content/[UserBContentId]/approve
Then the response status should be 404 Not Found
And no changes should be made to User B's content
And the error should not reveal that the content exists
```

#### Scenario: POST /api/content/[id]/approve - invalid action
```gherkin
Given I have a valid JWT token
When I make a POST request with { action: "invalid" }
Then the response status should be 400 Bad Request
And the error message should indicate invalid action
And no changes should be made
```

#### Scenario: POST /api/content/[id]/approve - missing action
```gherkin
Given I have a valid JWT token
When I make a POST request without action field
Then the response status should be 400 Bad Request
And the error message should indicate action is required
```

### Negative Test Cases

#### Scenario: Approve with invalid content ID
```gherkin
Given I am logged in
When I try to approve content with invalid ID format: "invalid-id"
Then the API should return 400 Bad Request
And the error should indicate "Invalid content ID"
And no approval should occur
```

#### Scenario: Network error during approval
```gherkin
Given I have confirmed the approval dialog
And the network request fails
When the request completes
Then an error toast should display: "Failed to approve article"
And the content status should remain unchanged
And I should be able to retry the approval
```

#### Scenario: Approve with expired token
```gherkin
Given I have an expired JWT token
When I try to approve content
Then the API should return 401 Unauthorized
And the error should indicate "Invalid token"
And I should be redirected to login
```

#### Scenario: Approve content that doesn't exist
```gherkin
Given I have a valid JWT token
When I try to approve content with non-existent ID
Then the API should return 404 Not Found
And the error should indicate "Content not found"
And no database changes should occur
```

#### Scenario: Rapid approval clicks
```gherkin
Given I am viewing content details
When I rapidly click the "Approve" button multiple times
Then only one API request should be made
And duplicate approvals should be prevented
And no errors should occur
```

#### Scenario: Approve while content is being edited
```gherkin
Given I am in edit mode for content
And I have unsaved changes
When I try to approve the content
Then the approval should proceed (if status allows)
And unsaved changes should be lost
And the content should be approved with last saved version
```

#### Scenario: Approve with concurrent status change
```gherkin
Given I have content with status "review"
And another process changes the status to "approved" simultaneously
When I try to approve the content
Then the API should handle the race condition gracefully
And either succeed or return appropriate error
And no data corruption should occur
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
