import { test, expect } from '@playwright/test';

/**
 * Database Performance Tests for Checkout
 * 
 * These tests specifically verify that database operations during checkout
 * complete quickly and don't cause timeouts.
 * 
 * Key areas:
 * - Order insertion time
 * - RLS policy evaluation speed
 * - Index effectiveness
 */

test.describe('Database Performance During Checkout', () => {
  test('multiple concurrent orders complete without timeout', async ({ browser }) => {
    // Create 5 concurrent checkouts to test database performance under load
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);

    const checkoutPromises = contexts.map(async (context, index) => {
      const page = await context.newPage();
      const startTime = Date.now();

      try {
        await page.goto('/menu');
        await page.waitForLoadState('networkidle');

        const menuItem = page.locator('[data-testid="menu-item"]').first();
        await menuItem.click();

        const addButton = page.getByRole('button', { name: /add to cart/i });
        await addButton.click();

        const cartButton = page.getByRole('button', { name: /cart/i }).first();
        await cartButton.click();

        await page.fill('input[name="name"]', `Concurrent Test ${index + 1}`);
        await page.fill('input[name="phone"]', `555-${index}00-${index}111`);
        await page.fill('input[name="email"]', `concurrent${index}@test.com`);

        const checkoutButton = page.getByRole('button', { name: /proceed to payment/i });
        await checkoutButton.click();

        await Promise.race([
          page.waitForSelector('[data-testid="payment-modal"]', { timeout: 10000 }),
          page.waitForURL('**/order-success', { timeout: 10000 }),
        ]);

        const duration = Date.now() - startTime;
        return { success: true, duration, index };
      } catch (error) {
        return { success: false, error: error.message, index };
      } finally {
        await context.close();
      }
    });

    const results = await Promise.all(checkoutPromises);

    // Log results
    results.forEach(result => {
      if (result.success) {
        console.log(`Order ${result.index + 1}: ${result.duration}ms`);
      } else {
        console.error(`Order ${result.index + 1}: FAILED - ${result.error}`);
      }
    });

    // All orders should succeed
    const allSucceeded = results.every(r => r.success);
    expect(allSucceeded).toBe(true);

    // Average time should be reasonable
    const avgTime = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
    console.log(`Average checkout time: ${avgTime}ms`);
    expect(avgTime).toBeLessThan(15000); // 15 seconds average
  });

  test('order creation with large cart completes quickly', async ({ page }) => {
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    const startTime = Date.now();

    // Add multiple items to cart
    await test.step('Add 10 items to cart', async () => {
      const menuItems = page.locator('[data-testid="menu-item"]');
      const itemCount = await menuItems.count();
      const itemsToAdd = Math.min(10, itemCount);

      for (let i = 0; i < itemsToAdd; i++) {
        await menuItems.nth(i).click();
        const addButton = page.getByRole('button', { name: /add to cart/i });
        await addButton.click();
        
        // Increase quantity
        const quantityButton = page.locator('button[aria-label="Increase quantity"]');
        if (await quantityButton.isVisible()) {
          await quantityButton.click();
          await quantityButton.click();
        }

        // Close modal if it's a modal
        const closeButton = page.locator('button[aria-label="Close"]');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    });

    await test.step('Complete checkout with large order', async () => {
      const cartButton = page.getByRole('button', { name: /cart/i }).first();
      await cartButton.click();

      await page.fill('input[name="name"]', 'Large Order Test');
      await page.fill('input[name="phone"]', '555-999-8888');
      await page.fill('input[name="email"]', 'largeorder@test.com');

      const orderCreationStart = Date.now();
      const checkoutButton = page.getByRole('button', { name: /proceed to payment/i });
      await checkoutButton.click();

      await Promise.race([
        page.waitForSelector('[data-testid="payment-modal"]', { timeout: 10000 }),
        page.waitForURL('**/order-success', { timeout: 10000 }),
      ]);

      const orderCreationTime = Date.now() - orderCreationStart;
      console.log(`Large order (10 items) creation time: ${orderCreationTime}ms`);

      // Large order should still complete quickly
      expect(orderCreationTime).toBeLessThan(10000);
    });

    const totalTime = Date.now() - startTime;
    console.log(`Total time for large order flow: ${totalTime}ms`);
  });

  test('guest orders without user_id complete quickly', async ({ page }) => {
    // This specifically tests the performance fix for orders without user_id
    const startTime = Date.now();

    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    const menuItem = page.locator('[data-testid="menu-item"]').first();
    await menuItem.click();

    const addButton = page.getByRole('button', { name: /add to cart/i });
    await addButton.click();

    const cartButton = page.getByRole('button', { name: /cart/i }).first();
    await cartButton.click();

    await page.fill('input[name="name"]', 'Guest Order Test');
    await page.fill('input[name="phone"]', '555-777-6666');
    await page.fill('input[name="email"]', 'guest@test.com');

    const orderCreationStart = Date.now();
    const checkoutButton = page.getByRole('button', { name: /proceed to payment/i });
    await checkoutButton.click();

    await Promise.race([
      page.waitForSelector('[data-testid="payment-modal"]', { timeout: 10000 }),
      page.waitForURL('**/order-success', { timeout: 10000 }),
    ]);

    const orderCreationTime = Date.now() - orderCreationStart;
    const totalTime = Date.now() - startTime;

    console.log(`Guest order creation time: ${orderCreationTime}ms`);
    console.log(`Total guest checkout time: ${totalTime}ms`);

    // Guest orders should be just as fast as authenticated orders
    expect(orderCreationTime).toBeLessThan(10000);
  });
});

test.describe('Performance Regression Detection', () => {
  test('checkout performance baseline', async ({ page }) => {
    // This test establishes a performance baseline
    // Run this test regularly to detect performance regressions

    const measurements = {
      menuLoad: 0,
      cartNavigation: 0,
      formFill: 0,
      orderCreation: 0,
      total: 0,
    };

    const totalStart = Date.now();

    // Measure menu load
    const menuLoadStart = Date.now();
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');
    measurements.menuLoad = Date.now() - menuLoadStart;

    // Add item
    const menuItem = page.locator('[data-testid="menu-item"]').first();
    await menuItem.click();
    const addButton = page.getByRole('button', { name: /add to cart/i });
    await addButton.click();

    // Measure cart navigation
    const cartNavStart = Date.now();
    const cartButton = page.getByRole('button', { name: /cart/i }).first();
    await cartButton.click();
    await page.waitForURL('**/cart');
    measurements.cartNavigation = Date.now() - cartNavStart;

    // Measure form fill
    const formFillStart = Date.now();
    await page.fill('input[name="name"]', 'Baseline Test');
    await page.fill('input[name="phone"]', '555-000-1111');
    await page.fill('input[name="email"]', 'baseline@test.com');
    measurements.formFill = Date.now() - formFillStart;

    // Measure order creation
    const orderStart = Date.now();
    const checkoutButton = page.getByRole('button', { name: /proceed to payment/i });
    await checkoutButton.click();
    await Promise.race([
      page.waitForSelector('[data-testid="payment-modal"]', { timeout: 10000 }),
      page.waitForURL('**/order-success', { timeout: 10000 }),
    ]);
    measurements.orderCreation = Date.now() - orderStart;

    measurements.total = Date.now() - totalStart;

    // Log all measurements for tracking
    console.log('=== Performance Baseline ===');
    console.log(`Menu Load: ${measurements.menuLoad}ms`);
    console.log(`Cart Navigation: ${measurements.cartNavigation}ms`);
    console.log(`Form Fill: ${measurements.formFill}ms`);
    console.log(`Order Creation: ${measurements.orderCreation}ms`);
    console.log(`Total Time: ${measurements.total}ms`);
    console.log('============================');

    // Assert against thresholds
    expect(measurements.menuLoad).toBeLessThan(5000);
    expect(measurements.cartNavigation).toBeLessThan(2000);
    expect(measurements.formFill).toBeLessThan(1000);
    expect(measurements.orderCreation).toBeLessThan(10000);
    expect(measurements.total).toBeLessThan(30000);
  });
});
