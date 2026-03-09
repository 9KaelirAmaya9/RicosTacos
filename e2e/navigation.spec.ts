import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');

    // Navigate to menu
    await page.getByRole('link', { name: /menu/i }).first().click();
    await expect(page).toHaveURL(/.*menu/);

    // Navigate to location
    await page.getByRole('link', { name: /location/i }).first().click();
    await expect(page).toHaveURL(/.*location/);

    // Navigate back to home
    await page.getByRole('link', { name: /home/i }).or(
      page.locator('a[href="/"]')
    ).first().click();
    await expect(page).toHaveURL('/');
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');

    // Check for main navigation links
    const menuLink = page.getByRole('link', { name: /menu/i });
    const locationLink = page.getByRole('link', { name: /location/i });

    await expect(menuLink.first()).toBeVisible();
    await expect(locationLink.first()).toBeVisible();
  });

  test('should handle 404 for invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-12345');
    
    // Should show 404 page
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator('text=Page Not Found')).toBeVisible();
  });
});


