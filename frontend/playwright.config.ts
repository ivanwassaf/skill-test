import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration for Frontend UI Tests
 * Tests the actual user interface at http://localhost
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Sequential execution for UI tests
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  
  use: {
    baseURL: 'http://localhost',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
  ],

  // Ensure frontend and backend are running
  webServer: {
    command: 'echo "Ensure docker-compose is running"',
    url: 'http://localhost',
    reuseExistingServer: true,
    timeout: 5000,
  },
});
