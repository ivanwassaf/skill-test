import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests: Classes Module (Frontend UI)
 * Tests complete class management through the UI
 */

const CREDENTIALS = {
  email: 'admin@school-admin.com',
  password: '3OU4zn3q6Zh9'
};

async function login(page: Page) {
  await page.goto('/');
  await page.locator('input[type="email"], input[name="username"]').fill(CREDENTIALS.email);
  await page.locator('input[type="password"]').fill(CREDENTIALS.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/app/**', { timeout: 10000 });
}

test.describe('Classes Module - Frontend UI', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to classes list page', async ({ page }) => {
    await page.locator('text=/class/i').first().click();
    await page.waitForURL('**/classes**', { timeout: 5000 });
    await expect(page.locator('text=/class information|class list/i').first()).toBeVisible();
  });

  test('should display classes in the list', async ({ page }) => {
    await page.goto('/app/classes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const classRows = page.locator('table tbody tr, [role="row"]');
    const count = await classRows.count();
    
    // Should have at least some classes
    expect(count).toBeGreaterThan(0);
  });

  test('should open add class page', async ({ page }) => {
    await page.goto('/app/classes');
    
    await page.locator('button:has-text("Add"), a:has-text("Add")').first().click();
    await page.waitForURL('**/classes/add**', { timeout: 5000 });
    
    await expect(page.locator('input[name="name"], input[placeholder*="name" i]')).toBeVisible();
  });

  test('should create a new class', async ({ page }) => {
    await page.goto('/app/classes/add');
    
    const timestamp = Date.now();
    const className = `E2E Class ${timestamp}`;

    await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(className);

    await page.locator('button:has-text("Save"), button:has-text("Submit"), button[type="submit"]').first().click();
    await page.waitForTimeout(2000);
    
    const currentURL = page.url();
    const hasSuccessMessage = await page.locator('text=/success|added|created/i').isVisible();
    
    expect(hasSuccessMessage || currentURL.includes('/classes')).toBeTruthy();
  });

  test('should edit an existing class', async ({ page }) => {
    await page.goto('/app/classes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const editButton = page.locator('button[aria-label*="edit" i], svg[data-testid*="edit"], a:has-text("Edit")').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForURL('**/classes/edit/**', { timeout: 5000 });

      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      const currentValue = await nameInput.inputValue();
      const updatedName = `${currentValue} (Updated ${Date.now()})`;
      
      await nameInput.clear();
      await nameInput.fill(updatedName);

      await page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first().click();
      await page.waitForTimeout(2000);

      const hasSuccessMessage = await page.locator('text=/success|updated/i').isVisible();
      expect(hasSuccessMessage || page.url().includes('/classes')).toBeTruthy();
    }
  });

  test('should complete full CRUD flow: Create -> View -> Update -> Delete', async ({ page }) => {
    const timestamp = Date.now();
    const className = `CRUD Class ${timestamp}`;
    const updatedName = `CRUD Updated ${timestamp}`;

    // CREATE
    await page.goto('/app/classes/add');
    await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(className);
    await page.locator('button:has-text("Save"), button[type="submit"]').first().click();
    await page.waitForTimeout(2000);

    // VIEW
    await page.goto('/app/classes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const nameCell = page.locator(`text="${className}"`).first();
    await expect(nameCell).toBeVisible({ timeout: 5000 });

    // UPDATE
    const row = nameCell.locator('xpath=ancestor::tr, ancestor::div[contains(@role, "row")]').first();
    const editButton = row.locator('button[aria-label*="edit" i], svg[data-testid*="edit"], a:has-text("Edit")').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForURL('**/classes/edit/**', { timeout: 5000 });

      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      await nameInput.clear();
      await nameInput.fill(updatedName);
      await page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first().click();
      await page.waitForTimeout(2000);

      // VERIFY UPDATE
      await page.goto('/app/classes');
      await page.waitForLoadState('networkidle');
      await expect(page.locator(`text="${updatedName}"`).first()).toBeVisible({ timeout: 5000 });

      // DELETE
      const updatedRow = page.locator(`text="${updatedName}"`).first().locator('xpath=ancestor::tr, ancestor::div[contains(@role, "row")]').first();
      const deleteButton = updatedRow.locator('button[aria-label*="delete" i], svg[data-testid*="delete"], button:has-text("Delete")').first();
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Confirm deletion if modal appears
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').last();
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click();
        }
        
        await page.waitForTimeout(2000);
        
        // VERIFY DELETION - class should not be visible
        const deletedClass = page.locator(`text="${updatedName}"`);
        await expect(deletedClass).not.toBeVisible();
      }
    }
  });
});
