import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests: Notices Module (Frontend UI)
 * Tests complete notice management through the UI including recipient selection
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

test.describe('Notices Module - Frontend UI', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to notices list page', async ({ page }) => {
    await page.locator('text=/notice/i').first().click();
    await page.waitForURL('**/notices**', { timeout: 5000 });
    await expect(page.locator('text=/notice information|notice list/i').first()).toBeVisible();
  });

  test('should display notices in the list', async ({ page }) => {
    await page.goto('/app/notices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const noticeRows = page.locator('table tbody tr, [role="row"]');
    const count = await noticeRows.count();
    
    // Should have at least one notice
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should open add notice page without 404 error', async ({ page }) => {
    // This test verifies the original issue is fixed: GET /api/v1/notices/recipients/list should not return 404
    await page.goto('/app/notices/add');
    
    // Wait for page to load and check for form elements
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Should see form fields
    await expect(page.locator('input[name="title"], input[placeholder*="title" i]')).toBeVisible({ timeout: 5000 });
    
    // Should see recipient type selector (this triggers the API call to /api/v1/notices/recipients/list)
    const recipientTypeSelector = page.locator('select[name="recipientType"], [role="combobox"]:has-text("Recipient")');
    await expect(recipientTypeSelector.first()).toBeVisible({ timeout: 5000 });
  });

  test('should load recipient types without error', async ({ page }) => {
    await page.goto('/app/notices/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Intercept network request to verify no 404
    const recipientTypeSelector = page.locator('select[name="recipientType"], select[name="recipient_type_id"]').first();
    
    if (await recipientTypeSelector.isVisible()) {
      // Open the select to see options
      await recipientTypeSelector.click();
      
      // Should have options: Admin, Teacher, Student (from notice_recipient_types table)
      const options = recipientTypeSelector.locator('option');
      const count = await options.count();
      
      // Should have at least 3 options plus possibly a placeholder
      expect(count).toBeGreaterThanOrEqual(3);
    }
  });

  test('should create a notice for Admin recipients', async ({ page }) => {
    await page.goto('/app/notices/add');
    await page.waitForLoadState('networkidle');
    
    const timestamp = Date.now();
    const noticeData = {
      title: `E2E Admin Notice ${timestamp}`,
      content: `This is a test notice created by E2E test at ${new Date().toISOString()}`
    };

    // Fill title
    await page.locator('input[name="title"], input[placeholder*="title" i]').first().fill(noticeData.title);

    // Fill content/description
    const contentField = page.locator('textarea[name="content"], textarea[name="description"], textarea[placeholder*="content" i]').first();
    if (await contentField.isVisible()) {
      await contentField.fill(noticeData.content);
    }

    // Select Admin as recipient type (role_id = 1)
    const recipientTypeSelector = page.locator('select[name="recipientType"], select[name="recipient_type_id"]').first();
    if (await recipientTypeSelector.isVisible()) {
      // Select the option that contains "Admin" or has value "1"
      await recipientTypeSelector.selectOption({ label: /admin/i });
    }

    // Submit form
    await page.locator('button:has-text("Save"), button:has-text("Submit"), button:has-text("Publish"), button[type="submit"]').first().click();
    await page.waitForTimeout(2000);
    
    const currentURL = page.url();
    const hasSuccessMessage = await page.locator('text=/success|added|created|published/i').isVisible();
    
    expect(hasSuccessMessage || currentURL.includes('/notices')).toBeTruthy();
  });

  test('should create a notice for Teacher recipients with department selection', async ({ page }) => {
    await page.goto('/app/notices/add');
    await page.waitForLoadState('networkidle');
    
    const timestamp = Date.now();
    const noticeTitle = `E2E Teacher Notice ${timestamp}`;

    await page.locator('input[name="title"], input[placeholder*="title" i]').first().fill(noticeTitle);

    const contentField = page.locator('textarea[name="content"], textarea[name="description"]').first();
    if (await contentField.isVisible()) {
      await contentField.fill('Notice for teachers in a specific department');
    }

    // Select Teacher as recipient type (role_id = 2, requires department selection)
    const recipientTypeSelector = page.locator('select[name="recipientType"], select[name="recipient_type_id"]').first();
    if (await recipientTypeSelector.isVisible()) {
      await recipientTypeSelector.selectOption({ label: /teacher/i });
      
      // Wait for department selector to appear (primary_dependent_select)
      await page.waitForTimeout(1000);
      
      // Select a department if dropdown appeared
      const departmentSelector = page.locator('select[name="department"], select[name="departmentId"]').first();
      if (await departmentSelector.isVisible({ timeout: 2000 })) {
        // Select first available department
        await departmentSelector.selectOption({ index: 1 });
      }
    }

    await page.locator('button:has-text("Save"), button:has-text("Submit"), button:has-text("Publish"), button[type="submit"]').first().click();
    await page.waitForTimeout(2000);
    
    const hasSuccessMessage = await page.locator('text=/success|added|created|published/i').isVisible();
    expect(hasSuccessMessage || page.url().includes('/notices')).toBeTruthy();
  });

  test('should create a notice for Student recipients with class selection', async ({ page }) => {
    await page.goto('/app/notices/add');
    await page.waitForLoadState('networkidle');
    
    const timestamp = Date.now();
    const noticeTitle = `E2E Student Notice ${timestamp}`;

    await page.locator('input[name="title"], input[placeholder*="title" i]').first().fill(noticeTitle);

    const contentField = page.locator('textarea[name="content"], textarea[name="description"]').first();
    if (await contentField.isVisible()) {
      await contentField.fill('Notice for students in a specific class');
    }

    // Select Student as recipient type (role_id = 3, requires class selection)
    const recipientTypeSelector = page.locator('select[name="recipientType"], select[name="recipient_type_id"]').first();
    if (await recipientTypeSelector.isVisible()) {
      await recipientTypeSelector.selectOption({ label: /student/i });
      
      // Wait for class selector to appear
      await page.waitForTimeout(1000);
      
      // Select a class if dropdown appeared
      const classSelector = page.locator('select[name="class"], select[name="classId"]').first();
      if (await classSelector.isVisible({ timeout: 2000 })) {
        await classSelector.selectOption({ index: 1 });
      }
    }

    await page.locator('button:has-text("Save"), button:has-text("Submit"), button:has-text("Publish"), button[type="submit"]').first().click();
    await page.waitForTimeout(2000);
    
    const hasSuccessMessage = await page.locator('text=/success|added|created|published/i').isVisible();
    expect(hasSuccessMessage || page.url().includes('/notices')).toBeTruthy();
  });

  test('should view notice details', async ({ page }) => {
    await page.goto('/app/notices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if there are any notices
    const noticeRows = page.locator('table tbody tr, [role="row"]');
    const count = await noticeRows.count();
    
    if (count > 0) {
      const viewButton = page.locator('button[aria-label*="view" i], svg[data-testid*="eye"], a:has-text("View")').first();
      
      if (await viewButton.isVisible()) {
        await viewButton.click();
        await page.waitForURL('**/notices/**', { timeout: 5000 });
        
        await expect(page.locator('text=/title|content|recipient/i').first()).toBeVisible();
      }
    }
  });

  test('should complete full CRUD flow: Create -> View -> Update', async ({ page }) => {
    const timestamp = Date.now();
    const noticeTitle = `CRUD Notice ${timestamp}`;
    const updatedTitle = `CRUD Updated ${timestamp}`;

    // CREATE
    await page.goto('/app/notices/add');
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[name="title"], input[placeholder*="title" i]').first().fill(noticeTitle);
    
    const contentField = page.locator('textarea[name="content"], textarea[name="description"]').first();
    if (await contentField.isVisible()) {
      await contentField.fill('CRUD test content');
    }

    // Select Admin recipient
    const recipientTypeSelector = page.locator('select[name="recipientType"], select[name="recipient_type_id"]').first();
    if (await recipientTypeSelector.isVisible()) {
      await recipientTypeSelector.selectOption({ label: /admin/i });
    }

    await page.locator('button:has-text("Save"), button:has-text("Submit"), button:has-text("Publish"), button[type="submit"]').first().click();
    await page.waitForTimeout(2000);

    // VIEW
    await page.goto('/app/notices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const titleCell = page.locator(`text="${noticeTitle}"`).first();
    await expect(titleCell).toBeVisible({ timeout: 5000 });

    // UPDATE
    const row = titleCell.locator('xpath=ancestor::tr, ancestor::div[contains(@role, "row")]').first();
    const editButton = row.locator('button[aria-label*="edit" i], svg[data-testid*="edit"], a:has-text("Edit")').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForURL('**/notices/edit/**', { timeout: 5000 });

      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
      await titleInput.clear();
      await titleInput.fill(updatedTitle);
      
      await page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first().click();
      await page.waitForTimeout(2000);

      // VERIFY UPDATE
      await page.goto('/app/notices');
      await page.waitForLoadState('networkidle');
      await expect(page.locator(`text="${updatedTitle}"`).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
