import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that page loaded
    await expect(page).toHaveTitle(/rico/i);
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check for menu link
    const menuLink = page.getByRole('link', { name: /menu/i });
    await expect(menuLink).toBeVisible();
  });

  test('should navigate to menu page', async ({ page }) => {
    await page.goto('/');
    
    // Click menu link
    await page.getByRole('link', { name: /menu/i }).first().click();
    
    // Should be on menu page
    await expect(page).toHaveURL(/.*menu/);
  });
});


