import { test, expect, Page } from '@playwright/test';

const uniqueEmail = () => `test-${Date.now()}@example.com`;

async function registerAndLogin(page: Page) {
  const email = uniqueEmail();

  await page.goto('/auth/register');
  await page.getByLabel('Name').fill('Test User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: /register/i }).click();
  await page.waitForURL(/\/auth\/login/);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL(/\/projects/);
}

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('should show empty projects list', async ({ page }) => {
    await expect(page.getByText('No projects yet')).toBeVisible();
  });

  test('should create a new project', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).click();

    await page.getByLabel('Name').fill('My Test Project');
    await page.getByLabel('Description').fill('A test project description');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText('My Test Project')).toBeVisible();
  });

  test('should open project and see board', async ({ page }) => {
    // Create project
    await page.getByRole('button', { name: /new project/i }).click();
    await page.getByLabel('Name').fill('Board Test');
    await page.getByRole('button', { name: /create/i }).click();

    // Open project
    await page.getByText('Board Test').click();

    // Should see default board
    await expect(page.getByText('Main Board')).toBeVisible();
  });
});
