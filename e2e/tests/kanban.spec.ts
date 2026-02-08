import { test, expect, Page } from '@playwright/test';

const uniqueEmail = () => `test-${Date.now()}@example.com`;

async function setupProjectWithBoard(page: Page) {
  const email = uniqueEmail();

  // Register + Login
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

  // Create project
  await page.getByRole('button', { name: /new project/i }).click();
  await page.getByLabel('Name').fill('Kanban Test');
  await page.getByRole('button', { name: /create/i }).click();

  // Open project to see boards
  await page.getByText('Kanban Test').click();

  // Open board
  await page.getByText('Main Board').click();

  // Wait for columns to load
  await expect(page.getByText('TO DO')).toBeVisible({ timeout: 5000 });
}

test.describe('Kanban Board', () => {
  test('should show default columns', async ({ page }) => {
    await setupProjectWithBoard(page);

    await expect(page.getByText('TO DO')).toBeVisible();
    await expect(page.getByText('IN PROGRESS')).toBeVisible();
    await expect(page.getByText('DONE')).toBeVisible();
  });

  test('should create a task', async ({ page }) => {
    await setupProjectWithBoard(page);

    // Click add task in first column
    const addButtons = page.getByRole('button', { name: /add task/i });
    await addButtons.first().click();

    await page.getByLabel('Title').fill('My First Task');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText('My First Task')).toBeVisible();
  });

  test('should open task detail dialog', async ({ page }) => {
    await setupProjectWithBoard(page);

    // Create a task first
    const addButtons = page.getByRole('button', { name: /add task/i });
    await addButtons.first().click();
    await page.getByLabel('Title').fill('Detail Task');
    await page.getByRole('button', { name: /create/i }).click();

    // Click task to open detail
    await page.getByText('Detail Task').click();

    await expect(page.getByText('Edit Task')).toBeVisible();
    await expect(page.getByText('Comments')).toBeVisible();
    await expect(page.getByText('Labels')).toBeVisible();
  });
});
