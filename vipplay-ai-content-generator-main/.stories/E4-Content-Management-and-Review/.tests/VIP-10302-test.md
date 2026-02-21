# VIP-10302: View Content Details & Preview - Test Specification

## Feature: View Content Details & Preview
Automated test specification for VIP-10302

### UI/Component Tests

#### Scenario: Happy path - open and view content details
```gherkin
Given I am logged in as an authorized user
And I am on the content dashboard viewing a list of content
When I click on a content item in the list
Then a detail modal/panel should open
And the content title should be displayed prominently
And the full content should be visible with proper formatting
And all metadata should load correctly
```

#### Scenario: View full content with rich formatting
```gherkin
Given I have opened the content detail view for a piece
When I view the content section
Then the content should display with proper formatting
And line breaks and paragraphs should be preserved
And any images should be rendered
And external links should be clickable
And no scripts should execute (XSS prevention)
```

#### Scenario: View nerd stats section
```gherkin
Given I have opened content details
When I view the "Nerd Stats" section
Then I should see: reading time, Flesch score, grade level
And I should see: keyword density, average words per sentence
And I should see: number of paragraphs, images, and links
And all stats should have appropriate formatting/units
```

#### Scenario: View SEO analysis checklist
```gherkin
Given I have opened content details
When I view the "SEO Analysis" section
Then I should see a checklist of SEO items (title, meta description, headings, etc.)
And each item should show pass/fail status
And passing items should be marked in green
And failing items should be marked in red
And there should be an overall SEO score displayed
```

#### Scenario: View metadata and generation info
```gherkin
Given I have opened content details
When I view the metadata section
Then I should see: generation mode (topic/keywords/trends/spin)
And I should see: keywords used in generation
And I should see: model used and generation timestamp
And I should see: word count and reading time
```

#### Scenario: View content in different statuses
```gherkin
Given I have content with different statuses (pending, approved, rejected, published)
When I open the detail view for each
Then the status badge should display correctly
And the action buttons should be appropriate for the status
And pending content should be editable
And published content should be read-only
```

#### Scenario: Close detail view
```gherkin
Given I have opened the content detail view
When I click the close button (X) or click outside the modal
Then the modal should close
And I should return to the content list
And the list should retain my previous filter and search state
```

#### Scenario: Action buttons visibility
```gherkin
Given I have opened content details
When I view the action buttons
Then I should see: Approve, Reject, Edit, Delete, Export buttons
And button states should match the content status
And pending content should have all buttons enabled
And published content should have only View and Export enabled
```

#### Scenario: Loading state while fetching content
```gherkin
Given I click on a content item
When the detail view is loading content from the API
Then a loading spinner should be visible
And the detail panel should show skeleton loaders
And no content should be displayed until loaded
And the loading state should clear once data arrives
```

#### Scenario: Error handling when fetching fails
```gherkin
Given I open content details
And the API fails to fetch the content
When the request completes
Then an error message should display: "Failed to load content"
And a "Retry" button should be available
When I click "Retry"
Then the API request should be made again
```

#### Scenario: User isolation - cannot view other users' content
```gherkin
Given I am logged in as User A
And I try to access content details that belong to User B
When the API attempts to fetch the content
Then I should receive a "Not Found" error
And the detail view should not display
And no data should be revealed
```

### API Tests

#### Scenario: GET /api/content/[contentId] - successful request
```gherkin
Given I have a valid JWT authentication token
And I have a content ID that belongs to me
When I make a GET request to /api/content/[contentId]
Then the response status should be 200 OK
And the response should include all content fields
And the response should include seoAnalysis with scores
And the response should include readabilityAnalysis with metrics
```

#### Scenario: GET /api/content/[contentId] - content not found
```gherkin
Given I have a valid JWT token
When I request a content ID that doesn't exist
Then the response status should be 404 Not Found
And the response should include error message
```

#### Scenario: GET /api/content/[contentId] - user isolation
```gherkin
Given I have a valid JWT token for User A
When I request content that belongs to User B
Then the response status should be 404 Not Found
And no content data should be returned
And User A should not know the content exists
```

#### Scenario: GET /api/content/[contentId] - authentication required
```gherkin
Given I make a request without an authentication token
When I access /api/content/[contentId]
Then the response status should be 401 Unauthorized
And the response should indicate authentication is required
```

#### Scenario: GET /api/content/[contentId] - complete response structure
```gherkin
Given I make a successful request to GET /api/content/[contentId]
When I receive the response
Then the response should include:
- _id, title, content, status
- generatedAt, createdAt, updatedAt
- keywords array
- metadata object (wordCount, sourceType, model)
- seoAnalysis object with score and items array
- readabilityAnalysis with flesch_ease, grade_level, etc.
```

### Performance Tests

#### Scenario: Content detail load time
```gherkin
Given normal database load
When I open a content detail view
Then the content should load within 500ms for 95th percentile
And the content should load within 1000ms for 99th percentile
And the UI should remain responsive during loading
```

#### Scenario: Large content rendering
```gherkin
Given I have a large content piece (10000+ words with images)
When I open the detail view
Then the content should render within 1 second
And scrolling should be smooth
And no performance issues should occur
```

### Security Tests

#### Scenario: XSS prevention in content display
```gherkin
Given I have a content with malicious scripts: "<script>alert('xss')</script>"
When I view the content detail
Then the scripts should be escaped/sanitized
And no JavaScript should execute
And the text should display literally
```

#### Scenario: HTML injection prevention
```gherkin
Given I have content with HTML injection: "<img src=x onerror='alert(1)'>"
When I view the content
Then the HTML should be properly escaped
And no JavaScript should execute
And no external requests should be made
```

#### Scenario: Data isolation - cannot access other users' data
```gherkin
Given I am User A
And User B has sensitive content
When I attempt to access User B's content via API
Then I should get 404 error
And the error should not reveal that User B has content
```

### Accessibility Tests

#### Scenario: Keyboard navigation in detail view
```gherkin
Given I have opened the content detail view
When I use the Tab key to navigate
Then all interactive elements should be reachable
And the focus should be visible
And I should be able to close the modal with Escape key
And button focus order should be logical
```

#### Scenario: Screen reader compatibility
```gherkin
Given I am using a screen reader
When I open content details
Then the title should be read as a heading
And metadata should have proper labels
And action buttons should have descriptive labels
And SEO items should be properly structured for reading
```

#### Scenario: Color contrast for status badges
```gherkin
Given I am viewing status badges in the content details
When I check the color contrast
Then text contrast should meet WCAG AA standards (4.5:1)
And status should be conveyed with more than color alone
And users with color blindness should understand the status
```

## Implementation Notes

### Test Coverage Priority
1. **Content retrieval** - User can open and view details
2. **Metadata display** - All fields shown correctly
3. **User isolation** - Cannot see other users' content
4. **Error handling** - Failures handled gracefully
5. **XSS prevention** - Content properly escaped
6. **Accessibility** - WCAG 2.1 AA compliance

### Related Tests
- VIP-10301-test: List and filter content (prerequisite)
- VIP-10304-test: Approve action (uses action button from this feature)
- VIP-10305-test: Reject action (uses action button)
- VIP-10303-test: Edit action (uses action button)

### Negative Test Cases

#### Scenario: Invalid content ID format
```gherkin
Given I am logged in as an authorized user
When I try to access content details with an invalid ID format: "invalid-id-123"
Then the API should return 400 Bad Request
And the error message should indicate "Invalid content ID"
And the detail view should not open
```

#### Scenario: Content ID that doesn't exist
```gherkin
Given I am logged in as an authorized user
And I have a valid but non-existent content ID: "507f1f77bcf86cd799439011"
When I try to access content details
Then the API should return 404 Not Found
And the error message should be "Content not found"
And the detail view should show an error state
```

#### Scenario: Accessing content with malformed ObjectId
```gherkin
Given I am logged in as an authorized user
When I try to access content with malformed ObjectId: "123"
Then the API should return 400 Bad Request
And the error should indicate invalid ID format
```

#### Scenario: Network timeout during content fetch
```gherkin
Given I click on a content item
And the network request times out
When the timeout occurs
Then the detail view should show a timeout error message
And a "Retry" button should be available
And clicking "Retry" should attempt to fetch again
```

#### Scenario: Partial content data (missing optional fields)
```gherkin
Given I have content with missing optional fields (no seoAnalysis, no readabilityAnalysis)
When I open the content detail view
Then the detail view should still display
And missing sections should be hidden or show "N/A"
And no errors should occur
```

#### Scenario: Very long content (performance test)
```gherkin
Given I have content with 50,000+ words
When I open the detail view
Then the content should load within 2 seconds
And scrolling should remain smooth
And no browser freezing should occur
```

#### Scenario: Content with special characters and XSS attempts
```gherkin
Given I have content with XSS attempts: "<script>alert('xss')</script>"
When I view the content detail
Then the script tags should be escaped
And no JavaScript should execute
And the text should display as literal text
```

#### Scenario: Content with HTML entities
```gherkin
Given I have content with HTML entities: "&lt;div&gt;test&lt;/div&gt;"
When I view the content detail
Then the entities should be properly decoded or escaped
And the content should display correctly
```

#### Scenario: Missing authentication token
```gherkin
Given I am not authenticated
When I try to access content details via API directly
Then the API should return 401 Unauthorized
And no content data should be returned
```

#### Scenario: Expired authentication token
```gherkin
Given I have an expired JWT token
When I try to access content details
Then the API should return 401 Unauthorized
And the error should indicate "Invalid token"
And the user should be redirected to login
```

#### Scenario: Content with null/undefined fields
```gherkin
Given I have content with null title or null content
When I open the detail view
Then the component should handle null values gracefully
And display appropriate fallback text
And no JavaScript errors should occur
```

#### Scenario: Rapid clicking on multiple articles
```gherkin
Given I am on the content list page
When I rapidly click on multiple articles in quick succession
Then only the last clicked article should be displayed
And previous requests should be cancelled
And no race conditions should occur
```

#### Scenario: Closing detail view while loading
```gherkin
Given I click on a content item
And the detail view is loading
When I close the detail view before loading completes
Then the loading should be cancelled
And no errors should occur
And the list view should be restored
```

#### Scenario: Content with extremely long title
```gherkin
Given I have content with a title exceeding 500 characters
When I view the content detail
Then the title should be truncated or wrapped appropriately
And the UI should not break
And all text should be readable
```

#### Scenario: Content with empty keywords array
```gherkin
Given I have content with an empty keywords array: []
When I view the content detail
Then the keywords section should not display
Or should show "No keywords" message
And no errors should occur
```

#### Scenario: Content with invalid date formats
```gherkin
Given I have content with invalid createdAt or updatedAt dates
When I view the content detail
Then the date should be handled gracefully
And should display "Invalid date" or similar fallback
And no JavaScript errors should occur
```

### Prerequisites
- VIP-10301 must be implemented (content list to open from)
- Backend API endpoint must be functional
- Database must be seeded with content
