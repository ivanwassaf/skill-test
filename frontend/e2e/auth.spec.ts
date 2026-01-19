import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests: Authentication Flow (Frontend UI)
 * Tests login, logout, and session management through the actual UI
 */

const CREDENTIALS = {
  email: 'admin@school-admin.com',
  password: '3OU4zn3q6Zh9'
};

test.describe('Authentication Flow - Frontend UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page with correct elements', async ({ page }) => {
    // Verify login form is visible
    await expect(page.locator('input[type="email"], input[name="username"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.locator('input[type="email"], input[name="username"]').fill('invalid@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // Wait for error message
    await expect(page.locator('text=/invalid|incorrect|wrong|error/i')).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill login form
    await page.locator('input[type="email"], input[name="username"]').fill(CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(CREDENTIALS.password);
    
    // Submit form
    await page.locator('button[type="submit"]').click();

    // Wait for navigation to dashboard/app
    await page.waitForURL('**/app/**', { timeout: 10000 });
    
    // Verify we're logged in (check for dashboard or menu elements)
    await expect(page.locator('text=/dashboard|students|notices|logout/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should maintain session after page reload', async ({ page }) => {
    // Login first
    await page.locator('input[type="email"], input[name="username"]').fill(CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(CREDENTIALS.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/app/**');

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page.locator('text=/dashboard|students|notices/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.locator('input[type="email"], input[name="username"]').fill(CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(CREDENTIALS.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/app/**');

    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [aria-label*="logout" i]').first();
    await logoutButton.click();

    // Should redirect to login page
    await expect(page.locator('input[type="email"], input[name="username"]')).toBeVisible({ timeout: 5000 });
  });
});
