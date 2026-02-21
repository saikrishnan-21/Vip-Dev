# VIP-10301: List Generated Content with Filters - Test Specification

## Feature: List Generated Content with Filters
Automated test specification for VIP-10301

### UI/Component Tests

#### Scenario: Happy path - view all content with pagination
```gherkin
Given I am logged in as an authorized user
And I have previously generated 25 content pieces
When I navigate to the content dashboard
Then the page should load successfully
And I should see the first 20 content items in a list
And the list should display: title, status, word count, SEO score
And status badges should be color-coded (pending=yellow, approved=green, rejected=red, published=blue)
And pagination controls should show "1-20 of 25"
And a "Next" button should be available
```

#### Scenario: Filter by status - pending content only
```gherkin
Given I am on the content dashboard
And I have content with mixed statuses (5 pending, 8 approved, 3 rejected)
When I click the "Pending" filter button
Then the list should update to show only pending content
And the display should show "5 results"
And all items should have "pending" status badges
And the "Pending" filter button should be highlighted/active
```

#### Scenario: Filter by status - approved content
```gherkin
Given I am on the content dashboard with filters active
When I click the "Approved" filter button
Then the list should update to show only approved content
And the display should show the correct count
And all items should have "approved" status badges
And the "Approved" filter button should be highlighted
```

#### Scenario: Search content by title
```gherkin
Given I am on the content dashboard
And I have content with titles: "Fantasy Football Guide", "Basketball Stats Analysis", "Football Season Forecast"
When I type "Football" in the search input
And I wait for the search to complete (debounce)
Then the list should update to show: "Fantasy Football Guide", "Football Season Forecast"
And the count should display "2 results"
And non-matching items should disappear
```

#### Scenario: Search with no results
```gherkin
Given I am on the content dashboard
When I search for "nonexistent_xyz_search_term"
Then the list should be empty
And a message should display "No content found"
And a suggestion to try different search terms should appear
```

#### Scenario: Pagination - navigate to next page
```gherkin
Given I am on the content dashboard showing page 1 (20 items)
And there are 45 total content items
When I click the "Next" button
Then the list should load page 2 items (21-40)
And the pagination should show "21-40 of 45"
And a "Previous" button should now be available
```

#### Scenario: Pagination - navigate to previous page
```gherkin
Given I am on page 2 of content results
When I click the "Previous" button
Then the list should load page 1 items (1-20)
And the pagination should show "1-20 of 45"
And the "Previous" button should be disabled
```

#### Scenario: Loading state during API call
```gherkin
Given I am on the content dashboard
When the page is loading content from the API
Then skeleton loaders should be visible for each content item
And the list items should not be interactive during loading
And the loading state should clear once data arrives
```

#### Scenario: Error handling - API failure
```gherkin
Given I am on the content dashboard
And the API is temporarily unavailable
When the page attempts to fetch content
Then an error message should display: "Failed to load content"
And a "Retry" button should be available
When I click "Retry"
Then the page should attempt to fetch content again
```

#### Scenario: Combined filters - status + search
```gherkin
Given I am on the content dashboard
When I apply status filter "approved" AND search for "fantasy"
Then the list should show only approved content that matches "fantasy"
And both filters should be visually active
And the results should satisfy both filter criteria
```

#### Scenario: Clear all filters
```gherkin
Given I have applied multiple filters (status + search)
When I click a "Clear All" button
Then all filters should be reset
And the list should show all content again
And the page should reload with default pagination
```

#### Scenario: User isolation - only see own content
```gherkin
Given I am logged in as User A
And User A has 5 content items
And User B has 10 content items
When I view the content dashboard
Then I should only see User A's 5 content items
And User B's content should not be visible
And no unauthorized data should be visible
```

### API Tests

#### Scenario: GET /api/content - successful request with defaults
```gherkin
Given I have a valid JWT authentication token
When I make a GET request to /api/content
Then the response status should be 200 OK
And the response should include a "content" array
And the response should include "pagination" object with total, limit, offset, hasMore
And each content item should have: _id, title, status, wordCount, seoScore, generatedAt, keywords
And the default limit should be 20 items
And results should be filtered by my userId
```

#### Scenario: GET /api/content - filter by status
```gherkin
Given I have a valid JWT token
When I make a GET request to /api/content?status=approved
Then the response status should be 200
And all returned items should have status="approved"
And the total count should match approved items only
```

#### Scenario: GET /api/content - search by keyword
```gherkin
Given I have a valid JWT token
And I have content with titles: "Tech Guide", "Sports Analysis"
When I make a GET request to /api/content?search=sports
Then the response should include only "Sports Analysis"
And the response status should be 200
```

#### Scenario: GET /api/content - pagination with offset/limit
```gherkin
Given I have 45 content items
When I make a GET request to /api/content?limit=10&offset=20
Then the response should include items 21-30 (10 items)
And pagination.offset should be 20
And pagination.limit should be 10
And pagination.hasMore should be true (25 items remaining)
```

#### Scenario: GET /api/content - authentication required
```gherkin
Given I make a request without an authentication token
When I access /api/content
Then the response status should be 401 Unauthorized
And the response should include error message "Authentication required"
```

#### Scenario: GET /api/content - user isolation validation
```gherkin
Given User A has JWT token
And User B has different JWT token
When User A makes GET /api/content request
Then only User A's content should be returned
And User B's content should be excluded even if it exists in DB
```

#### Scenario: GET /api/content - invalid query parameters
```gherkin
Given I have a valid JWT token
When I make GET request with invalid filters: /api/content?status=invalid_status&limit=-5
Then the response status should be 400 Bad Request
And the response should include validation error messages
And the request should not execute against the database
```

#### Scenario: GET /api/content - empty result set
```gherkin
Given I have generated no content items
When I make a GET request to /api/content
Then the response status should be 200
And the content array should be empty
And pagination.total should be 0
```

### Performance Tests

#### Scenario: Response time for list endpoint
```gherkin
Given normal database load with 1000 content items
When I make a GET request to /api/content?limit=20
Then the response time should be under 500ms for 95th percentile
And the response time should be under 1000ms for 99th percentile
```

#### Scenario: Search performance with large dataset
```gherkin
Given 10000 content items in the database
When I search for a keyword with /api/content?search=test&limit=20
Then the response time should be under 1000ms
And the search should use text indexes for performance
```

### Security Tests

#### Scenario: SQL injection prevention in search
```gherkin
Given I have a valid JWT token
When I make request with SQL injection payload: /api/content?search="; DROP TABLE content; --
Then the injection should be prevented
And no database errors should be exposed
And the request should treat the payload as literal string
```

#### Scenario: XSS prevention in search results
```gherkin
Given I have a valid JWT token
And a content item with title: "<script>alert('xss')</script>"
When I view the content list
Then the title should be properly escaped
And no JavaScript should execute
And the title should display as literal text
```

#### Scenario: CSRF token validation (if applicable)
```gherkin
Given I am logged in
When I make a cross-site request to /api/content
Then the request should be validated against CSRF protection
```

### Accessibility Tests

#### Scenario: Keyboard navigation
```gherkin
Given I am on the content dashboard
When I use Tab key to navigate
Then all interactive elements (buttons, links, search input) should be reachable
And focus should be visible and clear
And the focus order should be logical
```

#### Scenario: Screen reader support
```gherkin
Given I am using a screen reader
When I navigate the content list
Then each item should have appropriate ARIA labels
And status badges should have descriptive labels
And pagination buttons should have clear labels ("Next page", "Previous page")
```

### Negative Test Cases

#### Scenario: Filter by invalid status
```gherkin
Given I am on the content dashboard
When I manually modify the URL to use an invalid status: /dashboard/content?status=invalid_status
Then the API should return 400 Bad Request or ignore invalid status
And the list should show all content or display an error message
And the invalid filter should not break the UI
```

#### Scenario: Search with special characters
```gherkin
Given I am on the content dashboard
When I search for special characters: "test@#$%^&*()"
Then the search should handle special characters safely
And no errors should occur
And the search should treat special characters as literal text
```

#### Scenario: Search with very long query
```gherkin
Given I am on the content dashboard
When I enter a search query exceeding 200 characters
Then the search should be truncated or rejected gracefully
And an appropriate error message should display
And the UI should remain stable
```

#### Scenario: Pagination - navigate beyond available pages
```gherkin
Given I am on the content dashboard with 25 items (2 pages)
And I am on page 2
When I manually modify the URL to go to page 10: offset=200
Then the API should return an empty result set or page 2
And pagination should show correct page information
And no errors should occur
```

#### Scenario: Pagination - negative offset
```gherkin
Given I am on the content dashboard
When I manually set offset to negative value: /api/content?offset=-10
Then the API should handle negative offset gracefully
And either default to 0 or return 400 Bad Request
And the UI should not break
```

#### Scenario: Pagination - limit exceeds maximum
```gherkin
Given I am on the content dashboard
When I manually set limit to 1000: /api/content?limit=1000
Then the API should enforce a maximum limit (e.g., 100)
And return results with the enforced limit
And pagination should reflect the actual limit used
```

#### Scenario: Rapid filter changes
```gherkin
Given I am on the content dashboard
When I rapidly click different status filter buttons (5 clicks in 1 second)
Then the API should handle rapid requests gracefully
And only the last filter selection should be applied
And no duplicate API calls should occur
And the UI should remain responsive
```

#### Scenario: Search debounce - rapid typing
```gherkin
Given I am on the content dashboard
When I rapidly type in the search input (10 characters in 500ms)
Then the search should only execute after debounce delay (300ms)
And only one API call should be made after typing stops
And intermediate search states should not cause errors
```

#### Scenario: Network timeout during API call
```gherkin
Given I am on the content dashboard
And the network connection is slow (simulated timeout)
When the page attempts to fetch content
And the request times out after 30 seconds
Then an error message should display: "Request timed out"
And a "Retry" button should be available
And the user should be able to retry the request
```

#### Scenario: Partial API response (malformed JSON)
```gherkin
Given I am on the content dashboard
And the API returns malformed JSON
When the page attempts to parse the response
Then an error message should display: "Failed to parse response"
And a "Retry" button should be available
And the UI should not crash
```

#### Scenario: Empty pagination response
```gherkin
Given I am on the content dashboard
And the API returns content array but missing pagination object
When the page attempts to render the list
Then the page should handle missing pagination gracefully
And default pagination values should be used
And the list should still display content items
```

#### Scenario: Status filter - case sensitivity
```gherkin
Given I am on the content dashboard
When I manually use uppercase status: /api/content?status=APPROVED
Then the API should handle case-insensitive status matching
And return approved content regardless of case
Or return 400 Bad Request if case-sensitive
```

#### Scenario: Multiple search terms
```gherkin
Given I am on the content dashboard
When I search for multiple words: "fantasy football guide"
Then the search should match content containing all or any words
And the results should be relevant
And the search should work correctly with spaces
```

#### Scenario: Search with empty string
```gherkin
Given I am on the content dashboard with active search filter
When I clear the search input (empty string)
Then the search filter should be removed
And all content should be displayed again
And the URL should update to remove search parameter
```

#### Scenario: Filter reset - URL manipulation
```gherkin
Given I am on the content dashboard with active filters
When I manually clear URL parameters
Then the page should reload with default filters (all content)
And the UI should reflect the cleared state
And no errors should occur
```

#### Scenario: Concurrent filter and search changes
```gherkin
Given I am on the content dashboard
When I change status filter AND search query simultaneously
Then both filters should be applied correctly
And the API should receive both parameters
And the results should match both criteria
And only one API call should be made (debounced)
```

#### Scenario: Pagination - edge case with exactly 20 items
```gherkin
Given I have exactly 20 content items
When I view the content dashboard
Then all 20 items should be displayed
And pagination should show "1-20 of 20"
And the "Next" button should be disabled
And the "Previous" button should be disabled
```

#### Scenario: Pagination - edge case with 21 items
```gherkin
Given I have exactly 21 content items
When I view the content dashboard
Then the first 20 items should be displayed
And pagination should show "1-20 of 21"
And the "Next" button should be enabled
When I click "Next"
Then item 21 should be displayed
And pagination should show "21-21 of 21"
And the "Next" button should be disabled
```

#### Scenario: Status badge colors - all status types
```gherkin
Given I have content with all status types: draft, review, approved, published, archived, rejected
When I view the content dashboard
Then draft status should have gray badge
And review status should have blue badge
And approved status should have green badge
And published status should have purple badge
And archived status should have red badge
And rejected status should have orange badge
And all badges should be visually distinct
```

#### Scenario: Word count display - missing data
```gherkin
Given I have content items with and without wordCount field
When I view the content dashboard
Then items with wordCount should display the count
And items without wordCount should not show "undefined" or "null"
And the UI should handle missing wordCount gracefully
```

#### Scenario: SEO score display - missing data
```gherkin
Given I have content items with and without seoScore field
When I view the content dashboard
Then items with seoScore should display the score
And items without seoScore should not show "undefined" or "null"
And the UI should handle missing seoScore gracefully
```

#### Scenario: Keywords display - empty array
```gherkin
Given I have content items with empty keywords array
When I view the content dashboard
Then items with keywords should display keyword badges
And items with empty keywords should not show empty badges
And the UI should handle empty keywords gracefully
```

#### Scenario: Loading state - rapid navigation
```gherkin
Given I am on the content dashboard
When I rapidly navigate between pages (click Next, then Previous, then Next)
Then loading states should be shown for each navigation
And previous requests should be cancelled if possible
And only the final page should be displayed
And no race conditions should occur
```

#### Scenario: Error state - retry after fix
```gherkin
Given I am on the content dashboard
And the API is currently unavailable (returns 500 error)
When I see the error message and click "Retry"
And the API becomes available again
Then the content should load successfully
And the error message should disappear
And the list should display normally
```

#### Scenario: User isolation - token expiration during request
```gherkin
Given I am logged in as User A
And my JWT token expires during the API request
When I view the content dashboard
Then the API should return 401 Unauthorized
And the user should be redirected to login page
Or an appropriate error message should display
And no partial data should be exposed
```

#### Scenario: User isolation - invalid token format
```gherkin
Given I have an invalid JWT token format
When I attempt to access the content dashboard
Then the API should return 401 Unauthorized
And an error message should display
And the user should be prompted to login again
```

## Implementation Notes

### Test Coverage Priority
1. **Happy path scenarios** - User can list and filter content
2. **User isolation** - Cannot see other users' content
3. **Error handling** - API failures are handled gracefully
4. **API contract** - Response format matches spec
5. **Security** - No SQL injection, XSS, or data leakage
6. **Accessibility** - WCAG 2.1 AA compliance

### Tools & Framework
- **E2E Tests**: Playwright (based on these Gherkin specs)
- **API Tests**: Jest + Supertest
- **Component Tests**: React Testing Library
- **Performance**: Lighthouse, custom timing metrics

### Prerequisites
- User must be authenticated (JWT token)
- Database must be seeded with test content
- Content generation feature (E3) must be complete
