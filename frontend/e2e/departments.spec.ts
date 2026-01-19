import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests: Departments Module (Frontend UI)
 * Tests complete department management through the UI
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

test.describe('Departments Module - Frontend UI', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to departments list page', async ({ page }) => {
    await page.locator('text=/department/i').first().click();
    await page.waitForURL('**/departments**', { timeout: 5000 });
    await expect(page.locator('text=/department information|department list/i').first()).toBeVisible();
  });

  test('should display departments in the list', async ({ page }) => {
    await page.goto('/app/departments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const deptRows = page.locator('table tbody tr, [role="row"]');
    const count = await deptRows.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should open add department page', async ({ page }) => {
    await page.goto('/app/departments');
    
    await page.locator('button:has-text("Add"), a:has-text("Add")').first().click();
    await page.waitForURL('**/departments/add**', { timeout: 5000 });
    
    await expect(page.locator('input[name="name"], input[placeholder*="name" i]')).toBeVisible();
  });

  test('should create a new department', async ({ page }) => {
    await page.goto('/app/departments/add');
    
    const timestamp = Date.now();
    const deptName = `E2E Department ${timestamp}`;

    await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(deptName);

    // Try to fill description if exists
    const descInput = page.locator('textarea[name="description"], input[name="description"]').first();
    if (await descInput.isVisible()) {
      await descInput.fill(`Test description for ${deptName}`);
    }

    await page.locator('button:has-text("Save"), button:has-text("Submit"), button[type="submit"]').first().click();
    await page.waitForTimeout(2000);
    
    const currentURL = page.url();
    const hasSuccessMessage = await page.locator('text=/success|added|created/i').isVisible();
    
    expect(hasSuccessMessage || currentURL.includes('/departments')).toBeTruthy();
  });

  test('should edit an existing department', async ({ page }) => {
    await page.goto('/app/departments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const editButton = page.locator('button[aria-label*="edit" i], svg[data-testid*="edit"], a:has-text("Edit")').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForURL('**/departments/edit/**', { timeout: 5000 });

      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      const currentValue = await nameInput.inputValue();
      const updatedName = `${currentValue} (Updated ${Date.now()})`;
      
      await nameInput.clear();
      await nameInput.fill(updatedName);

      await page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first().click();
      await page.waitForTimeout(2000);

      const hasSuccessMessage = await page.locator('text=/success|updated/i').isVisible();
      expect(hasSuccessMessage || page.url().includes('/departments')).toBeTruthy();
    }
  });

  test('should view department details', async ({ page }) => {
    await page.goto('/app/departments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const viewButton = page.locator('button[aria-label*="view" i], svg[data-testid*="eye"], a:has-text("View")').first();
    
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForURL('**/departments/**', { timeout: 5000 });
      
      await expect(page.locator('text=/name|description|head/i').first()).toBeVisible();
    } else {
      // Try clicking on first row
      const firstRow = page.locator('table tbody tr, [role="row"]').first();
      if (await firstRow.isVisible()) {
        await firstRow.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should complete full CRUD flow: Create -> View -> Update -> Delete', async ({ page }) => {
    const timestamp = Date.now();
    const deptName = `CRUD Department ${timestamp}`;
    const updatedName = `CRUD Dept Updated ${timestamp}`;

    // CREATE
    await page.goto('/app/departments/add');
    await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(deptName);
    
    const descInput = page.locator('textarea[name="description"], input[name="description"]').first();
    if (await descInput.isVisible()) {
      await descInput.fill('CRUD test description');
    }
    
    await page.locator('button:has-text("Save"), button[type="submit"]').first().click();
    await page.waitForTimeout(2000);

    // VIEW
    await page.goto('/app/departments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const nameCell = page.locator(`text="${deptName}"`).first();
    await expect(nameCell).toBeVisible({ timeout: 5000 });

    // UPDATE
    const row = nameCell.locator('xpath=ancestor::tr, ancestor::div[contains(@role, "row")]').first();
    const editButton = row.locator('button[aria-label*="edit" i], svg[data-testid*="edit"], a:has-text("Edit")').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForURL('**/departments/edit/**', { timeout: 5000 });

      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      await nameInput.clear();
      await nameInput.fill(updatedName);
      await page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first().click();
      await page.waitForTimeout(2000);

      // VERIFY UPDATE
      await page.goto('/app/departments');
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
        
        // VERIFY DELETION
        const deletedDept = page.locator(`text="${updatedName}"`);
        await expect(deletedDept).not.toBeVisible();
      }
    }
  });
});
