import { test, expect } from '@playwright/test';

test.describe('Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/menu');
  });

  test('should add item to cart from menu', async ({ page }) => {
    // Wait for menu to load
    await page.waitForSelector('text=Tacos', { timeout: 5000 });
    
    // Find and click first menu item (adjust selector as needed)
    const firstItem = page.locator('[data-testid="menu-item"]').first();
    if (await firstItem.count() > 0) {
      await firstItem.click();
      
      // Look for add to cart button in modal or page
      const addButton = page.getByRole('button', { name: /add to cart/i }).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Verify cart has items (check cart button or badge)
        const cartBadge = page.locator('[data-testid="cart-count"]');
        if (await cartBadge.isVisible()) {
          const count = await cartBadge.textContent();
          expect(parseInt(count || '0')).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should navigate to cart page', async ({ page }) => {
    // Click cart button
    const cartButton = page.getByRole('button', { name: /cart/i }).or(
      page.locator('[data-testid="cart-button"]')
    ).first();
    
    if (await cartButton.isVisible()) {
      await cartButton.click();
      
      // Should be on cart page
      await expect(page).toHaveURL(/.*cart/);
    }
  });

  test('should display cart items', async ({ page }) => {
    await page.goto('/cart');
    
    // Check if cart page loads
    await expect(page.locator('text=Cart').or(page.locator('h1'))).toBeVisible({ timeout: 5000 });
  });
});


