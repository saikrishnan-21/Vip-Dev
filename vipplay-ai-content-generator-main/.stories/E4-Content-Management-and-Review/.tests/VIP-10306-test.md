# VIP-10306: Bulk Operations - Test Specification

## Feature: Bulk Operations on Content Items
Automated test specification for VIP-10306 - Bulk approve, reject, and delete operations

### Test Scenarios

#### Scenario: Select multiple content items with checkboxes
```gherkin
Given I am logged in as an authorized user
And I am on the content management page (/dashboard/content)
And there are multiple content items displayed
When I click the checkbox next to a content item
Then that item should be selected
And the selected count should display "1 selected"
When I click checkboxes for 3 more items
Then the selected count should display "4 selected"
And all 4 items should be visually highlighted
```

#### Scenario: Select all items on current page
```gherkin
Given I am on the content management page
And there are 5 content items displayed on the current page
When I click the "Select All" checkbox in the header
Then all 5 items should be selected
And the selected count should display "5 selected"
When I click "Select All" again
Then all items should be deselected
And the selected count should disappear or show "0 selected"
```

#### Scenario: Bulk action buttons appear when items are selected
```gherkin
Given I am on the content management page
And no items are selected
Then bulk action buttons should not be visible
When I select 2 content items
Then the bulk action buttons should appear: "Approve All", "Reject All", "Delete All"
And the selected count should display "2 selected"
When I deselect all items
Then the bulk action buttons should disappear
```

#### Scenario: Bulk approve multiple items
```gherkin
Given I am on the content management page
And I have selected 3 content items with status "review"
When I click the "Approve All" button
Then a confirmation dialog should appear: "Approve all 3 selected items?"
When I confirm the approval
Then a progress indicator should show "Processing 3 items..."
And the API endpoint POST /api/content/bulk-actions should be called with action="approve"
And all 3 items should be updated to status "approved"
And a success message should display: "3 items approved successfully"
And the list should refresh to show updated statuses
And all items should be deselected
```

#### Scenario: Bulk approve with partial failure
```gherkin
Given I am on the content management page
And I have selected 3 content items
And one item belongs to another user (unauthorized)
When I click "Approve All" and confirm
Then the API should process the request
And a message should display: "2 items approved, 1 failed"
And error details should show which item failed and why
And the successfully approved items should be updated
And failed items should remain unchanged
```

#### Scenario: Bulk reject with notes
```gherkin
Given I am on the content management page
And I have selected 4 content items
When I click the "Reject All" button
Then a rejection dialog should appear with a textarea for notes
And the dialog should show "Reject 4 selected items?"
And a character counter should display "0/500"
When I enter rejection notes: "Content needs improvement in structure and clarity"
Then the character counter should update to show "X/500"
And the submit button should be enabled (if >= 10 characters)
When I submit the rejection
Then a progress indicator should show "Processing 4 items..."
And the API endpoint POST /api/content/bulk-actions should be called with action="reject" and rejectionNotes
And all 4 items should be updated to status "rejected"
And the rejection notes should be saved to all items
And a success message should display: "4 items rejected successfully"
And the list should refresh
```

#### Scenario: Bulk reject validation - notes too short
```gherkin
Given I am on the content management page
And I have selected 2 content items
When I click "Reject All"
And I enter notes with only 5 characters: "Short"
Then the submit button should be disabled
And an error message should display: "Rejection notes must be at least 10 characters"
When I add more text to reach 10 characters
Then the submit button should be enabled
```

#### Scenario: Bulk reject validation - notes too long
```gherkin
Given I am on the content management page
And I have selected 2 content items
When I click "Reject All"
And I enter notes exceeding 500 characters
Then the character counter should show "501/500" in red
And the submit button should be disabled
And an error message should display: "Rejection notes must not exceed 500 characters"
When I reduce the text to 500 characters or less
Then the submit button should be enabled
```

#### Scenario: Bulk delete with confirmation
```gherkin
Given I am on the content management page
And I have selected 3 content items
When I click the "Delete All" button
Then a confirmation dialog should appear: "Delete 3 items permanently? This action cannot be undone."
When I confirm the deletion
Then a progress indicator should show "Processing 3 items..."
And the API endpoint POST /api/content/bulk-actions should be called with action="delete"
And all 3 items should be deleted from the database
And a success message should display: "3 items deleted successfully"
And the list should refresh (items should no longer appear)
And all items should be deselected
```

#### Scenario: Bulk delete cancellation
```gherkin
Given I am on the content management page
And I have selected 2 content items
When I click "Delete All"
And the confirmation dialog appears
When I click "Cancel" or close the dialog
Then no items should be deleted
And the items should remain selected
And the list should remain unchanged
```

#### Scenario: Progress indicator during bulk operation
```gherkin
Given I am on the content management page
And I have selected 5 content items
When I click "Approve All" and confirm
Then a progress indicator should appear showing "Processing 5 items..."
And the progress should update: "1/5 processed", "2/5 processed", etc.
And bulk action buttons should be disabled during processing
And checkboxes should be disabled during processing
When the operation completes
Then the progress indicator should disappear
And buttons should be re-enabled
```

#### Scenario: Maximum items limit (100 items)
```gherkin
Given I am on the content management page
And I have selected 101 content items (exceeds limit)
When I click "Approve All"
Then an error message should display: "Maximum 100 items per bulk operation"
And the operation should not proceed
And I should be prompted to select fewer items
```

#### Scenario: Bulk operation with no items selected
```gherkin
Given I am on the content management page
And no items are selected
When I try to click a bulk action button
Then the button should be disabled or not visible
And no operation should occur
```

#### Scenario: User isolation - cannot bulk operate on other users' content
```gherkin
Given I am logged in as user A
And I am on the content management page
And I select 2 items that belong to me
And I select 1 item that belongs to user B (somehow visible)
When I click "Approve All" and confirm
Then the API should validate all items belong to user A
And the response should indicate: "Some content items not found or access denied"
And no items should be modified
And an error message should display the validation failure
```

## API Tests

#### Scenario: API - successful bulk approve
```gherkin
Given I have a valid authentication token
And I have proper permissions
When I POST to /api/content/bulk-actions with:
  {
    "action": "approve",
    "contentIds": ["id1", "id2", "id3"]
  }
Then the response status should be 200 OK
And the response should contain:
  {
    "success": true,
    "action": "approve",
    "processed": 3,
    "failed": 0,
    "total": 3,
    "results": [
      { "contentId": "id1", "status": "success", "message": "Approved successfully" },
      { "contentId": "id2", "status": "success", "message": "Approved successfully" },
      { "contentId": "id3", "status": "success", "message": "Approved successfully" }
    ]
  }
And all 3 items should be updated to status "approved" in the database
```

#### Scenario: API - successful bulk reject with notes
```gherkin
Given I have a valid authentication token
When I POST to /api/content/bulk-actions with:
  {
    "action": "reject",
    "contentIds": ["id1", "id2"],
    "rejectionNotes": "Content needs significant improvement in structure and clarity"
  }
Then the response status should be 200 OK
And the response should contain processed: 2, failed: 0
And all 2 items should be updated to status "rejected"
And rejectionReason, rejectedAt, rejectedBy should be set for all items
```

#### Scenario: API - successful bulk delete
```gherkin
Given I have a valid authentication token
When I POST to /api/content/bulk-actions with:
  {
    "action": "delete",
    "contentIds": ["id1", "id2", "id3"]
  }
Then the response status should be 200 OK
And the response should contain processed: 3, failed: 0
And all 3 items should be deleted from the database
```

#### Scenario: API - validation error: invalid action
```gherkin
Given I have a valid authentication token
When I POST to /api/content/bulk-actions with:
  {
    "action": "invalid_action",
    "contentIds": ["id1"]
  }
Then the response status should be 400 Bad Request
And the response should contain: "Invalid action. Must be approve, reject, or delete"
```

#### Scenario: API - validation error: empty contentIds array
```gherkin
Given I have a valid authentication token
When I POST to /api/content/bulk-actions with:
  {
    "action": "approve",
    "contentIds": []
  }
Then the response status should be 400 Bad Request
And the response should contain: "ContentIds must be a non-empty array"
```

#### Scenario: API - validation error: exceeds max items (100)
```gherkin
Given I have a valid authentication token
And I have 101 content IDs
When I POST to /api/content/bulk-actions with all 101 IDs
Then the response status should be 400 Bad Request
And the response should contain: "Maximum 100 items per bulk operation"
```

#### Scenario: API - validation error: reject without notes
```gherkin
Given I have a valid authentication token
When I POST to /api/content/bulk-actions with:
  {
    "action": "reject",
    "contentIds": ["id1"],
    "rejectionNotes": ""
  }
Then the response status should be 400 Bad Request
And the response should contain: "Rejection notes are required for reject action"
```

#### Scenario: API - validation error: reject notes too short
```gherkin
Given I have a valid authentication token
When I POST to /api/content/bulk-actions with:
  {
    "action": "reject",
    "contentIds": ["id1"],
    "rejectionNotes": "Short"
  }
Then the response status should be 400 Bad Request
And the response should contain: "Rejection notes must be at least 10 characters"
```

#### Scenario: API - validation error: reject notes too long
```gherkin
Given I have a valid authentication token
And I have rejection notes exceeding 500 characters
When I POST to /api/content/bulk-actions with the long notes
Then the response status should be 400 Bad Request
And the response should contain: "Rejection notes must not exceed 500 characters"
```

#### Scenario: API - authentication required
```gherkin
Given I make a request without an authentication token
When I POST to /api/content/bulk-actions
Then the response status should be 401 Unauthorized
And the response should indicate authentication is required
```

#### Scenario: API - user isolation check
```gherkin
Given I am logged in as user A
And I have content IDs that belong to user B
When I POST to /api/content/bulk-actions with user B's content IDs
Then the response status should be 404 Not Found
And the response should contain: "Some content items not found or access denied"
And no items should be modified
```

#### Scenario: API - partial success handling
```gherkin
Given I have a valid authentication token
And I have 3 content IDs where 2 are valid and 1 will fail (e.g., database error)
When I POST to /api/content/bulk-actions with all 3 IDs
Then the response status should be 200 OK
And the response should contain:
  {
    "success": true,
    "processed": 2,
    "failed": 1,
    "results": [
      { "contentId": "id1", "status": "success" },
      { "contentId": "id2", "status": "success" },
      { "contentId": "id3", "status": "error", "message": "Error message" }
    ],
    "errors": [
      { "contentId": "id3", "error": "Error message" }
    ]
  }
```

## Performance Tests

#### Scenario: Bulk operation response time
```gherkin
Given normal system load
And I have selected 50 content items
When I perform a bulk approve operation
Then the response time should be under 5 seconds for 95th percentile
And the response time should be under 10 seconds for 99th percentile
```

## Security Tests

#### Scenario: XSS prevention in rejection notes
```gherkin
Given I am on the content management page
And I have selected content items
When I click "Reject All"
And I enter XSS payload: "<script>alert('XSS')</script>"
And I submit the rejection
Then the XSS should be properly escaped/sanitized
And no scripts should execute when the notes are displayed
```

#### Scenario: SQL injection prevention (MongoDB)
```gherkin
Given I submit content IDs with injection patterns
When the system processes the bulk operation
Then MongoDB should prevent injection
And no database errors should be exposed
```

## Notes
- All bulk operations must respect user isolation (userId check)
- Maximum 100 items per bulk operation to prevent DoS
- Progress indicator should update in real-time during processing
- Success/error messages should be clear and actionable
- Failed items should be clearly identified with error details
- UI should disable interactions during bulk operations to prevent conflicts
