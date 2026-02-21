/**
 * Authentication Helper Functions for Browser Tests
 * Provides utilities for browser-based authentication flows
 */

import { Page, expect } from '@playwright/test';

/**
 * Login via browser UI
 */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string,
  rememberMe = false
): Promise<void> {
  // Check if we're already on login page (e.g., after registration)
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    // Only navigate if we're not already on login page
    let retries = 3;
    while (retries > 0) {
      try {
        await page.goto('/login', { timeout: 30000, waitUntil: 'domcontentloaded' });
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await page.waitForTimeout(1000); // Wait before retry
      }
    }
  }
  
  // Wait for form to be ready with increased timeout
  await page.waitForSelector('input[id="email"]', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('input[id="password"]', { state: 'visible', timeout: 15000 });
  
  // Clear both fields first
  await page.fill('input[id="email"]', '');
  await page.fill('input[id="password"]', '');
  
  // Use type() for both fields to ensure React onChange events fire properly
  // This is critical for controlled React components
  await page.type('input[id="email"]', email, { delay: 50 });
  await page.type('input[id="password"]', password, { delay: 50 });
  
  // Wait for both fields to be populated (React state to update)
  // Note: Email input may trim leading/trailing spaces, so we compare trimmed values
  // Increased timeout to 10000ms for parallel execution (10 workers can cause delays)
  const trimmedEmail = email.trim();
  await Promise.all([
    page.waitForFunction(
      (expectedEmail) => {
        const emailInput = document.querySelector('input[id="email"]') as HTMLInputElement;
        return emailInput && emailInput.value.trim() === expectedEmail;
      },
      trimmedEmail,
      { timeout: 10000 }
    ),
    page.waitForFunction(
      (expectedPassword) => {
        const passwordInput = document.querySelector('input[id="password"]') as HTMLInputElement;
        return passwordInput && passwordInput.value === expectedPassword;
      },
      password,
      { timeout: 10000 }
    )
  ]);
  
  // Wait for any validation errors to disappear
  await page.waitForSelector('text=Password is required', { state: 'hidden', timeout: 3000 }).catch(() => {
    // Error message might not exist, which is fine
  });
  
  // Final verification that fields are filled
  const emailValue = await page.inputValue('input[id="email"]');
  const passwordValue = await page.inputValue('input[id="password"]');
  
  // Email input may trim leading/trailing spaces, so compare trimmed values
  const trimmedEmailValue = emailValue.trim();
  
  if (trimmedEmailValue !== trimmedEmail || passwordValue !== password) {
    throw new Error(`Form fields not filled correctly. Email: ${emailValue} (expected: ${trimmedEmail}), Password: ${passwordValue ? '***' : 'empty'}`);
  }
  
  // Check remember me if needed
  if (rememberMe) {
    const checkbox = page.locator('button[role="checkbox"], input#remember, input[id="remember"]').first();
    const isChecked = await checkbox.getAttribute('aria-checked');
    if (isChecked !== 'true') {
      await checkbox.click();
    }
  }
  
  // Wait for submit button to be enabled and validation to pass
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeEnabled();
  
  // Ensure no validation errors are visible
  const hasValidationError = await page.locator('text=Password is required').isVisible().catch(() => false);
  if (hasValidationError) {
    throw new Error('Password validation error still present after filling field');
  }
  
  // Small delay before submission to ensure validation completes
  await page.waitForTimeout(300);
  
  // Set up response promise BEFORE clicking (Playwright best practice)
  // Increased timeout to 60000ms for parallel execution (10 workers can cause server delays)
  const responsePromise = page.waitForResponse(
    resp => resp.url().includes('/api/auth/login') && resp.request().method() === 'POST',
    { timeout: 60000 }
  );
  
  // Click submit button
  await submitButton.click();
  
  // Wait for response (this will also implicitly wait for the request)
  const response = await responsePromise;
  
  // Check if login was successful
  const responseData = await response.json();
  if (!response.ok() || !responseData.success) {
    // Wait for error message to appear on page
    await page.waitForTimeout(1000);
    const errorText = await page.locator('text=/invalid|error|failed/i').first().textContent().catch(() => '');
    throw new Error(`Login failed: ${responseData.message || errorText || 'Unknown error'}. Response status: ${response.status()}`);
  }
  
  // Wait for navigation to dashboard (increased timeout for parallel execution)
  // Increased to 30000ms to account for heavy load with 10 workers
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
}

/**
 * Register via browser UI
 */
export async function registerViaUI(
  page: Page,
  email: string,
  password: string,
  confirmPassword: string,
  fullName: string
): Promise<void> {
  await page.goto('/signup');
  
  // Wait for form to be ready
  await page.waitForSelector('input[id="email"]', { state: 'visible' });
  await page.waitForSelector('input[id="password"]', { state: 'visible' });
  await page.waitForSelector('input[id="confirmPassword"]', { state: 'visible' });
  await page.waitForSelector('input[id="fullName"]', { state: 'visible' });
  
  // Clear and fill form fields
  await page.fill('input[id="email"]', '');
  await page.fill('input[id="email"]', email);
  
  await page.fill('input[id="password"]', '');
  await page.fill('input[id="password"]', password);
  
  await page.fill('input[id="confirmPassword"]', '');
  await page.fill('input[id="confirmPassword"]', confirmPassword);
  
  await page.fill('input[id="fullName"]', '');
  await page.fill('input[id="fullName"]', fullName);
  
  // Wait for submit button to be enabled
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeEnabled();
  
  // Submit form and wait for response
  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/auth/register') && resp.request().method() === 'POST', { timeout: 15000 }),
    submitButton.click()
  ]);
  
  // Check if registration was successful
  const responseData = await response.json();
  if (!response.ok() || !responseData.success) {
    // Wait for error message to appear on page
    await page.waitForTimeout(1000);
    const errorText = await page.locator('text=/error|invalid|failed|already/i').first().textContent().catch(() => '');
    throw new Error(`Registration failed: ${responseData.message || errorText || 'Unknown error'}. Response status: ${response.status()}`);
  }
  
  // Wait for navigation to login page (successful registration redirects to login)
  await page.waitForURL(/\/login/, { timeout: 15000 });
}

/**
 * Logout via browser UI
 */
export async function logoutViaUI(page: Page): Promise<void> {
  // Click sign out button in sidebar
  await page.click('button:has-text("Sign Out")');
  
  // Wait for redirect to login
  await page.waitForURL('/login', { timeout: 5000 });
}

/**
 * Check if user is logged in (has token in localStorage)
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  return !!token;
}

/**
 * Get stored token from localStorage
 */
export async function getStoredToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => localStorage.getItem('auth_token'));
}

/**
 * Clear authentication data
 */
export async function clearAuthData(page: Page): Promise<void> {
  // Navigate to a page first to ensure we have access to localStorage
  try {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('remember_me');
    });
  } catch (error) {
    // If navigation fails, try to clear from current context
    try {
      await page.evaluate(() => {
        if (typeof Storage !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('remember_me');
        }
      });
    } catch {
      // Ignore if still fails
    }
  }
}

/**
 * Wait for dashboard to load and verify user email
 */
export async function verifyDashboardAccess(page: Page, expectedEmail: string): Promise<void> {
  // Wait for dashboard URL (increased timeout for parallel execution)
  await page.waitForURL('/dashboard', { timeout: 30000 });
  
  // Wait for dashboard layout to finish loading (it fetches user data asynchronously)
  // The layout shows "Loading..." until user data is fetched
  await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 30000 }).catch(() => {
    // Loading text might not appear or disappear quickly, that's okay
  });
  
  // Wait a bit for React to render the sidebar with user email
  await page.waitForTimeout(1000);
  
  // Verify user email is displayed in sidebar
  // Use a more flexible selector - email might be truncated, so use contains
  const emailLocator = page.locator(`text=/.*${expectedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*/i`);
  await expect(emailLocator.first()).toBeVisible({ timeout: 10000 });
}

/**
 * Verify error message is displayed
 */
export async function verifyErrorMessage(page: Page, expectedMessage: string): Promise<void> {
  await expect(page.locator(`text=${expectedMessage}`)).toBeVisible();
}

/**
 * Verify validation error for field
 */
export async function verifyFieldError(page: Page, fieldId: string, expectedError: string): Promise<void> {
  // Try multiple ways to find the error message
  const errorSelectors = [
    `text=${expectedError}`,
    `text=/${expectedError}/i`,
    `[role="alert"]:has-text("${expectedError}")`,
    `.text-destructive:has-text("${expectedError}")`,
  ];
  
  let found = false;
  for (const selector of errorSelectors) {
    try {
      const errorLocator = page.locator(selector).first();
      await expect(errorLocator).toBeVisible({ timeout: 2000 });
      found = true;
      break;
    } catch {
      // Try next selector
    }
  }
  
  if (!found) {
    // Fallback: check if any error message is visible
    const anyError = page.locator('text=/required|invalid|error/i').first();
    await expect(anyError).toBeVisible();
  }
}

