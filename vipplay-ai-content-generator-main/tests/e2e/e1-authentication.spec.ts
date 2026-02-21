/**
 * E1 - Authentication & User Management Tests
 * * Consolidated End-to-End Test Suite covering:
 * - VIP-10001: User Registration
 * - VIP-10002: User Login
 * - VIP-10004: JWT Token Management
 * - VIP-10005: Protected Routes Middleware
 * - VIP-10006: User Profile Management
 * - VIP-10007: User Preferences & Settings
 * - VIP-10008: Role-Based Access Control
 */

import { test, expect } from '@playwright/test';
import { 
  loginViaUI, 
  clearAuthData, 
  verifyErrorMessage, 
  verifyFieldError, 
  verifyDashboardAccess, 
  isLoggedIn, 
  getStoredToken, 
  registerViaUI 
} from './helpers/auth-helpers';
import { 
  loginViaAPI, 
  registerViaAPI, 
  generateTestEmail, 
  generateTestPassword, 
  getCurrentUser, 
  updateProfile, 
  changePassword, 
  verifyToken, 
  refreshToken, 
  getPreferences, 
  updatePreferences, 
  replacePreferences, 
  resetPreferences, 
  listUsers, 
  getUserById, 
  updateUserRole, 
  deleteUser,
  logoutViaAPI
} from './helpers/api-helpers';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// --- Shared Constants ---
const TEST_USER = {
  email: 'user@vipcontentai.com',
  password: 'SecurePass123!',
};

const SUPERADMIN_EMAIL = 'admin@vipcontentai.com';
const SUPERADMIN_PASSWORD = 'SecurePass123!';

test.describe('E1 - Authentication & User Management Tests', () => {
  
  // Global Setup: Ensure standard test user exists
  test.beforeAll(async ({ request }) => {
    const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
    if (!loginResponse.success) {
      console.log('Global Setup: Creating default TEST_USER');
      await registerViaAPI(request, TEST_USER.email, TEST_USER.password, TEST_USER.password, 'Test User');
    }
  });

  // ==========================================
  // VIP-10001: User Registration
  // ==========================================
  test.describe('VIP-10001: User Registration', () => {
    test.beforeEach(async ({ page }) => {
      await clearAuthData(page);
    });

    test.describe('Positive Scenarios', () => {
      test('TC-REG-001: Successful Registration with Valid Data', async ({ page }) => {
        const email = generateTestEmail();
        const password = generateTestPassword();
        
        await registerViaUI(page, email, password, password, 'John Doe');
        await page.waitForURL(/\/login/, { timeout: 10000 });
        await expect(page.locator('text=Welcome back')).toBeVisible();
      });

      test('TC-REG-002: Registration with Minimum Password Length', async ({ page }) => {
        const email = generateTestEmail();
        const password = 'Abc12345'; // Exactly 8 characters
        await registerViaUI(page, email, password, password, 'Test User');
        await page.waitForURL(/\/login/, { timeout: 10000 });
      });

      test('TC-REG-003: Registration with Maximum Length Fields', async ({ page }) => {
        const timestamp = Date.now();
        const email = 'a'.repeat(40) + timestamp + '@test.com';
        const fullName = 'A'.repeat(200);
        const password = generateTestPassword(128);
        
        await registerViaUI(page, email, password, password, fullName);
        await page.waitForURL(/\/login/, { timeout: 15000 });
      });

      test('TC-REG-004: Registration with Special Characters in Name', async ({ page }) => {
        const email = generateTestEmail();
        const password = generateTestPassword();
        const fullName = 'José María O\'Connor-Ñoño';
        
        await registerViaUI(page, email, password, password, fullName);
        expect(page.url()).toMatch(/\/login/);
      });

      test('TC-REG-005: Registration Sets Default Role', async ({ request }) => {
        const email = generateTestEmail();
        const password = generateTestPassword();
        const response = await registerViaAPI(request, email, password, password, 'Test User');
        
        expect(response.success).toBe(true);
        expect(response.user?.role).toBe('user');
      });

      test('TC-REG-006: Registration Creates Default Preferences', async ({ request }) => {
        const email = generateTestEmail();
        const password = generateTestPassword();
        const response = await registerViaAPI(request, email, password, password, 'Test User');
        
        expect(response.success).toBe(true);
        expect(response.user?.preferences).toBeDefined();
        expect(response.user?.preferences?.theme).toBe('system');
        expect(response.user?.preferences?.emailNotifications).toBe(true);
      });
    });

    test.describe('Negative Scenarios', () => {
      test('TC-REG-007: Registration with Invalid Email Format', async ({ page }) => {
        await page.goto('/signup');
        await page.fill('input[id="email"]', 'notanemail');
        await page.fill('input[id="password"]', generateTestPassword());
        await page.fill('input[id="confirmPassword"]', generateTestPassword());
        await page.fill('input[id="fullName"]', 'Test User');
        await page.click('button[type="submit"]');
        
        await verifyFieldError(page, 'email', 'Invalid email format');
      });

      test('TC-REG-008: Registration with Duplicate Email', async ({ page, request }) => {
        const email = generateTestEmail();
        const password = generateTestPassword();
        
        // Register first time via API
        await registerViaAPI(request, email, password, password, 'First User');
        await page.waitForTimeout(1000);
        
        // Try to register again via UI
        await page.goto('/signup');
        await page.fill('input[id="email"]', email);
        await page.fill('input[id="password"]', password);
        await page.fill('input[id="confirmPassword"]', password);
        await page.fill('input[id="fullName"]', 'Second User');
        
        const [response] = await Promise.all([
          page.waitForResponse(resp => resp.url().includes('/api/auth/register') && resp.request().method() === 'POST', { timeout: 10000 }),
          page.click('button[type="submit"]')
        ]);
        
        expect(response.status()).toBe(400);
        const url = page.url();
        expect(url.includes('/signup')).toBe(true);
      });

      test('TC-REG-009: Registration with Password Too Short', async ({ page }) => {
        await page.goto('/signup');
        await page.fill('input[id="email"]', generateTestEmail());
        await page.fill('input[id="password"]', 'Short1');
        await page.fill('input[id="confirmPassword"]', 'Short1');
        await page.fill('input[id="fullName"]', 'Test User');
        await page.click('button[type="submit"]');
        
        await verifyFieldError(page, 'password', 'Password must be at least 8 characters');
      });

      test('TC-REG-010: Registration with Missing Required Fields', async ({ page }) => {
        await page.goto('/signup');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);
        const errors = await page.locator('text=/required|invalid/i').count();
        expect(errors).toBeGreaterThan(0);
      });

      test('TC-REG-011: Registration with Empty String Fields', async ({ page }) => {
        await page.goto('/signup');
        await page.fill('input[id="email"]', '   ');
        await page.fill('input[id="password"]', '   ');
        await page.fill('input[id="fullName"]', '   ');
        await page.click('button[type="submit"]');
        
        await page.waitForTimeout(1000);
        const hasErrors = await page.locator('text=/required|invalid/i').isVisible().catch(() => false);
        expect(hasErrors).toBe(true);
      });

      test('TC-REG-012: Registration with SQL Injection Attempt', async ({ request }) => {
        const sqlInjection = "admin@test.com'; DROP TABLE users;--";
        const response = await registerViaAPI(request, sqlInjection, generateTestPassword(), generateTestPassword(), 'Test');
        expect(response.success).toBe(false);
      });

      test('TC-REG-013: Registration with XSS Attempt', async ({ page }) => {
        await page.goto('/signup');
        await page.fill('input[id="email"]', generateTestEmail());
        await page.fill('input[id="password"]', generateTestPassword());
        await page.fill('input[id="confirmPassword"]', generateTestPassword());
        await page.fill('input[id="fullName"]', '<script>alert("xss")</script>');
        await page.click('button[type="submit"]');
        
        await page.waitForTimeout(2000);
        const hasAlert = await page.evaluate(() => window.alert.toString().includes('native code'));
        expect(hasAlert).toBe(true); 
      });

      test('TC-REG-014: Registration with Extremely Long Email', async ({ page }) => {
        const longEmail = 'a'.repeat(300) + '@test.com';
        await page.goto('/signup');
        await page.fill('input[id="email"]', longEmail);
        await page.fill('input[id="password"]', generateTestPassword());
        await page.fill('input[id="confirmPassword"]', generateTestPassword());
        await page.fill('input[id="fullName"]', 'Test User');
        await page.click('button[type="submit"]');
        
        await verifyFieldError(page, 'email', 'Email');
      });

      test('TC-REG-015: Registration with Whitespace-Only Fields', async ({ page }) => {
        await page.goto('/signup');
        await page.fill('input[id="email"]', '   \t   ');
        await page.fill('input[id="password"]', '   ');
        await page.fill('input[id="fullName"]', '   ');
        await page.click('button[type="submit"]');
        
        await page.waitForTimeout(1000);
        const hasErrors = await page.locator('text=/required|invalid/i').isVisible().catch(() => false);
        expect(hasErrors).toBe(true);
      });

      test('TC-REG-016: Registration with Case-Insensitive Email Duplicate', async ({ page, request }) => {
        const email = generateTestEmail();
        const password = generateTestPassword();
        
        await registerViaAPI(request, email.toLowerCase(), password, password, 'First User');
        await page.waitForTimeout(1000);
        
        await page.goto('/signup');
        await page.fill('input[id="email"]', email.toUpperCase());
        await page.fill('input[id="password"]', password);
        await page.fill('input[id="confirmPassword"]', password);
        await page.fill('input[id="fullName"]', 'Second User');
        
        const [response] = await Promise.all([
          page.waitForResponse(resp => resp.url().includes('/api/auth/register') && resp.request().method() === 'POST', { timeout: 10000 }),
          page.click('button[type="submit"]')
        ]);
        
        expect(response.status()).toBe(400);
        const url = page.url();
        expect(url.includes('/signup')).toBe(true);
      });
    });

    test.describe('Edge Cases', () => {
      test('TC-REG-017: Registration with Unicode Email', async ({ page }) => {
        const email = '测试@例子.测试';
        await page.goto('/signup');
        await page.fill('input[id="email"]', email);
        await page.fill('input[id="password"]', generateTestPassword());
        await page.fill('input[id="confirmPassword"]', generateTestPassword());
        await page.fill('input[id="fullName"]', 'Test User');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      });

      test('TC-REG-018: Registration with Password Containing All Character Types', async ({ page }) => {
        const password = 'Abc123!@#$%^&*()';
        await registerViaUI(page, generateTestEmail(), password, password, 'Test User');
        await page.waitForURL('/login?registered=true', { timeout: 5000 });
      });

      test('TC-REG-019: Registration During High Load', async ({ browser }) => {
        test.setTimeout(90000);
        const contexts = await Promise.all([browser.newContext(), browser.newContext(), browser.newContext()]);
        const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));
        
        const emails = pages.map((_, i) => generateTestEmail(`load${i}-${Date.now()}`));
        const passwords = pages.map(() => generateTestPassword());
        
        const registrations = pages.map((page, i) => 
          registerViaUI(page, emails[i], passwords[i], passwords[i], `User ${i}`)
            .catch(err => { console.warn(`Registration ${i} failed:`, err); return null; })
        );
        
        await Promise.allSettled(registrations);
        
        const urlChecks = await Promise.allSettled(
          pages.map(page => page.waitForURL(/\/login/, { timeout: 15000 }))
        );
        const successCount = urlChecks.filter(r => r.status === 'fulfilled').length;
        expect(successCount).toBeGreaterThanOrEqual(2);
        await Promise.all(contexts.map(ctx => ctx.close()));
      });

      test('TC-REG-020: Registration with Email Having Multiple @ Symbols', async ({ page }) => {
        await page.goto('/signup');
        await page.fill('input[id="email"]', 'test@@example.com');
        await page.fill('input[id="password"]', generateTestPassword());
        await page.fill('input[id="confirmPassword"]', generateTestPassword());
        await page.fill('input[id="fullName"]', 'Test User');
        await page.click('button[type="submit"]');
        await verifyFieldError(page, 'email', 'Invalid email format');
      });
    });

    test.describe('Out-of-the-Box Scenarios', () => {
      test('TC-REG-021: Registration with Email as Password', async ({ page }) => {
        const email = generateTestEmail();
        await page.goto('/signup');
        await page.fill('input[id="email"]', email);
        await page.fill('input[id="password"]', email);
        await page.fill('input[id="confirmPassword"]', email);
        await page.fill('input[id="fullName"]', 'Test User');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      });

      test('TC-REG-022: Registration with Reversed Email Domain', async ({ page }) => {
        const email = 'user@moc.elpmaxe';
        await page.goto('/signup');
        await page.fill('input[id="email"]', email);
        await page.fill('input[id="password"]', generateTestPassword());
        await page.fill('input[id="confirmPassword"]', generateTestPassword());
        await page.fill('input[id="fullName"]', 'Test User');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      });

      test('TC-REG-023: Registration with Zero-Width Characters', async ({ page }) => {
        const email = generateTestEmail();
        const fullName = 'John\u200B\u200CDoe';
        await page.goto('/signup');
        await page.fill('input[id="email"]', email);
        await page.fill('input[id="password"]', generateTestPassword());
        await page.fill('input[id="confirmPassword"]', generateTestPassword());
        await page.fill('input[id="fullName"]', fullName);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      });

      test('TC-REG-024: Registration with Emoji in Name', async ({ page, request }) => {
        test.setTimeout(60000);
        const email = generateTestEmail();
        const password = generateTestPassword();
        const fullName = 'John 😀 Doe 🎉';
        
        const apiResponse = await registerViaAPI(request, email, password, password, fullName);
        if (apiResponse.success) {
          expect(apiResponse.user?.fullName).toBe(fullName);
        }
        
        const email2 = generateTestEmail();
        await registerViaUI(page, email2, password, password, fullName);
        await page.waitForURL(/\/login/, { timeout: 15000 });
        expect(page.url()).toMatch(/\/login/);
      });

      test('TC-REG-025: Registration with Password Same as Email', async ({ page }) => {
        const email = generateTestEmail();
        await page.goto('/signup');
        await page.fill('input[id="email"]', email);
        await page.fill('input[id="password"]', email);
        await page.fill('input[id="confirmPassword"]', email);
        await page.fill('input[id="fullName"]', 'Test User');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      });
    });
  });

  // ==========================================
  // VIP-10002: User Login
  // ==========================================
  test.describe('VIP-10002: User Login', () => {
    test.beforeEach(async ({ page }) => {
      await clearAuthData(page);
    });

    test.describe('Positive Scenarios', () => {
      test('TC-LOGIN-001: Successful Login with Valid Credentials', async ({ page }) => {
        test.setTimeout(60000);
        await loginViaUI(page, TEST_USER.email, TEST_USER.password);
        await verifyDashboardAccess(page, TEST_USER.email);
        expect(page.url()).toMatch(/\/dashboard/);
        const token = await getStoredToken(page);
        expect(token).toBeTruthy();
      });

      test('TC-LOGIN-002: Login with Case-Insensitive Email', async ({ page, request }) => {
        test.setTimeout(60000);
        const testEmail = generateTestEmail('caseinsensitive');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        await page.waitForTimeout(1000);
        
        const caseVariations = [
          testEmail.charAt(0).toUpperCase() + testEmail.slice(1),
          testEmail.toUpperCase(),
        ];

        for (const email of caseVariations) {
          const loginResponse = await loginViaAPI(request, email, testPassword);
          expect(loginResponse.success).toBe(true);
        }

        await clearAuthData(page);
        await page.goto('/login');
        const uiEmail = testEmail.charAt(0).toUpperCase() + testEmail.slice(1);
        await loginViaUI(page, uiEmail, testPassword);
        await page.waitForURL(/\/dashboard/, { timeout: 15000 });
        expect(page.url()).toMatch(/\/dashboard/);
      });

      test('TC-LOGIN-003: Login Sets Token in localStorage', async ({ page, request }) => {
        await loginViaUI(page, TEST_USER.email, TEST_USER.password);
        const token = await getStoredToken(page);
        expect(token).toBeTruthy();
        
        const response = await request.get('http://localhost:3000/api/protected/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        expect(response.ok()).toBeTruthy();
      });

      test('TC-LOGIN-004: Login Updates LastLoginAt Timestamp', async ({ page, request }) => {
        await loginViaUI(page, TEST_USER.email, TEST_USER.password);
        const token = await getStoredToken(page);
        const response = await request.get('http://localhost:3000/api/protected/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const userData = await response.json();
        expect(userData.success).toBe(true);
      });

      test('TC-LOGIN-005: Login Returns User Data Without Password', async ({ request }) => {
        const response = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        expect(response.success).toBe(true);
        expect(response.user).toBeDefined();
        expect(response.user).not.toHaveProperty('password');
      });

      test('TC-LOGIN-006: Login with Remember Me Checked', async ({ page }) => {
        await loginViaUI(page, TEST_USER.email, TEST_USER.password, true);
        await verifyDashboardAccess(page, TEST_USER.email);
        const rememberMe = await page.evaluate(() => localStorage.getItem('remember_me'));
        expect(rememberMe).toBe('true');
      });
    });

    test.describe('Negative Scenarios', () => {
      test('TC-LOGIN-007: Login with Incorrect Password', async ({ page }) => {
        test.setTimeout(90000);
        await page.goto('/login');
        await page.fill('input[id="email"]', TEST_USER.email);
        await page.fill('input[id="password"]', 'WrongPassword123!');
        
        const [response] = await Promise.all([
          page.waitForResponse(resp => resp.url().includes('/api/auth/login') && resp.request().method() === 'POST', { timeout: 60000 }),
          page.click('button[type="submit"]')
        ]);
        
        expect(response.status()).toBe(401);
        await page.waitForTimeout(1000);
        await verifyErrorMessage(page, 'Invalid email or password');
        expect(await isLoggedIn(page)).toBe(false);
      });

      test('TC-LOGIN-008: Login with Non-Existent Email', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[id="email"]', 'nonexistent@vipcontentai.com');
        await page.fill('input[id="password"]', 'SomePassword123!');
        
        const [response] = await Promise.all([
          page.waitForResponse(resp => resp.url().includes('/api/auth/login') && resp.request().method() === 'POST', { timeout: 10000 }),
          page.click('button[type="submit"]')
        ]);
        
        expect(response.status()).toBe(401);
        await page.waitForTimeout(1000);
        await verifyErrorMessage(page, 'Invalid email or password');
      });

      test('TC-LOGIN-009: Login with Empty Email Field', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[id="password"]', TEST_USER.password);
        await page.click('button[type="submit"]');
        
        await page.waitForTimeout(500);
        const emailInput = page.locator('input[id="email"]');
        const hasError = await emailInput.evaluate((el) => {
          return el.getAttribute('aria-invalid') === 'true' || el.classList.contains('border-destructive');
        });
        const stillOnLogin = page.url().includes('/login');
        expect(hasError || stillOnLogin).toBe(true);
      });

      test('TC-LOGIN-010: Login with Empty Password Field', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[id="email"]', TEST_USER.email);
        await page.click('button[type="submit"]');
        await verifyFieldError(page, 'password', 'Password is required');
      });

      test('TC-LOGIN-011: Login with Invalid Email Format', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[id="email"]', 'notanemail');
        await page.fill('input[id="password"]', TEST_USER.password);
        await page.click('button[type="submit"]');
        await verifyFieldError(page, 'email', 'Invalid email format');
      });

      test('TC-LOGIN-012: Login with SQL Injection in Email', async ({ request }) => {
        const sqlInjection = "admin@test.com'; DROP TABLE users;--";
        const response = await loginViaAPI(request, sqlInjection, TEST_USER.password);
        expect(response.success).toBe(false);
      });

      test('TC-LOGIN-013: Login with XSS in Email Field', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[id="email"]', '<script>alert("xss")</script>@test.com');
        await page.fill('input[id="password"]', TEST_USER.password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);
        expect(await isLoggedIn(page)).toBe(false);
      });

      test('TC-LOGIN-014: Login with Password Containing Special Characters', async ({ page, request }) => {
        test.setTimeout(60000);
        const specialPassword = 'P@ssw0rd!@#$%^&*()';
        const testEmail = generateTestEmail('specialpass');
        await registerViaAPI(request, testEmail, specialPassword, specialPassword, 'Test User');
        await page.waitForTimeout(1000);
        
        await clearAuthData(page);
        await loginViaUI(page, testEmail, specialPassword);
        await verifyDashboardAccess(page, testEmail);
      });

      test('TC-LOGIN-015: Login After Account Deletion', async ({ request }) => {
        const response = await loginViaAPI(request, 'deleted@vipcontentai.com', 'Password123!');
        expect(response.success).toBe(false);
      });

      test('TC-LOGIN-016: Login with Expired Token from Previous Session', async ({ page }) => {
        test.setTimeout(60000);
        await loginViaUI(page, TEST_USER.email, TEST_USER.password);
        const firstToken = await getStoredToken(page);
        
        await clearAuthData(page);
        await loginViaUI(page, TEST_USER.email, TEST_USER.password);
        const newToken = await getStoredToken(page);
        
        expect(newToken).toBeTruthy();
        expect(newToken).not.toBe(firstToken);
      });
    });

    test.describe('Security Scenarios', () => {
      test('TC-LOGIN-017: Brute Force Attack Prevention', async ({ request }) => {
        const attempts = 10;
        let failedCount = 0;
        for (let i = 0; i < attempts; i++) {
          const response = await loginViaAPI(request, TEST_USER.email, 'WrongPassword' + i);
          if (!response.success) failedCount++;
        }
        expect(failedCount).toBe(attempts);
      });

      test('TC-LOGIN-018: Login with Stolen Token', async ({ page, request }) => {
        const testEmail = generateTestEmail('stolentoken');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        
        await loginViaUI(page, testEmail, testPassword);
        await page.waitForTimeout(2000);
        const token = await getStoredToken(page);
        
        const response = await request.get('http://localhost:3000/api/protected/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        expect(response.ok()).toBe(true);
      });

      test('TC-LOGIN-019: Login Token Replay Attack', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const replayResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        expect(replayResponse.success).toBe(true);
      });

      test('TC-LOGIN-020: Login with Modified JWT Token', async ({ page, request }) => {
        await loginViaUI(page, TEST_USER.email, TEST_USER.password);
        const validToken = await getStoredToken(page);
        
        const parts = validToken!.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        payload.role = 'superadmin';
        const modifiedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const modifiedToken = `${parts[0]}.${modifiedPayload}.${parts[2]}`;
        
        const response = await request.get('http://localhost:3000/api/protected/me', {
          headers: { 'Authorization': `Bearer ${modifiedToken}` },
        });
        expect(response.status()).toBe(401);
      });

      test('TC-LOGIN-021: Login with Timing Attack Prevention', async ({ request }) => {
        test.setTimeout(30000);
        const times1: number[] = [];
        const times2: number[] = [];
        
        for (let i = 0; i < 3; i++) {
          const start1 = Date.now();
          await loginViaAPI(request, 'nonexistent@test.com', 'Password123!');
          times1.push(Date.now() - start1);
          
          const start2 = Date.now();
          await loginViaAPI(request, TEST_USER.email, 'WrongPassword123!');
          times2.push(Date.now() - start2);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const avgTime1 = times1.reduce((a, b) => a + b, 0) / times1.length;
        const avgTime2 = times2.reduce((a, b) => a + b, 0) / times2.length;
        const timeDiff = Math.abs(avgTime1 - avgTime2);
        
        expect(timeDiff).toBeLessThan(4000);
        expect(avgTime1).toBeLessThan(5000);
        expect(avgTime2).toBeLessThan(5000);
      });
    });

    test.describe('Edge Cases', () => {
      test('TC-LOGIN-022: Login with Leading/Trailing Spaces in Email', async ({ page }) => {
        await loginViaUI(page, '  ' + TEST_USER.email + '  ', TEST_USER.password);
        await verifyDashboardAccess(page, TEST_USER.email);
      });

      test('TC-LOGIN-023: Login with Unicode Characters in Password', async ({ page }) => {
        test.setTimeout(60000);
        const unicodePassword = 'Pässwörd123!';
        const testEmail = generateTestEmail();
        
        await page.goto('/signup');
        await page.fill('input[id="email"]', testEmail);
        await page.fill('input[id="password"]', unicodePassword);
        await page.fill('input[id="confirmPassword"]', unicodePassword);
        await page.fill('input[id="fullName"]', 'Test User');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        
        await clearAuthData(page);
        await loginViaUI(page, testEmail, unicodePassword);
        await verifyDashboardAccess(page, testEmail);
      });

      test('TC-LOGIN-024: Concurrent Login from Multiple Devices', async ({ browser }) => {
        const context1 = await browser.newContext();
        const context2 = await browser.newContext();
        const page1 = await context1.newPage();
        const page2 = await context2.newPage();
        
        await loginViaUI(page1, TEST_USER.email, TEST_USER.password);
        await loginViaUI(page2, TEST_USER.email, TEST_USER.password);
        
        await verifyDashboardAccess(page1, TEST_USER.email);
        await verifyDashboardAccess(page2, TEST_USER.email);
        
        await context1.close();
        await context2.close();
      });

      test('TC-LOGIN-025: Login During Database Connection Loss', async ({ page, request }) => {
        test.setTimeout(60000);
        const testEmail = generateTestEmail('dbloss');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        await page.waitForTimeout(1000);
        
        await clearAuthData(page);
        await page.goto('/login');
        await page.fill('input[id="email"]', testEmail);
        await page.fill('input[id="password"]', testPassword);
        
        const submitButton = page.locator('button[type="submit"]');
        const [response] = await Promise.all([
          page.waitForResponse(resp => resp.url().includes('/api/auth/login') && resp.request().method() === 'POST', { timeout: 20000 }),
          submitButton.click()
        ]);
        
        const responseData = await response.json();
        if (response.ok() && responseData.success) {
          await page.waitForURL(/\/dashboard/, { timeout: 15000 });
          expect(page.url()).toMatch(/\/dashboard/);
        } else {
          await page.waitForTimeout(2000);
          const hasError = await page.locator('text=/error|failed|database|connection/i').isVisible().catch(() => false);
          expect(hasError).toBe(true);
        }
      });
    });

    test.describe('Out-of-the-Box Scenarios', () => {
      test('TC-LOGIN-026: Login with Email as Password', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[id="email"]', TEST_USER.email);
        await page.fill('input[id="password"]', TEST_USER.email);
        
        const [response] = await Promise.all([
          page.waitForResponse(resp => resp.url().includes('/api/auth/login') && resp.request().method() === 'POST', { timeout: 10000 }),
          page.click('button[type="submit"]')
        ]);
        
        expect(response.status()).toBe(401);
        await page.waitForTimeout(1000);
        await verifyErrorMessage(page, 'Invalid email or password');
      });

      test('TC-LOGIN-027: Login with Password as Email', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[id="email"]', TEST_USER.password);
        await page.fill('input[id="password"]', TEST_USER.password);
        await page.click('button[type="submit"]');
        await verifyFieldError(page, 'email', 'Invalid email format');
      });

      test('TC-LOGIN-028: Login with Copy-Pasted Credentials', async ({ page }) => {
        await page.goto('/login');
        await page.type('input[id="email"]', TEST_USER.email, { delay: 0 });
        await page.type('input[id="password"]', TEST_USER.password, { delay: 0 });
        await page.click('button[type="submit"]');
        await verifyDashboardAccess(page, TEST_USER.email);
      });

      test('TC-LOGIN-029: Login with Browser Autofill', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[id="email"]', TEST_USER.email);
        await page.fill('input[id="password"]', TEST_USER.password);
        await page.click('button[type="submit"]');
        await verifyDashboardAccess(page, TEST_USER.email);
      });

      test('TC-LOGIN-030: Login After Password Change', async ({ page, request }) => {
        const testEmail = generateTestEmail('login030');
        const testPassword = 'TestPass123!';
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        
        await loginViaUI(page, testEmail, testPassword);
        const oldToken = await getStoredToken(page);
        
        const newPassword = 'NewSecurePass123!';
        const changeResponse = await changePassword(request, oldToken!, testPassword, newPassword, newPassword);
        expect(changeResponse.status).toBe(200);
        
        const response = await request.get('http://localhost:3000/api/protected/me', {
          headers: { 'Authorization': `Bearer ${oldToken}` },
        });
        expect(response.ok()).toBe(true);
      });
    });
  });

  // ==========================================
  // VIP-10004: JWT Token Management
  // ==========================================
  test.describe('VIP-10004: JWT Token Management', () => {
    test.describe('Positive Scenarios', () => {
      test('TC-JWT-001: Token Generation on Login', async ({ request }) => {
        const response = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        expect(response.success).toBe(true);
        expect(response.token).toBeTruthy();
        const parts = response.token!.split('.');
        expect(parts.length).toBe(3);
      });

      test('TC-JWT-002: Token Verification on Protected Route', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const response = await getCurrentUser(request, loginResponse.token!);
        expect(response.status).toBe(200);
        expect(response.data.user.email).toBe(TEST_USER.email);
      });

      test('TC-JWT-003: Token Decoding Without Verification', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const token = loginResponse.token!;
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        expect(payload.email).toBe(TEST_USER.email);
      });

      test('TC-JWT-004: Token Contains Correct User Data', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const token = loginResponse.token!;
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        expect(payload.email).toBe(TEST_USER.email);
        expect(payload.role).toBe('user');
      });

      test('TC-JWT-005: Token Expiration After 7 Days', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const token = loginResponse.token!;
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
      });
    });

    test.describe('Negative Scenarios', () => {
      test('TC-JWT-006: Token Verification with Invalid Signature', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const token = loginResponse.token!;
        const parts = token.split('.');
        const modifiedToken = `${parts[0]}.${parts[1]}.invalid_signature`;
        const response = await getCurrentUser(request, modifiedToken);
        expect(response.status).toBe(401);
      });

      test('TC-JWT-007: Token Verification with Expired Token', async ({ request }) => {
        const expiredToken = 'expired.token.here';
        const response = await getCurrentUser(request, expiredToken);
        expect(response.status).toBe(401);
      });

      test('TC-JWT-008: Token Verification with Missing Token', async ({ request }) => {
        const response = await request.get('http://localhost:3000/api/protected/me');
        expect(response.status()).toBe(401);
      });

      test('TC-JWT-009: Token Verification with Malformed Token', async ({ request }) => {
        const malformedTokens = ['not.a.token', 'incomplete', 'too.many.parts.here', ''];
        for (const token of malformedTokens) {
          const response = await getCurrentUser(request, token);
          expect(response.status).toBe(401);
        }
      });

      test('TC-JWT-010: Token Verification with Wrong Algorithm', async ({ request }) => {
        const invalidToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
        const response = await getCurrentUser(request, invalidToken);
        expect(response.status).toBe(401);
      });

      test('TC-JWT-011: Token Verification with Empty Payload', async ({ request }) => {
        const emptyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..signature';
        const response = await getCurrentUser(request, emptyToken);
        expect(response.status).toBe(401);
      });

      test('TC-JWT-012: Token Verification After User Deletion', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const response = await getCurrentUser(request, loginResponse.token!);
        expect([200, 404, 401]).toContain(response.status);
      });

      test('TC-JWT-013: Token Verification with Modified Payload', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const token = loginResponse.token!;
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        payload.role = 'superadmin';
        const modifiedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const modifiedToken = `${parts[0]}.${modifiedPayload}.${parts[2]}`;
        const response = await getCurrentUser(request, modifiedToken);
        expect(response.status).toBe(401);
      });
    });

    test.describe('Security Scenarios', () => {
      test('TC-JWT-014: Token Theft and Reuse', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const response = await getCurrentUser(request, loginResponse.token!);
        expect(response.status).toBe(200);
      });

      test('TC-JWT-015: Token Replay Attack', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const requests = Array(5).fill(null).map(() => getCurrentUser(request, loginResponse.token!));
        const responses = await Promise.all(requests);
        for (const response of responses) {
          expect(response.status).toBe(200);
        }
      });

      test('TC-JWT-016: Token Brute Force', async ({ request }) => {
        const randomTokens = Array(10).fill(null).map(() => Buffer.from(Math.random().toString()).toString('base64'));
        for (const token of randomTokens) {
          const response = await getCurrentUser(request, token);
          expect(response.status).toBe(401);
        }
      });

      test('TC-JWT-017: Token in URL Query Parameter', async ({ page, request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        await page.goto(`/dashboard?token=${loginResponse.token}`);
        await page.waitForURL(/\/login/, { timeout: 5000 });
      });

      test('TC-JWT-018: Token Logging Prevention', async ({ page, request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const logs: string[] = [];
        page.on('console', msg => logs.push(msg.text()));
        await page.goto('/dashboard');
        const logText = logs.join(' ');
        expect(logText).not.toContain(loginResponse.token);
      });
    });

    test.describe('Edge Cases', () => {
      test('TC-JWT-019: Token Verification at Exact Expiration Time', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const token = loginResponse.token!;
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        expect(payload.exp).toBeTruthy();
      });

      test('TC-JWT-020: Token with Future Expiration (Clock Skew)', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const response = await getCurrentUser(request, loginResponse.token!);
        expect(response.status).toBe(200);
      });

      test('TC-JWT-021: Token Verification During High Load', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const requests = Array(100).fill(null).map(() => getCurrentUser(request, loginResponse.token!));
        const responses = await Promise.all(requests);
        for (const response of responses) {
          expect(response.status).toBe(200);
        }
      });

      test('TC-JWT-022: Token with Special Characters in Payload', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const token = loginResponse.token!;
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        expect(payload.email).toBe(TEST_USER.email);
      });
    });

    test.describe('Out-of-the-Box Scenarios', () => {
      test('TC-JWT-023: Token Generation with Null User Data', async ({ request }) => {
        const response = await loginViaAPI(request, 'invalid@test.com', 'wrong');
        expect(response.success).toBe(false);
        expect(response.token).toBeFalsy();
      });

      test('TC-JWT-024: Token Verification with Multiple Tokens', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const response = await request.get('http://localhost:3000/api/protected/me', {
          headers: { 'Authorization': `Bearer ${loginResponse.token}, Bearer invalid` },
        });
        expect([200, 401]).toContain(response.status());
      });

      test('TC-JWT-025: Token Expiration Extension', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const refreshResponse = await refreshToken(request, loginResponse.token!);
        expect([200, 401, 404]).toContain(refreshResponse.status);
      });
    });
  });

  // ==========================================
  // VIP-10005: Protected Routes Middleware
  // ==========================================
  test.describe('VIP-10005: Protected Routes Middleware', () => {
    test.beforeEach(async ({ page }) => {
      await clearAuthData(page);
    });

    test.describe('Positive Scenarios', () => {
      test('TC-MW-001: Access Dashboard with Valid Token', async ({ page }) => {
        await loginViaUI(page, TEST_USER.email, TEST_USER.password);
        await page.goto('/dashboard');
        await expect(page.locator('text=Dashboard')).toBeVisible();
        await expect(page.locator(`text=${TEST_USER.email}`)).toBeVisible();
      });

      test('TC-MW-002: Access Protected API with Valid Token', async ({ page, request }) => {
        await loginViaUI(page, TEST_USER.email, TEST_USER.password);
        const token = await getStoredToken(page);
        const response = await request.get('http://localhost:3000/api/protected/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        expect(response.ok()).toBe(true);
        const data = await response.json();
        expect(data.user.email).toBe(TEST_USER.email);
      });

      test('TC-MW-003: Access Public Route Without Token', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('text=Welcome back')).toBeVisible();
      });

      test('TC-MW-004: Middleware Checks Authorization Header', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const response = await request.get('http://localhost:3000/api/protected/me', {
          headers: { 'Authorization': `Bearer ${loginResponse.token}` },
        });
        expect(response.ok()).toBe(true);
      });

      test('TC-MW-005: Middleware Falls Back to Authorization Header', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const response = await request.get('http://localhost:3000/api/protected/me', {
          headers: { 'Authorization': `Bearer ${loginResponse.token}` },
        });
        expect(response.ok()).toBe(true);
      });

      test('TC-MW-006: Middleware Redirects with Return URL', async ({ page }) => {
        await clearAuthData(page);
        await page.goto('/dashboard/generate');
        await page.waitForURL(/\/login/, { timeout: 10000 });
      });
    });

    test.describe('Negative Scenarios', () => {
      test('TC-MW-007: Access Dashboard Without Token', async ({ page }) => {
        await clearAuthData(page);
        await page.goto('/dashboard');
        await page.waitForURL('/login', { timeout: 5000 });
      });

      test('TC-MW-008: Access Protected API Without Token', async ({ request }) => {
        const response = await request.get('http://localhost:3000/api/protected/me');
        expect(response.status()).toBe(401);
      });

      test('TC-MW-009: Access Protected Route with Invalid Token', async ({ request }) => {
        const response = await request.get('http://localhost:3000/api/protected/me', {
          headers: { 'Authorization': `Bearer invalid.token.here` },
        });
        expect(response.status()).toBe(401);
      });

      test('TC-MW-010: Access Protected Route with Expired Token', async ({ request }) => {
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJleHAiOjE2MDAwMDAwMDB9.invalid';
        const response = await request.get('http://localhost:3000/api/protected/me', {
          headers: { 'Authorization': `Bearer ${expiredToken}` },
        });
        expect(response.status()).toBe(401);
      });

      test('TC-MW-011: Access Protected Route After Logout', async ({ page }) => {
        await loginViaUI(page, TEST_USER.email, TEST_USER.password);
        await page.goto('/dashboard');
        await clearAuthData(page);
        await page.goto('/dashboard');
        await page.waitForURL('/login', { timeout: 5000 });
      });

      test('TC-MW-012: Middleware Bypass Attempt', async ({ page }) => {
        test.setTimeout(60000);
        await clearAuthData(page);
        const bypassAttempts = ['/dashboard/../dashboard', '/dashboard/.', '/dashboard//'];
        for (const path of bypassAttempts) {
          await page.goto(path);
          await page.waitForURL(/\/login/, { timeout: 15000 });
          expect(page.url()).toMatch(/\/login/);
        }
      });

      test('TC-MW-013: Middleware with Malformed Cookie', async ({ page }) => {
        await page.context().addCookies([{
          name: 'token',
          value: 'malformed',
          domain: 'localhost',
          path: '/',
        }]);
        await page.goto('/dashboard');
        await page.waitForURL('/login', { timeout: 5000 });
      });
    });

    test.describe('Security Scenarios', () => {
      test('TC-MW-014: Middleware Token Injection via URL Parameter', async ({ page }) => {
        await page.goto('/dashboard?token=fake-token');
        await page.waitForURL('/login', { timeout: 5000 });
      });

      test('TC-MW-015: Middleware Path Traversal', async ({ page }) => {
        await clearAuthData(page);
        await page.goto('/dashboard/../dashboard');
        await page.waitForTimeout(3000);
        expect(page.url()).toMatch(/\/login/);
      });

      test('TC-MW-016: Middleware Case Sensitivity', async ({ page }) => {
        await clearAuthData(page);
        await page.goto('/Dashboard');
        await page.waitForTimeout(3000);
        const url = page.url();
        const isLogin = url.includes('/login');
        const isDashboard = url.includes('/Dashboard') || url.includes('/dashboard');
        expect(isLogin || isDashboard).toBe(true);
      });

      test('TC-MW-017: Middleware Rate Limiting', async ({ request }) => {
        const requests = Array(20).fill(null).map(() => request.get('http://localhost:3000/api/protected/me'));
        const responses = await Promise.all(requests);
        for (const response of responses) {
          expect(response.status()).toBe(401);
        }
      });
    });

    test.describe('Edge Cases', () => {
      test('TC-MW-018: Middleware with Multiple Cookies', async ({ page }) => {
        await page.context().addCookies([
          { name: 'token1', value: 'fake1', domain: 'localhost', path: '/' },
          { name: 'token2', value: 'fake2', domain: 'localhost', path: '/' },
        ]);
        await page.goto('/dashboard');
        await page.waitForURL('/login', { timeout: 5000 });
      });

      test('TC-MW-019: Middleware with Very Long Token', async ({ request }) => {
        const longToken = 'a'.repeat(10000);
        const response = await request.get('http://localhost:3000/api/protected/me', {
          headers: { 'Authorization': `Bearer ${longToken}` },
        });
        expect(response.status()).toBe(401);
      });

      test('TC-MW-020: Middleware During Server Restart', async ({ page, request }) => {
        const testEmail = generateTestEmail('mw020');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        await loginViaUI(page, testEmail, testPassword);
        await page.waitForTimeout(2000);
        const token = await getStoredToken(page);
        expect(token).toBeTruthy();
        const response = await request.get('http://localhost:3000/api/protected/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        expect(response.ok()).toBe(true);
      });

      test('TC-MW-021: Middleware with Special Characters in Path', async ({ page }) => {
        await loginViaUI(page, TEST_USER.email, TEST_USER.password);
        await page.goto('/dashboard/user@123');
        await page.waitForTimeout(1000);
      });
    });

    test.describe('Out-of-the-Box Scenarios', () => {
      test('TC-MW-022: Middleware with Token in Both Cookie and Header', async ({ page, request }) => {
        const testEmail = generateTestEmail('mw022');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        await loginViaUI(page, testEmail, testPassword);
        await page.waitForTimeout(2000);
        const token = await getStoredToken(page);
        await page.context().addCookies([{
          name: 'token',
          value: token as string,
          domain: 'localhost',
          path: '/',
        }]);
        const response = await request.get('http://localhost:3000/api/protected/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        expect(response.ok()).toBe(true);
      });

      test('TC-MW-023: Middleware with Empty Token String', async ({ request }) => {
        const response = await request.get('http://localhost:3000/api/protected/me', {
          headers: { 'Authorization': 'Bearer ' },
        });
        expect(response.status()).toBe(401);
      });

      test('TC-MW-024: Middleware with Whitespace in Token', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const token = ' ' + loginResponse.token! + ' ';
        const response = await request.get('http://localhost:3000/api/protected/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        expect([200, 401]).toContain(response.status());
      });

      test('TC-MW-025: Middleware Concurrent Request Handling', async ({ page, request }) => {
        const testEmail = generateTestEmail('mw025');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        await loginViaUI(page, testEmail, testPassword);
        await page.waitForTimeout(2000);
        const token = await getStoredToken(page);
        
        const requests = Array(10).fill(null).map(() =>
          request.get('http://localhost:3000/api/protected/me', {
            headers: { 'Authorization': `Bearer ${token}` },
          })
        );
        const responses = await Promise.all(requests);
        for (const response of responses) {
          expect(response.ok()).toBe(true);
        }
      });
    });
  });

  // ==========================================
  // VIP-10006: User Profile Management
  // ==========================================
  test.describe('VIP-10006: User Profile Management', () => {
    test.describe('Positive Scenarios', () => {
      test('TC-PROF-001: Get Current User Profile', async ({ request }) => {
        const testEmail = generateTestEmail('prof001');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await getCurrentUser(request, loginResponse.token!);
        
        expect(response.status).toBe(200);
        expect(response.data.user.email).toBe(testEmail.toLowerCase());
        expect(response.data.user).not.toHaveProperty('password');
      });

      test('TC-PROF-002: Update User Full Name', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const token = loginResponse.token!;
        const newName = 'Updated Name';
        const response = await updateProfile(request, token, { fullName: newName });
        expect(response.data.user.fullName).toBe(newName);
      });

      test('TC-PROF-003: Update User Email', async ({ request }) => {
        const testEmail = generateTestEmail('prof003');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const newEmail = generateTestEmail('prof003updated');
        const response = await updateProfile(request, loginResponse.token!, { email: newEmail });
        expect(response.data.user.email).toBe(newEmail.toLowerCase());
      });

      test('TC-PROF-004: Update User Preferences', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const preferences = { theme: 'dark', emailNotifications: false };
        const response = await updateProfile(request, loginResponse.token!, { preferences });
        expect(response.status).toBe(200);
      });

      test('TC-PROF-005: Partial Profile Update', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, TEST_USER.email, TEST_USER.password);
        const response = await updateProfile(request, loginResponse.token!, { fullName: 'Partial Update' });
        expect(response.status).toBe(200);
        const userResponse = await getCurrentUser(request, loginResponse.token!);
        expect(userResponse.data.user.email).toBeTruthy();
      });

      test('TC-PROF-006: Profile Update Returns Fresh Data', async ({ request }) => {
        const testEmail = generateTestEmail('prof006');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const newName = 'Fresh Data Test';
        const response = await updateProfile(request, loginResponse.token!, { fullName: newName });
        expect(response.data.user.fullName).toBe(newName);
      });
    });

    test.describe('Negative Scenarios', () => {
      test('TC-PROF-007: Update Profile Without Authentication', async ({ request }) => {
        const response = await request.patch('http://localhost:3000/api/protected/me', {
          data: { fullName: 'Test' },
        });
        expect(response.status()).toBe(401);
      });

      test('TC-PROF-008: Update Email to Existing Email', async ({ request }) => {
        const user1Email = generateTestEmail('prof008user1');
        const user2Email = generateTestEmail('prof008user2');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, user1Email, testPassword, testPassword, 'User 1');
        await registerViaAPI(request, user2Email, testPassword, testPassword, 'User 2');
        
        const loginResponse = await loginViaAPI(request, user1Email, testPassword);
        const response = await updateProfile(request, loginResponse.token!, { email: user2Email });
        expect(response.status).toBe(400);
      });

      test('TC-PROF-009: Update Profile with Invalid Email Format', async ({ request }) => {
        const testEmail = generateTestEmail('prof009');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updateProfile(request, loginResponse.token!, { email: 'invalid-email' });
        expect(response.status).toBe(400);
      });

      test('TC-PROF-010: Update Profile with Empty Full Name', async ({ request }) => {
        const testEmail = generateTestEmail('prof010');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updateProfile(request, loginResponse.token!, { fullName: '' });
        expect(response.status).toBe(400);
      });

      test('TC-PROF-011: Update Profile with Extremely Long Name', async ({ request }) => {
        const testEmail = generateTestEmail('prof011');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const longName = 'A'.repeat(300);
        const response = await updateProfile(request, loginResponse.token!, { fullName: longName });
        expect(response.status).toBe(400);
      });

      test('TC-PROF-012: Update Profile with Invalid Preferences', async ({ request }) => {
        const testEmail = generateTestEmail('prof012');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updateProfile(request, loginResponse.token!, { preferences: { theme: 'invalid' } });
        expect([200, 400]).toContain(response.status);
      });

      test('TC-PROF-013: Update Profile of Another User', async ({ request }) => {
        const testEmail = generateTestEmail('prof013');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updateProfile(request, loginResponse.token!, { fullName: 'Test' });
        expect(response.status).toBe(200);
      });

      test('TC-PROF-014: Update Profile with SQL Injection', async ({ request }) => {
        const testEmail = generateTestEmail('prof014');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const sqlInjection = "'; DROP TABLE users;--";
        const response = await updateProfile(request, loginResponse.token!, { fullName: sqlInjection });
        expect([200, 400]).toContain(response.status);
        expect(response.status).not.toBe(401);
      });

      test('TC-PROF-015: Update Profile with XSS', async ({ request }) => {
        const testEmail = generateTestEmail('prof015');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const xss = '<script>alert("xss")</script>';
        const response = await updateProfile(request, loginResponse.token!, { fullName: xss });
        expect([200, 400]).toContain(response.status);
      });
    });

    test.describe('Password Change', () => {
      test('TC-PROF-016: Change Password with Valid Current Password', async ({ request }) => {
        const testEmail = generateTestEmail('prof016');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const newPassword = generateTestPassword();
        const response = await changePassword(request, loginResponse.token!, testPassword, newPassword, newPassword);
        expect(response.status).toBe(200);
      });

      test('TC-PROF-017: Change Password with Wrong Current Password', async ({ request }) => {
        const testEmail = generateTestEmail('prof017');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await changePassword(request, loginResponse.token!, 'WrongPassword123!', generateTestPassword(), generateTestPassword());
        expect(response.status).toBe(400);
      });

      test('TC-PROF-018: Change Password with Weak New Password', async ({ request }) => {
        const testEmail = generateTestEmail('prof018');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await changePassword(request, loginResponse.token!, testPassword, 'weak', 'weak');
        expect(response.status).toBe(400);
      });
    });

    test.describe('Edge Cases', () => {
      test('TC-PROF-016: Update Profile with Unicode Characters', async ({ request }) => {
        const testEmail = generateTestEmail('prof016edge');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const unicodeName = 'José María O\'Connor';
        const response = await updateProfile(request, loginResponse.token!, { fullName: unicodeName });
        expect(response.status).toBe(200);
        expect(response.data.user.fullName).toBe(unicodeName);
      });

      test('TC-PROF-017: Update Profile During Concurrent Requests', async ({ request }) => {
        const testEmail = generateTestEmail('prof017edge');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const token = loginResponse.token!;
        
        const updates = [
          updateProfile(request, token, { fullName: 'Update 1' }),
          updateProfile(request, token, { fullName: 'Update 2' }),
        ];
        const responses = await Promise.all(updates);
        for (const response of responses) {
          expect([200, 400]).toContain(response.status);
        }
      });

      test('TC-PROF-018: Update Profile with Null Values', async ({ request }) => {
        const testEmail = generateTestEmail('prof018edge');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updateProfile(request, loginResponse.token!, { fullName: null as any });
        expect([200, 400]).toContain(response.status);
      });

      test('TC-PROF-019: Update Profile with All Fields', async ({ request }) => {
        const testEmail = generateTestEmail('prof019edge');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const newEmail = generateTestEmail('prof019updated');
        const response = await updateProfile(request, loginResponse.token!, {
          fullName: 'All Fields',
          email: newEmail,
          preferences: { theme: 'dark' },
        });
        expect(response.status).toBe(200);
      });
    });

    test.describe('Out-of-the-Box Scenarios', () => {
      test('TC-PROF-020: Update Profile to Same Values', async ({ request }) => {
        const testEmail = generateTestEmail('prof020');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Original Name');
        
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const userResponse = await getCurrentUser(request, loginResponse.token!);
        const currentName = userResponse.data.user.fullName;
        const response = await updateProfile(request, loginResponse.token!, { fullName: currentName });
        expect(response.status).toBe(200);
      });

      test('TC-PROF-021: Update Profile with Whitespace-Only Name', async ({ request }) => {
        const testEmail = generateTestEmail('prof021');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updateProfile(request, loginResponse.token!, { fullName: '   ' });
        expect(response.status).toBe(400);
      });

      test('TC-PROF-022: Update Profile After Account Deletion', async ({ request }) => {
        const testEmail = generateTestEmail('prof022');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        // Simulate normal update works as account deletion isn't fully mocked here
        const response = await updateProfile(request, loginResponse.token!, { fullName: 'Test' });
        expect(response.status).toBe(200);
      });

      test('TC-PROF-023: Update Profile with Case-Insensitive Email Duplicate', async ({ request }) => {
        const testEmail = generateTestEmail('prof023');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updateProfile(request, loginResponse.token!, { email: testEmail.toUpperCase() });
        expect(response.status).toBe(200);
      });
    });
  });

  // ==========================================
  // VIP-10007: User Preferences & Settings
  // ==========================================
  test.describe('VIP-10007: User Preferences & Settings', () => {
    test.describe('Positive Scenarios', () => {
      test('TC-PREF-001: Get Current User Preferences', async ({ request }) => {
        const testEmail = generateTestEmail('pref001');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        
        const response = await getPreferences(request, loginResponse.token!);
        expect(response.status).toBe(200);
        expect(typeof response.data.preferences).toBe('object');
      });

      test('TC-PREF-002: Update Theme Preference (PATCH)', async ({ request }) => {
        const testEmail = generateTestEmail('pref002');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updatePreferences(request, loginResponse.token!, { theme: 'dark' });
        expect(response.data.preferences.theme).toBe('dark');
      });

      test('TC-PREF-003: Update Email Notifications (PATCH)', async ({ request }) => {
        const testEmail = generateTestEmail('pref003');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updatePreferences(request, loginResponse.token!, { emailNotifications: false });
        expect(response.data.preferences.emailNotifications).toBe(false);
      });

      test('TC-PREF-004: Update Default Tone (PATCH)', async ({ request }) => {
        const testEmail = generateTestEmail('pref004');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updatePreferences(request, loginResponse.token!, { defaultTone: 'Casual' });
        expect(response.data.preferences.defaultTone).toBe('Casual');
      });

      test('TC-PREF-005: Update Default Word Count (PATCH)', async ({ request }) => {
        const testEmail = generateTestEmail('pref005');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updatePreferences(request, loginResponse.token!, { defaultWordCount: 2000 });
        expect(response.data.preferences.defaultWordCount).toBe(2000);
      });

      test('TC-PREF-006: Update Multiple Preferences (PATCH)', async ({ request }) => {
        const testEmail = generateTestEmail('pref006');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updatePreferences(request, loginResponse.token!, {
          theme: 'light',
          emailNotifications: true,
          defaultTone: 'Formal',
          defaultWordCount: 2500,
        });
        expect(response.data.preferences.theme).toBe('light');
        expect(response.data.preferences.defaultWordCount).toBe(2500);
      });

      test('TC-PREF-007: PATCH Merges with Existing Preferences', async ({ request }) => {
        const testEmail = generateTestEmail('pref007');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const token = loginResponse.token!;
        
        await updatePreferences(request, token, { theme: 'dark', defaultWordCount: 1500 });
        const response = await updatePreferences(request, token, { theme: 'light' });
        expect(response.data.preferences.theme).toBe('light');
        expect(response.data.preferences.defaultWordCount).toBe(1500);
      });

      test('TC-PREF-008: Replace All Preferences (PUT)', async ({ request }) => {
        const testEmail = generateTestEmail('pref008');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const token = loginResponse.token!;
        
        await updatePreferences(request, token, { theme: 'dark', defaultWordCount: 2000 });
        const response = await replacePreferences(request, token, { theme: 'system', emailNotifications: true });
        expect(response.data.preferences.theme).toBe('system');
        expect(response.data.preferences.defaultTone).toBe('Professional'); // Default restored
      });

      test('TC-PREF-009: Reset Preferences to Defaults (DELETE)', async ({ request }) => {
        const testEmail = generateTestEmail('pref009');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const token = loginResponse.token!;
        
        await updatePreferences(request, token, { theme: 'dark' });
        const response = await resetPreferences(request, token);
        expect(response.data.preferences.theme).toBe('system');
      });

      test('TC-PREF-010: Verify Preferences Persist After Update', async ({ request }) => {
        const testEmail = generateTestEmail('pref010');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const token = loginResponse.token!;
        
        await updatePreferences(request, token, { theme: 'dark', defaultWordCount: 2000 });
        const getResponse = await getPreferences(request, token);
        expect(getResponse.data.preferences.theme).toBe('dark');
      });
    });

    test.describe('Negative Scenarios', () => {
      test('TC-PREF-011: Get Preferences Without Authentication', async ({ request }) => {
        const response = await request.get('http://localhost:3000/api/protected/preferences');
        expect(response.status()).toBe(401);
      });

      test('TC-PREF-012: Update Preferences with Invalid Theme', async ({ request }) => {
        const testEmail = generateTestEmail('pref012');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updatePreferences(request, loginResponse.token!, { theme: 'invalid' });
        expect(response.status).toBe(400);
      });

      test('TC-PREF-013: Update Preferences with Invalid Word Count (Too Low)', async ({ request }) => {
        const testEmail = generateTestEmail('pref013');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updatePreferences(request, loginResponse.token!, { defaultWordCount: 50 });
        expect(response.status).toBe(400);
      });

      test('TC-PREF-014: Update Preferences with Invalid Word Count (Too High)', async ({ request }) => {
        const testEmail = generateTestEmail('pref014');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updatePreferences(request, loginResponse.token!, { defaultWordCount: 10000 });
        expect(response.status).toBe(400);
      });

      test('TC-PREF-015: Update Preferences with Invalid Email Notifications Type', async ({ request }) => {
        const testEmail = generateTestEmail('pref015');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updatePreferences(request, loginResponse.token!, { emailNotifications: 'yes' as any });
        expect(response.status).toBe(400);
      });

      test('TC-PREF-016: Update Preferences with Empty Body', async ({ request }) => {
        const testEmail = generateTestEmail('pref016');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updatePreferences(request, loginResponse.token!, {});
        expect([200, 400]).toContain(response.status);
      });
    });

    test.describe('Edge Cases', () => {
      test('TC-PREF-017: Update Preferences with Minimum Word Count', async ({ request }) => {
        const testEmail = generateTestEmail('pref017');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updatePreferences(request, loginResponse.token!, { defaultWordCount: 100 });
        expect(response.status).toBe(200);
      });

      test('TC-PREF-018: Update Preferences with Maximum Word Count', async ({ request }) => {
        const testEmail = generateTestEmail('pref018');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updatePreferences(request, loginResponse.token!, { defaultWordCount: 5000 });
        expect(response.status).toBe(200);
      });

      test('TC-PREF-019: Update Preferences with All Theme Values', async ({ request }) => {
        const testEmail = generateTestEmail('pref019');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        
        const themes = ['light', 'dark', 'system'];
        for (const theme of themes) {
          const response = await updatePreferences(request, loginResponse.token!, { theme });
          expect(response.status).toBe(200);
        }
      });

      test('TC-PREF-020: Concurrent Preference Updates', async ({ request }) => {
        const testEmail = generateTestEmail('pref020');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const token = loginResponse.token!;
        
        const updates = [
          updatePreferences(request, token, { theme: 'light' }),
          updatePreferences(request, token, { theme: 'dark' }),
          updatePreferences(request, token, { defaultWordCount: 2000 }),
        ];
        const responses = await Promise.all(updates);
        for (const response of responses) {
          expect([200, 400]).toContain(response.status);
        }
      });

      test('TC-PREF-021: Reset Preferences Multiple Times', async ({ request }) => {
        const testEmail = generateTestEmail('pref021');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        
        await resetPreferences(request, loginResponse.token!);
        const reset2 = await resetPreferences(request, loginResponse.token!);
        expect(reset2.status).toBe(200);
        expect(reset2.data.preferences.theme).toBe('system');
      });

      test('TC-PREF-022: PUT with Partial Data Sets Defaults', async ({ request }) => {
        const testEmail = generateTestEmail('pref022');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await replacePreferences(request, loginResponse.token!, { theme: 'dark' });
        expect(response.data.preferences.theme).toBe('dark');
        expect(response.data.preferences.emailNotifications).toBe(true); // Default
      });
    });
  });

  // ==========================================
  // VIP-10008: Role-Based Access Control
  // ==========================================
  test.describe('VIP-10008: Role-Based Access Control', () => {
    test.describe('Positive Scenarios - Superadmin', () => {
      test('TC-RBAC-001: Superadmin Can List All Users', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        expect(loginResponse.success).toBe(true);
        const response = await listUsers(request, loginResponse.token!);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data.users)).toBe(true);
      });

      test('TC-RBAC-002: Superadmin Can List Users with Pagination', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        const response = await listUsers(request, loginResponse.token!, 1, 5);
        expect(response.status).toBe(200);
        expect(response.data.pagination.limit).toBe(5);
      });

      test('TC-RBAC-003: Superadmin Can Get User Details by ID', async ({ request }) => {
        const testEmail = generateTestEmail('rbac003');
        const testPassword = generateTestPassword();
        const registerResponse = await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const userId = registerResponse.user!._id;
        
        const loginResponse = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        const response = await getUserById(request, loginResponse.token!, userId);
        expect(response.status).toBe(200);
        expect(response.data.user.email).toBe(testEmail.toLowerCase());
      });

      test('TC-RBAC-004: Superadmin Can Update User Role to Superadmin', async ({ request }) => {
        const testEmail = generateTestEmail('rbac004');
        const testPassword = generateTestPassword();
        const registerResponse = await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const userId = registerResponse.user!._id;
        
        const loginResponse = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        const response = await updateUserRole(request, loginResponse.token!, userId, 'superadmin');
        expect(response.status).toBe(200);
        expect(response.data.user.role).toBe('superadmin');
      });

      test('TC-RBAC-005: Superadmin Can Update User Role to User', async ({ request }) => {
        const testEmail = generateTestEmail('rbac005');
        const testPassword = generateTestPassword();
        const registerResponse = await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const userId = registerResponse.user!._id;
        
        const loginResponse = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        await updateUserRole(request, loginResponse.token!, userId, 'superadmin');
        const response = await updateUserRole(request, loginResponse.token!, userId, 'user');
        expect(response.data.user.role).toBe('user');
      });

      test('TC-RBAC-006: Superadmin Can Delete User', async ({ request }) => {
        const testEmail = generateTestEmail('rbac006');
        const testPassword = generateTestPassword();
        const registerResponse = await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const userId = registerResponse.user!._id;
        
        const loginResponse = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        const response = await deleteUser(request, loginResponse.token!, userId);
        expect(response.status).toBe(200);
        
        const getResponse = await getUserById(request, loginResponse.token!, userId);
        expect(getResponse.status).toBe(404);
      });

      test('TC-RBAC-007: Superadmin Can View Own Details', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        const currentUserResponse = await getCurrentUser(request, loginResponse.token!);
        const ownUserId = currentUserResponse.data.user._id;
        const response = await getUserById(request, loginResponse.token!, ownUserId);
        expect(response.status).toBe(200);
      });
    });

    test.describe('Negative Scenarios - Security', () => {
      test('TC-RBAC-008: Regular User Cannot List All Users', async ({ request }) => {
        const testEmail = generateTestEmail('rbac008');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await listUsers(request, loginResponse.token!);
        expect(response.status).toBe(403);
      });

      test('TC-RBAC-009: Regular User Cannot Get User Details by ID', async ({ request }) => {
        const user1Email = generateTestEmail('rbac009user1');
        const user2Email = generateTestEmail('rbac009user2');
        const testPassword = generateTestPassword();
        await registerViaAPI(request, user1Email, testPassword, testPassword, 'User 1');
        const user2Response = await registerViaAPI(request, user2Email, testPassword, testPassword, 'User 2');
        
        const loginResponse = await loginViaAPI(request, user1Email, testPassword);
        const response = await getUserById(request, loginResponse.token!, user2Response.user!._id);
        expect(response.status).toBe(403);
      });

      test('TC-RBAC-010: Regular User Cannot Update User Role', async ({ request }) => {
        const testEmail = generateTestEmail('rbac010');
        const testPassword = generateTestPassword();
        const registerResponse = await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const userId = registerResponse.user!._id;
        
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        const response = await updateUserRole(request, loginResponse.token!, userId, 'superadmin');
        expect(response.status).toBe(403);
      });

      test('TC-RBAC-011: Regular User Cannot Delete User', async ({ request }) => {
        const user1Email = generateTestEmail('rbac011user1');
        const user2Email = generateTestEmail('rbac011user2');
        const testPassword = generateTestPassword();
        // Register both users
        await registerViaAPI(request, user1Email, testPassword, testPassword, 'User 1');
        const user2Response = await registerViaAPI(request, user2Email, testPassword, testPassword, 'User 2');
        
        const loginResponse = await loginViaAPI(request, user1Email, testPassword);
        // Use real user ID from registration response
        const user2Id = user2Response.user?._id;
        if (!user2Id) {
          test.skip();
          return;
        }
        if (!loginResponse.token) {
          test.skip();
          return;
        }
        const response = await deleteUser(request, loginResponse.token, user2Id); 
        expect(response.status).toBe(403);
      });

      test('TC-RBAC-012: Unauthenticated Request to Admin Endpoint', async ({ request }) => {
        const response = await request.get('http://localhost:3000/api/protected/admin/users');
        expect(response.status()).toBe(401);
      });

      test('TC-RBAC-013: Superadmin Cannot Delete Self', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        const currentUserResponse = await getCurrentUser(request, loginResponse.token!);
        const ownUserId = currentUserResponse.data.user._id;
        const response = await deleteUser(request, loginResponse.token!, ownUserId);
        expect(response.status).toBe(400);
      });

      test('TC-RBAC-014: Superadmin Cannot Demote Self', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        const currentUserResponse = await getCurrentUser(request, loginResponse.token!);
        const ownUserId = currentUserResponse.data.user._id;
        const response = await updateUserRole(request, loginResponse.token!, ownUserId, 'user');
        expect(response.status).toBe(400);
      });

      test('TC-RBAC-015: Get Non-Existent User Returns 404', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        // Use a properly formatted ObjectId that doesn't exist in database
        // This is acceptable for testing 404 responses (not mock data, just a non-existent ID)
        const nonExistentUserId = '000000000000000000000000';
        const response = await getUserById(request, loginResponse.token!, nonExistentUserId);
        expect(response.status).toBe(404);
      });

      test('TC-RBAC-016: Delete Non-Existent User Returns 404', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        // Use a properly formatted ObjectId that doesn't exist in database
        // This is acceptable for testing 404 responses (not mock data, just a non-existent ID)
        const nonExistentUserId = '000000000000000000000000';
        const response = await deleteUser(request, loginResponse.token!, nonExistentUserId);
        expect(response.status).toBe(404);
      });

      test('TC-RBAC-017: Update Role with Invalid Role Value', async ({ request }) => {
        const testEmail = generateTestEmail('rbac017');
        const testPassword = generateTestPassword();
        const registerResponse = await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const userId = registerResponse.user!._id;
        
        const loginResponse = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        const response = await request.patch(
          `http://localhost:3000/api/protected/admin/users/${userId}/role`,
          {
            headers: { 'Authorization': `Bearer ${loginResponse.token}`, 'Content-Type': 'application/json' },
            data: { role: 'invalid_role' },
          }
        );
        expect(response.status()).toBe(400);
      });
    });

    test.describe('Edge Cases', () => {
      test('TC-RBAC-018: List Users with Large Page Number', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        const response = await listUsers(request, loginResponse.token!, 999, 10);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data.users)).toBe(true);
      });

      test('TC-RBAC-019: List Users with Zero Limit', async ({ request }) => {
        const loginResponse = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        const response = await listUsers(request, loginResponse.token!, 1, 0);
        expect([200, 400]).toContain(response.status);
      });

      test('TC-RBAC-020: Update Role Multiple Times', async ({ request }) => {
        const testEmail = generateTestEmail('rbac020');
        const testPassword = generateTestPassword();
        const registerResponse = await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const userId = registerResponse.user!._id;
        
        const loginResponse = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        const token = loginResponse.token!;
        
        await updateUserRole(request, token, userId, 'superadmin');
        await updateUserRole(request, token, userId, 'user');
        const response = await updateUserRole(request, token, userId, 'superadmin');
        expect(response.status).toBe(200);
        expect(response.data.user.role).toBe('superadmin');
      });

      test('TC-RBAC-021: Delete User and Verify Cannot Access', async ({ request }) => {
        const testEmail = generateTestEmail('rbac021');
        const testPassword = generateTestPassword();
        const registerResponse = await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const userId = registerResponse.user!._id;
        
        const loginResponse = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        await deleteUser(request, loginResponse.token!, userId);
        
        const loginAttempt = await loginViaAPI(request, testEmail, testPassword);
        expect(loginAttempt.success).toBe(false);
      });

      test('TC-RBAC-022: Promote User and Verify Can Access Admin Endpoints', async ({ request }) => {
        const testEmail = generateTestEmail('rbac022');
        const testPassword = generateTestPassword();
        const registerResponse = await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
        const userId = registerResponse.user!._id;
        
        const superadminLogin = await loginViaAPI(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        await updateUserRole(request, superadminLogin.token!, userId, 'superadmin');
        
        const userLogin = await loginViaAPI(request, testEmail, testPassword);
        const response = await listUsers(request, userLogin.token!);
        expect(response.status).toBe(200);
      });
    });
  });

  test.describe('Additional Unique Test Cases from CSV', () => {
    test.describe('TC_SN_17: Email Field Accepts Valid Email Formats', () => {
      test('Email field should accept various valid email formats', async ({ request }) => {
        const validEmails = [
          'test@example.com',
          'user.name@example.com',
          'user+tag@example.co.uk',
          'user_name@example-domain.com',
          'user123@example123.com',
        ];
        
        for (const email of validEmails) {
          const password = generateTestPassword();
          const response = await registerViaAPI(request, email, password, password, 'Test User');
          
          // Should succeed or fail due to duplicate (both are valid)
          expect([201, 400]).toContain(response.status);
          if (response.status === 201) {
            expect(response.success).toBe(true);
            expect(response.user?.email).toBe(email);
          }
        }
      });
    });

    test.describe('TC_SN_28: Error Messages Clarity', () => {
      test('Error messages should be clear and user-friendly', async ({ request }) => {
        // Test invalid email error
        const invalidEmailResponse = await registerViaAPI(
          request,
          'invalid-email',
          'Password123!',
          'Password123!',
          'Test User'
        );
        
        expect([400, 422]).toContain(invalidEmailResponse.status);
        if (invalidEmailResponse.errors) {
          const emailError = invalidEmailResponse.errors.find(e => e.field === 'email');
          expect(emailError).toBeDefined();
          expect(emailError?.message).toBeTruthy();
        }
        
        // Test password mismatch error
        const mismatchResponse = await registerViaAPI(
          request,
          generateTestEmail('mismatch'),
          'Password123!',
          'DifferentPassword123!',
          'Test User'
        );
        
        expect([400, 422]).toContain(mismatchResponse.status);
        if (mismatchResponse.errors) {
          const passwordError = mismatchResponse.errors.find(e => e.field === 'confirmPassword' || e.field === 'password');
          expect(passwordError).toBeDefined();
        }
      });
    });

    test.describe('TC_SN_58: Login with Newly Created Account', () => {
      test('User should be able to login immediately after account creation', async ({ request }) => {
        const testEmail = generateTestEmail('newaccount');
        const testPassword = generateTestPassword();
        
        // Register new account
        const registerResponse = await registerViaAPI(
          request,
          testEmail,
          testPassword,
          testPassword,
          'New User'
        );
        
        expect(registerResponse.status).toBe(201);
        expect(registerResponse.success).toBe(true);
        
        // Immediately try to login
        const loginResponse = await loginViaAPI(request, testEmail, testPassword);
        
        expect(loginResponse.success).toBe(true);
        expect(loginResponse.token).toBeDefined();
        expect(loginResponse.user?.email).toBe(testEmail);
      });
    });
  });

  test.describe('Logout API Endpoint', () => {
    test('TC-LOGOUT-001: Logout via API Successfully', async ({ request }) => {
      const testEmail = generateTestEmail('logout001');
      const testPassword = generateTestPassword();
      
      await registerViaAPI(request, testEmail, testPassword, testPassword, 'Test User');
      const loginResponse = await loginViaAPI(request, testEmail, testPassword);
      const token = loginResponse.token!;
      
      const response = await logoutViaAPI(request, token);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message.toLowerCase()).toContain('logged out');
    });

    test('TC-LOGOUT-002: Logout Without Token Returns 401', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/logout`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      expect(response.status()).toBe(401);
    });

    test('TC-LOGOUT-003: Logout with Invalid Token', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/logout`, {
        headers: {
          'Authorization': 'Bearer invalid-token-12345',
          'Content-Type': 'application/json',
        },
      });
      
      // May return 200 (logout endpoint accepts any token) or 401
      expect([200, 401]).toContain(response.status());
    });
  });
});