# VIP-10101: Add RSS Feed Source - Test Specification

## Feature: Add RSS Feed Source
Comprehensive test specification for VIP-10101 with 38 detailed scenarios

---

## UI/UX Tests

### Scenario 1: Access Add RSS Feed dialog from dropdown
```gherkin
Given I am logged in and on the Knowledge Base page
When I click the "Add Source" button
And I click "RSS Feed" from the dropdown menu
Then the "Add RSS Feed" dialog should open
And I should see three input fields: "Feed Name", "Feed URL", "Description"
And I should see "Cancel" and "Add Feed" buttons
```

### Scenario 2: All form fields are present with correct labels
```gherkin
Given the Add RSS Feed dialog is open
Then I should see "Feed Name" label with a required asterisk (*)
And I should see "Feed URL" label with a required asterisk (*)
And I should see "Description" label with "(Optional)" text
And the placeholders should match: "ESPN Fantasy Football", "https://example.com/feed.xml", "Latest fantasy football news..."
```

### Scenario 3: Successfully add RSS feed with all fields
```gherkin
Given the Add RSS Feed dialog is open
When I enter "ESPN Fantasy Football" in the Feed Name field
And I enter "https://www.espn.com/espn/rss/news" in the Feed URL field
And I enter "Latest ESPN fantasy football news" in the Description field
And I click the "Add Feed" button
Then I should see a loading spinner with "Adding..." text
And the dialog should close automatically
And I should see a success toast: "RSS Feed Added - Successfully added ESPN Fantasy Football"
And the form fields should be cleared for next use
```

### Scenario 4: Successfully add RSS feed with minimum required fields
```gherkin
Given the Add RSS Feed dialog is open
When I enter "Fantasy News" in the Feed Name field
And I enter "https://example.com/feed.xml" in the Feed URL field
And I leave the Description field empty
And I click the "Add Feed" button
Then the RSS feed should be created successfully
And I should see a success toast notification
```

### Scenario 5: Cancel adding RSS feed
```gherkin
Given the Add RSS Feed dialog is open
And I have entered data in the form fields
When I click the "Cancel" button
Then the dialog should close
And no API request should be made
And the entered data should not be saved
```

---

## Validation Tests

### Scenario 6: Required field validation - missing Feed Name
```gherkin
Given the Add RSS Feed dialog is open
When I leave the Feed Name field empty
And I enter a valid URL in the Feed URL field
And I click the "Add Feed" button
Then the browser should show HTML5 validation error for Feed Name
And the form should not be submitted
```

### Scenario 7: Required field validation - missing Feed URL
```gherkin
Given the Add RSS Feed dialog is open
When I enter "Test Feed" in the Feed Name field
And I leave the Feed URL field empty
And I click the "Add Feed" button
Then the browser should show HTML5 validation error for Feed URL
And the form should not be submitted
```

### Scenario 8: Name minimum length validation
```gherkin
Given the Add RSS Feed dialog is open
When I enter "A" (1 character) in the Feed Name field
And I enter a valid URL in the Feed URL field
And I click the "Add Feed" button
Then the browser should show HTML5 minLength validation error
And the error should indicate minimum 2 characters required
```

### Scenario 9: Invalid URL format validation
```gherkin
Given the Add RSS Feed dialog is open
When I enter "My Feed" in the Feed Name field
And I enter "not-a-valid-url" in the Feed URL field
And I click the "Add Feed" button
Then the browser should show HTML5 URL validation error
And the form should not be submitted
```

### Scenario 10: URL must use http/https protocol
```gherkin
Given the Add RSS Feed dialog is open
When I enter "My Feed" in the Feed Name field
And I enter "ftp://example.com/feed.xml" in the Feed URL field
And I click the "Add Feed" button
Then the browser should show URL validation error
Or the backend should return validation error for invalid URL scheme
```

---

## API Success Cases

### Scenario 11: Create RSS source with all fields via API
```gherkin
Given I have a valid JWT authentication token
When I send POST request to "/api/sources/rss" with body:
  {
    "name": "ESPN Fantasy Football",
    "feedUrl": "https://www.espn.com/espn/rss/news",
    "description": "Latest fantasy football news and analysis"
  }
Then the response status should be 201 Created
And the response should contain:
  {
    "success": true,
    "message": "RSS feed source created successfully",
    "source": {
      "_id": "<generated-id>",
      "userId": "<current-user-id>",
      "type": "rss",
      "name": "ESPN Fantasy Football",
      "feedUrl": "https://www.espn.com/espn/rss/news",
      "description": "Latest fantasy football news and analysis",
      "status": "active",
      "fetchFrequency": 60,
      "articlesCount": 0,
      "createdAt": "<timestamp>"
    }
  }
And a new document should be created in the sources collection
```

### Scenario 12: Create RSS source with minimum fields via API
```gherkin
Given I have a valid JWT authentication token
When I send POST request to "/api/sources/rss" with body:
  {
    "name": "My RSS Feed",
    "feedUrl": "https://example.com/feed.xml"
  }
Then the response status should be 201 Created
And the response source should have:
  - name: "My RSS Feed"
  - feedUrl: "https://example.com/feed.xml"
  - description: undefined
  - status: "active"
  - fetchFrequency: 60 (default)
  - articlesCount: 0 (default)
```

### Scenario 13: Verify source persisted to MongoDB
```gherkin
Given I successfully created an RSS source via API
When I query the MongoDB sources collection for the created source ID
Then the document should exist with all expected fields
And the userId should match the authenticated user
And the type should be "rss"
And createdAt and updatedAt should be set to current timestamp
```

---

## API Validation Errors

### Scenario 14: Missing required field - name
```gherkin
Given I have a valid JWT authentication token
When I send POST request to "/api/sources/rss" with body:
  {
    "feedUrl": "https://example.com/feed.xml"
  }
Then the response status should be 400 Bad Request
And the response should contain:
  {
    "success": false,
    "message": "Validation failed",
    "errors": [
      {
        "field": "name",
        "message": "Required"
      }
    ]
  }
```

### Scenario 15: Invalid feedUrl format
```gherkin
Given I have a valid JWT authentication token
When I send POST request to "/api/sources/rss" with body:
  {
    "name": "Test Feed",
    "feedUrl": "not-a-valid-url"
  }
Then the response status should be 400 Bad Request
And the response errors should include:
  {
    "field": "feedUrl",
    "message": "Invalid RSS feed URL"
  }
```

### Scenario 16: Name too short (less than 2 characters)
```gherkin
Given I have a valid JWT authentication token
When I send POST request to "/api/sources/rss" with body:
  {
    "name": "A",
    "feedUrl": "https://example.com/feed.xml"
  }
Then the response status should be 400 Bad Request
And the response errors should include:
  {
    "field": "name",
    "message": "Name must be at least 2 characters"
  }
```

### Scenario 17: Invalid fetchFrequency (out of range)
```gherkin
Given I have a valid JWT authentication token
When I send POST request to "/api/sources/rss" with body:
  {
    "name": "Test Feed",
    "feedUrl": "https://example.com/feed.xml",
    "fetchFrequency": 10
  }
Then the response status should be 400 Bad Request
And the response should indicate fetchFrequency must be between 15 and 1440 minutes
```

---

## Business Logic Errors

### Scenario 18: Duplicate RSS feed prevention (same user)
```gherkin
Given I have already added an RSS feed with URL "https://example.com/feed.xml"
When I attempt to add another RSS feed with the same URL "https://example.com/feed.xml"
Then the response status should be 400 Bad Request
And the response should contain:
  {
    "success": false,
    "message": "RSS feed already added"
  }
And no new source should be created in the database
```

### Scenario 19: Different users can add same RSS feed URL
```gherkin
Given User A has added an RSS feed with URL "https://example.com/feed.xml"
When User B (different user) adds an RSS feed with the same URL "https://example.com/feed.xml"
Then the response status should be 201 Created
And User B should have their own separate source document in MongoDB
And the duplicate check should only apply within the same userId
```

---

## Authentication & Authorization

### Scenario 20: Authentication required - no token
```gherkin
Given I am not authenticated (no JWT token in headers)
When I send POST request to "/api/sources/rss"
Then the response status should be 401 Unauthorized
And the response should contain:
  {
    "success": false,
    "message": "Unauthorized - Invalid or missing token"
  }
```

### Scenario 21: Authentication required - invalid token
```gherkin
Given I have an invalid or expired JWT token
When I send POST request to "/api/sources/rss" with the invalid token
Then the response status should be 401 Unauthorized
And the response should indicate authentication failure
```

### Scenario 22: User isolation - sources scoped by userId
```gherkin
Given User A is authenticated
When User A creates an RSS feed
Then the source document should have userId matching User A's ID
And User B should NOT be able to see User A's RSS feed
And the duplicate check should use userId in the query
```

---

## Error Handling

### Scenario 23: Database connection failure
```gherkin
Given the MongoDB connection is unavailable
When I attempt to create an RSS feed
Then the response status should be 500 Internal Server Error
And the response should contain:
  {
    "success": false,
    "message": "An error occurred while creating RSS source"
  }
And the error should be logged to the console
```

### Scenario 24: Malformed JSON request body
```gherkin
Given I have a valid JWT token
When I send POST request with malformed JSON body
Then the response status should be 400 Bad Request
And the response should indicate JSON parsing error
```

---

## Integration Tests

### Scenario 25: Dialog triggers onSuccess callback after successful add
```gherkin
Given the Add RSS Feed dialog is open with an onSuccess callback provided
When I successfully add an RSS feed
Then the onSuccess callback should be invoked
And the parent component can use this callback to refresh the sources list
```

### Scenario 26: Dialog displays backend validation errors in UI
```gherkin
Given the Add RSS Feed dialog is open
When I submit a feed that fails backend validation (e.g., duplicate)
Then the backend error message should be displayed in a red error banner
And the error should read "RSS feed already added"
And the dialog should remain open
And the loading state should stop
```

---

## Performance Tests

### Scenario 27: API response time for creating RSS source
```gherkin
Given normal system load
When I create an RSS feed via API
Then the response time should be under 500ms for 95th percentile
And the response time should be under 1000ms for 99th percentile
```

### Scenario 28: Dialog load time
```gherkin
Given I am on the Knowledge Base page
When I click to open the Add RSS Feed dialog
Then the dialog should open within 100ms
And all form fields should be immediately interactive
```

---

## Security Tests

### Scenario 29: XSS prevention in feed name
```gherkin
Given the Add RSS Feed dialog is open
When I enter "<script>alert('XSS')</script>" in the Feed Name field
And I submit the form
Then the script should be stored as plain text
And when displayed in the UI, it should be properly escaped
And the script should NOT execute
```

### Scenario 30: NoSQL injection prevention
```gherkin
Given I have a valid JWT token
When I send POST request with malicious MongoDB query in feedUrl:
  {
    "name": "Test",
    "feedUrl": "https://example.com/feed.xml",
    "$where": "malicious code"
  }
Then the Zod validation should reject the extra fields
And no MongoDB injection should occur
```

### Scenario 31: URL scheme validation (prevent javascript: URLs)
```gherkin
Given the Add RSS Feed dialog is open
When I enter "javascript:alert('XSS')" in the Feed URL field
And I submit the form
Then the HTML5 URL validation should reject it
Or the backend should reject non-http/https schemes
```

---

## Accessibility Tests

### Scenario 32: Keyboard navigation in dialog
```gherkin
Given the Add RSS Feed dialog is open
When I press Tab key
Then focus should move through fields in order: Feed Name → Feed URL → Description → Cancel → Add Feed
And pressing Shift+Tab should move focus backwards
And pressing Enter on the Add Feed button should submit the form
And pressing Escape should close the dialog
```

### Scenario 33: Screen reader compatibility
```gherkin
Given the Add RSS Feed dialog is open
Then all form fields should have proper labels associated via htmlFor
And the required fields should have aria-required="true" or required attribute
And the dialog should have proper ARIA attributes (role="dialog", aria-labelledby, aria-describedby)
And error messages should be announced to screen readers
```

---

## Edge Cases

### Scenario 34: Very long feed name (255+ characters)
```gherkin
Given the Add RSS Feed dialog is open
When I enter a feed name with 300 characters
And I submit the form
Then the feed should be created successfully (no max length validation)
Or the backend should enforce a reasonable max length with clear error message
```

### Scenario 35: Feed URL with Unicode characters
```gherkin
Given the Add RSS Feed dialog is open
When I enter "国际新闻" in the Feed Name field
And I enter "https://example.com/新闻/feed.xml" in the Feed URL field
And I submit the form
Then the feed should be created successfully
And the Unicode characters should be properly encoded and stored
```

### Scenario 36: Maximum fetchFrequency boundary (1440 minutes = 24 hours)
```gherkin
Given I have a valid JWT token
When I send POST request with fetchFrequency: 1440
Then the response status should be 201 Created
And the source should be created with fetchFrequency: 1440
```

---

## Regression Tests

### Scenario 37: Multiple RSS feeds can be added sequentially
```gherkin
Given I am logged in and on the Knowledge Base page
When I add RSS feed #1 successfully
And I open the Add RSS Feed dialog again
And I add RSS feed #2 successfully
And I add RSS feed #3 successfully
Then all three feeds should be created in MongoDB
And each should have unique _id and feedUrl
And all should belong to the same userId
```

### Scenario 38: Form reset after successful submission
```gherkin
Given the Add RSS Feed dialog is open
When I successfully add an RSS feed with name "Feed 1" and URL "https://feed1.com"
And the dialog closes
And I open the Add RSS Feed dialog again
Then all form fields should be empty (not showing previous values)
And the error state should be cleared
And I should be able to add a new feed without issues
```

---

## Notes
- All scenarios should be executable as automated tests
- Use Playwright for UI/browser tests
- Use API testing tools (Jest + Supertest) for backend tests
- Mock MongoDB in unit tests, use real DB in integration tests
- Verify WCAG 2.1 AA compliance for accessibility
