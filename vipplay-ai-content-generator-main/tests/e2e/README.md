# Playwright E2E Test Suite

Comprehensive test suite covering **all 8 epics** (E1-E8) with **377 test scenarios** across **9 epic specs plus helpers/integration**.

## Test Structure

```
tests/e2e/
├── helpers/
│   ├── api-helpers.ts           # API testing utilities (E1-E4)
│   ├── api-helpers-e5-e8.ts     # API testing utilities (E5-E8)
│   └── auth-helpers.ts           # Browser authentication helpers
├── e1-authentication.spec.ts     # VIP-10001..VIP-10008 consolidated (181 tests)
├── e2-knowledge-base.spec.ts     # VIP-10101..VIP-10110 consolidated (53 tests)
├── e3-content-generation.spec.ts # VIP-10204..VIP-10212 consolidated (38 tests)
├── e4-content-management.spec.ts # VIP-10301..VIP-10307 consolidated (39 tests)
├── e5-media-library.spec.ts      # VIP-10401..VIP-10406 (20 tests)
├── e6-ai-configuration.spec.ts   # VIP-10501..VIP-10507 (21 tests)
├── e7-export-notifications.spec.ts # VIP-10601..VIP-10605 (12 tests)
├── e8-deployment.spec.ts         # VIP-10701..VIP-10706 (13 tests)
├── integration.spec.ts           # Integration & performance tests
└── README.md
```

## Running Tests

### Run All Tests
```bash
pnpm test:e2e
```

### Run Tests with UI
```bash
pnpm test:e2e:ui
```

### Run Tests in Headed Mode
```bash
pnpm test:e2e:headed
```

### Run Tests in Debug Mode
```bash
pnpm test:e2e:debug
```

### View Test Report
```bash
pnpm test:e2e:report
```

### Run Specific Test File (epic-wise)
```bash
# E1 - Authentication & User Management
pnpm exec playwright test tests/e2e/e1-authentication.spec.ts

# E2 - Knowledge Base
pnpm exec playwright test tests/e2e/e2-knowledge-base.spec.ts

# E3 - Content Generation
pnpm exec playwright test tests/e2e/e3-content-generation.spec.ts

# E4 - Content Management
pnpm exec playwright test tests/e2e/e4-content-management.spec.ts

# E5 - Media Library
pnpm exec playwright test tests/e2e/e5-media-library.spec.ts

# E6 - AI Configuration
pnpm exec playwright test tests/e2e/e6-ai-configuration.spec.ts

# E7 - Export & Notifications
pnpm exec playwright test tests/e2e/e7-export-notifications.spec.ts

# E8 - Deployment
pnpm exec playwright test tests/e2e/e8-deployment.spec.ts
```

### Run Specific Test
```bash
pnpm exec playwright test -g "TC-LOGIN-001"
```

## Test Coverage

### E1 - Authentication & User Management
| Story | Covered In | Scenarios | Status |
|-------|------------|-----------|--------|
| VIP-10001 | e1-authentication.spec.ts | 25 | ✅ |
| VIP-10002 | e1-authentication.spec.ts | 30 | ✅ |
| VIP-10004 | e1-authentication.spec.ts | 25 | ✅ |
| VIP-10005 | e1-authentication.spec.ts | 25 | ✅ |
| VIP-10006 | e1-authentication.spec.ts | 23 | ✅ |
| VIP-10007 | e1-authentication.spec.ts | 22 | ✅ |
| VIP-10008 | e1-authentication.spec.ts | 22 | ✅ |
| **E1 Subtotal** | | **181** | ✅ |

### E2 - Knowledge Base System
| Stories | Covered In | Scenarios | Status |
|---------|------------|-----------|--------|
| VIP-10101-10110 | e2-knowledge-base.spec.ts | 53 | ✅ |
| **E2 Subtotal** | | **53** | ✅ |

### E3 - Content Generation (AI)
| Stories | Covered In | Scenarios | Status |
|---------|------------|-----------|--------|
| VIP-10204-10212 | e3-content-generation.spec.ts | 38 | ✅ |
| **E3 Subtotal** | | **38** | ✅ |

### E4 - Content Management & Review
| Stories | Covered In | Scenarios | Status |
|---------|------------|-----------|--------|
| VIP-10301-10307 | e4-content-management.spec.ts | 39 | ✅ |
| **E4 Subtotal** | | **39** | ✅ |

### E5 - Media Library
| Stories | Covered In | Scenarios | Status |
|---------|------------|-----------|--------|
| VIP-10401-10406 | e5-media-library.spec.ts | 20 | ✅ |
| **E5 Subtotal** | | **20** | ✅ |

### E6 - AI Configuration (Superadmin)
| Stories | Covered In | Scenarios | Status |
|---------|------------|-----------|--------|
| VIP-10501-10507 | e6-ai-configuration.spec.ts | 21 | ✅ |
| **E6 Subtotal** | | **21** | ✅ |

### E7 - Export & Notifications
| Stories | Covered In | Scenarios | Status |
|---------|------------|-----------|--------|
| VIP-10601-10605 | e7-export-notifications.spec.ts | 12 | ✅ |
| **E7 Subtotal** | | **12** | ✅ |

### E8 - Deployment & Production
| Stories | Covered In | Scenarios | Status |
|---------|------------|-----------|--------|
| VIP-10701-10706 | e8-deployment.spec.ts | 13 | ✅ |
| **E8 Subtotal** | | **13** | ✅ |

### Integration & Performance
| Type | Covered In | Scenarios | Status |
|------|------------|-----------|--------|
| Integration | integration.spec.ts | 10 | ✅ |

| **GRAND TOTAL** | | **377** | ✅ |

## Test Data

Default test user:
- Email: `user1@vipcontentai.com`
- Password: `SecurePass123!`

Tests automatically generate unique test users using `generateTestEmail()` and `generateTestPassword()` helpers.

## Test Data Cleanup

### Quick Cleanup Commands

**Database Only:**
```bash
# Clean test data from MongoDB
pnpm test:e2e:cleanup
```

**Playwright Cache Only:**
```bash
# Clean Playwright browser cache (uses built-in command)
pnpm test:e2e:cleanup:cache
```

**Playwright Artifacts Only:**
```bash
# Clean test-results/ and playwright-report/ directories
pnpm test:e2e:cleanup:artifacts
```

**Full Cleanup (All):**
```bash
# Clean Playwright cache + artifacts + database test data
pnpm test:e2e:cleanup:all
```

This uses Playwright's built-in `clear-cache` command (see [Playwright CLI docs](https://playwright.dev/docs/test-cli)) for cache cleanup.

### Manual Cleanup Scripts

**PowerShell Script** (Windows):
```powershell
# Full cleanup (Playwright + Database)
.\tests\e2e\cleanup-test-data.ps1

# Dry run (see what would be deleted)
.\tests\e2e\cleanup-test-data.ps1 -DryRun

# Only clean Playwright artifacts
.\tests\e2e\cleanup-test-data.ps1 -CleanDatabase:$false

# Only clean database
.\tests\e2e\cleanup-test-data.ps1 -CleanPlaywright:$false
```

**Node.js Script** (Database only):
```bash
# Clean test data from MongoDB
node tests/e2e/cleanup-database.js
```

### What Gets Cleaned

**Playwright Artifacts:**
- `test-results/` - Test execution results
- `playwright-report/` - HTML test reports
- `playwright/.cache/` - Browser cache

**Database Test Data:**
- Test users (emails matching pattern: `{prefix}-{timestamp}-{random}@vipcontentai.com`)
- Test sources (RSS feeds, websites, topics, trends)
- Test articles
- Test generated content
- Test media files
- Old generation jobs (>24 hours)
- Test notifications

### Playwright Built-in Cleanup

Playwright automatically cleans up:
- Browser contexts after each test
- Test fixtures (via `test.afterEach` hooks)
- Screenshots/videos on successful tests (configured in `playwright.config.ts`)

**Playwright CLI Commands** (see [official docs](https://playwright.dev/docs/test-cli)):
```bash
# Clear Playwright browser cache
npx playwright clear-cache

# Show test report (from previous run)
npx playwright show-report

# List all tests without running
npx playwright test --list
```

**Manual Artifact Cleanup:**
```bash
# Remove test results and reports (Playwright doesn't auto-delete these)
rm -rf test-results playwright-report

# Or use npm script
pnpm test:e2e:cleanup:artifacts
```

## Prerequisites

1. Next.js dev server running on `http://localhost:3000`
2. FastAPI service running on `http://localhost:8000` (for E2/E3/E5 tests)
3. MongoDB database accessible
4. Weaviate vector database accessible (for semantic search tests)
5. Ollama service accessible (for content generation tests)
6. HuggingFace Model API service accessible (for image/video generation tests in E5)
7. Test user created (or use seed script: `pnpm db:seed`)

## Notes

- Tests use both browser automation and API testing
- Browser tests verify UI flows
- API tests verify backend logic
- All tests are isolated and can run in parallel
- Tests clean up after themselves (clear auth data)

## Troubleshooting

### Tests Fail with "Connection Refused"
- Ensure Next.js dev server is running: `pnpm dev`

### Tests Fail with "401 Unauthorized"
- Verify test user exists in database
- Run seed script: `pnpm db:seed`

### Tests Timeout
- Increase timeout in `playwright.config.ts`
- Check server is responding

## Adding New Tests

1. Create test file in `tests/e2e/`
2. Import helpers from `helpers/`
3. Use test data generators for unique data
4. Follow naming convention: `TC-{STORY}-{NUMBER}: {Description}`
5. Update this README with new test file

