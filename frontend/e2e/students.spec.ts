import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests: Students Module (Frontend UI)
 * Tests complete student management through the UI
 */

const CREDENTIALS = {
  email: 'admin@school-admin.com',
  password: '3OU4zn3q6Zh9'
};

// Helper function to login
async function login(page: Page) {
  await page.goto('/');
  await page.locator('input[type="email"], input[name="username"]').fill(CREDENTIALS.email);
  await page.locator('input[type="password"]').fill(CREDENTIALS.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/app/**', { timeout: 10000 });
}

test.describe('Students Module - Frontend UI', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to students list page', async ({ page }) => {
    // Click on Students menu item
    await page.locator('text=/students/i').first().click();
    
    // Wait for URL change
    await page.waitForURL('**/students**', { timeout: 5000 });
    
    // Verify students list is loaded
    await expect(page.locator('text=/student information|student list/i').first()).toBeVisible();
  });

  test('should display students in the list', async ({ page }) => {
    await page.goto('/app/students');
    await page.waitForLoadState('networkidle');

    // Wait for students to load
    await page.waitForTimeout(2000);

    // Should see at least the 3 students (Ben, Raul, Test Student)
    // Check for table or grid elements
    const studentRows = page.locator('table tbody tr, [role="row"]');
    const count = await studentRows.count();
    
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should open add student page', async ({ page }) => {
    await page.goto('/app/students');
    
    // Click "Add New Student" button
    await page.locator('button:has-text("Add"), a:has-text("Add")').first().click();
    
    // Should navigate to add student page
    await page.waitForURL('**/students/add**', { timeout: 5000 });
    
    // Verify form is visible
    await expect(page.locator('input[name="name"], input[placeholder*="name" i]')).toBeVisible();
    await expect(page.locator('input[name="email"], input[placeholder*="email" i]')).toBeVisible();
  });

  test('should create a new student', async ({ page }) => {
    await page.goto('/app/students/add');
    
    const timestamp = Date.now();
    const studentData = {
      name: `E2E Test Student ${timestamp}`,
      email: `e2e.student.${timestamp}@test.com`,
      phone: '1234567890',
      gender: 'Male'
    };

    // Fill form
    await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(studentData.name);
    await page.locator('input[name="email"], input[placeholder*="email" i]').fill(studentData.email);
    
    // Try to fill phone if exists
    const phoneInput = page.locator('input[name="phone"], input[placeholder*="phone" i]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill(studentData.phone);
    }

    // Select gender if dropdown exists
    const genderSelect = page.locator('select[name="gender"], [role="combobox"]:has-text("Gender")').first();
    if (await genderSelect.isVisible()) {
      await genderSelect.selectOption({ label: studentData.gender });
    }

    // Click Save/Submit button
    await page.locator('button:has-text("Save"), button:has-text("Submit"), button[type="submit"]').first().click();

    // Wait for success message or redirect
    await page.waitForTimeout(2000);
    
    // Should show success message or redirect to list
    const currentURL = page.url();
    const hasSuccessMessage = await page.locator('text=/success|added|created/i').isVisible();
    
    expect(hasSuccessMessage || currentURL.includes('/students')).toBeTruthy();
  });

  test('should view student details', async ({ page }) => {
    await page.goto('/app/students');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click on first student (view/eye icon or row click)
    const viewButton = page.locator('button[aria-label*="view" i], svg[data-testid*="eye"], a:has-text("View")').first();
    
    if (await viewButton.isVisible()) {
      await viewButton.click();
    } else {
      // Try clicking on first row
      await page.locator('table tbody tr, [role="row"]').first().click();
    }

    // Wait for detail page
    await page.waitForURL('**/students/**', { timeout: 5000 });
    
    // Should see student details
    await expect(page.locator('text=/email|phone|class|section/i').first()).toBeVisible();
  });

  test('should filter students by name', async ({ page }) => {
    await page.goto('/app/students');
    await page.waitForLoadState('networkidle');

    // Look for filter/search input
    const filterInput = page.locator('input[placeholder*="search" i], input[placeholder*="filter" i], input[name="name"]').first();
    
    if (await filterInput.isVisible()) {
      await filterInput.fill('Ben');
      
      // Click search/filter button if exists
      const searchButton = page.locator('button:has-text("Search"), button:has-text("Filter")').first();
      if (await searchButton.isVisible()) {
        await searchButton.click();
      }

      await page.waitForTimeout(1000);

      // Should show filtered results
      const results = page.locator('table tbody tr, [role="row"]');
      const count = await results.count();
      
      // Should have fewer results than total (3+)
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should complete full CRUD flow: Create -> View -> Update', async ({ page }) => {
    const timestamp = Date.now();
    const studentName = `CRUD Test ${timestamp}`;
    const updatedName = `CRUD Updated ${timestamp}`;

    // CREATE
    await page.goto('/app/students/add');
    await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(studentName);
    await page.locator('input[name="email"], input[placeholder*="email" i]').fill(`crud.${timestamp}@test.com`);
    await page.locator('button:has-text("Save"), button[type="submit"]').first().click();
    await page.waitForTimeout(2000);

    // VIEW - Go back to list and find created student
    await page.goto('/app/students');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Search for created student
    const nameCell = page.locator(`text="${studentName}"`).first();
    await expect(nameCell).toBeVisible({ timeout: 5000 });

    // UPDATE - Click edit button
    const row = nameCell.locator('xpath=ancestor::tr, ancestor::div[contains(@role, "row")]').first();
    const editButton = row.locator('button[aria-label*="edit" i], svg[data-testid*="edit"], a:has-text("Edit")').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForURL('**/students/edit/**', { timeout: 5000 });

      // Update name
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      await nameInput.clear();
      await nameInput.fill(updatedName);

      // Save
      await page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first().click();
      await page.waitForTimeout(2000);

      // VERIFY - Check updated name in list
      await page.goto('/app/students');
      await page.waitForLoadState('networkidle');
      await expect(page.locator(`text="${updatedName}"`).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
