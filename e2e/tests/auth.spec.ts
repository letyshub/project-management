import { test, expect } from '@playwright/test';

const uniqueEmail = () => `test-${Date.now()}@example.com`;

test.describe('Authentication', () => {
  test('should show login page by default', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText('Login')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('link', { name: /register/i }).click();
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('should register a new user', async ({ page }) => {
    const email = uniqueEmail();

    await page.goto('/auth/register');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');

    await page.getByRole('button', { name: /register/i }).click();

    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });

  test('should login and redirect to projects', async ({ page }) => {
    const email = uniqueEmail();

    // Register first
    await page.goto('/auth/register');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /register/i }).click();
    await page.waitForURL(/\/auth\/login/);

    // Login
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/\/projects/, { timeout: 5000 });
    await expect(page.getByText('Projects')).toBeVisible();
  });
});
