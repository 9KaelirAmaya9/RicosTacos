import { test, expect } from '@playwright/test';

/**
 * Checkout Performance E2E Tests
 * 
 * These tests verify that the checkout flow completes within acceptable time limits
 * and catch performance regressions early.
 * 
 * Performance Thresholds:
 * - Order creation: < 10 seconds
 * - Payment intent creation: < 12 seconds
 * - Total checkout: < 30 seconds
 */

const PERFORMANCE_THRESHOLDS = {
  ORDER_CREATION: 10000, // 10 seconds
  PAYMENT_INTENT: 12000, // 12 seconds
  TOTAL_CHECKOUT: 30000, // 30 seconds
};

test.describe('Checkout Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start from menu page
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');
  });

  test('guest checkout completes within performance threshold', async ({ page }) => {
    const startTime = Date.now();

    // Step 1: Add item to cart
    await test.step('Add item to cart', async () => {
      const menuItem = page.locator('[data-testid="menu-item"]').first();
      await menuItem.waitFor({ state: 'visible', timeout: 5000 });
      await menuItem.click();

      // Wait for modal and add to cart
      const addButton = page.getByRole('button', { name: /add to cart/i });
      await addButton.waitFor({ state: 'visible', timeout: 3000 });
      await addButton.click();

      // Verify cart badge updates
      const cartBadge = page.locator('[data-testid="cart-count"]');
      await expect(cartBadge).toBeVisible({ timeout: 2000 });
    });

    // Step 2: Navigate to cart
    await test.step('Navigate to cart', async () => {
      const cartButton = page.getByRole('button', { name: /cart/i }).first();
      await cartButton.click();
      await page.waitForURL('**/cart');
    });

    // Step 3: Fill customer information
    await test.step('Fill customer information', async () => {
      await page.fill('input[name="name"]', 'E2E Test Customer');
      await page.fill('input[name="phone"]', '555-123-4567');
      await page.fill('input[name="email"]', 'e2e-test@example.com');

      // Select pickup to avoid delivery validation
      const pickupRadio = page.locator('input[value="pickup"]');
      await pickupRadio.check();
    });

    // Step 4: Measure order creation time
    const orderCreationStart = Date.now();
    
    await test.step('Initiate checkout', async () => {
      const checkoutButton = page.getByRole('button', { name: /proceed to payment/i });
      await checkoutButton.click();

      // Wait for payment modal or order success
      // This should complete within threshold
      await Promise.race([
        page.waitForSelector('[data-testid="payment-modal"]', { timeout: PERFORMANCE_THRESHOLDS.ORDER_CREATION }),
        page.waitForURL('**/order-success', { timeout: PERFORMANCE_THRESHOLDS.ORDER_CREATION }),
      ]);
    });

    const orderCreationTime = Date.now() - orderCreationStart;
    const totalTime = Date.now() - startTime;

    // Verify performance thresholds
    console.log(`Order creation time: ${orderCreationTime}ms`);
    console.log(`Total checkout time: ${totalTime}ms`);

    expect(orderCreationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ORDER_CREATION);
    expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.TOTAL_CHECKOUT);
  });

  test('delivery checkout with address validation completes within threshold', async ({ page }) => {
    const startTime = Date.now();

    await test.step('Add item and navigate to cart', async () => {
      const menuItem = page.locator('[data-testid="menu-item"]').first();
      await menuItem.waitFor({ state: 'visible', timeout: 5000 });
      await menuItem.click();

      const addButton = page.getByRole('button', { name: /add to cart/i });
      await addButton.click();

      const cartButton = page.getByRole('button', { name: /cart/i }).first();
      await cartButton.click();
      await page.waitForURL('**/cart');
    });

    await test.step('Fill customer information for delivery', async () => {
      await page.fill('input[name="name"]', 'E2E Delivery Test');
      await page.fill('input[name="phone"]', '555-987-6543');
      await page.fill('input[name="email"]', 'delivery-test@example.com');

      // Select delivery
      const deliveryRadio = page.locator('input[value="delivery"]');
      await deliveryRadio.check();

      // Fill delivery address
      const addressInput = page.locator('input[name="deliveryAddress"]');
      await addressInput.waitFor({ state: 'visible', timeout: 2000 });
      await addressInput.fill('123 Test Street, New York, NY 10001');

      // Validate address
      const validateButton = page.getByRole('button', { name: /verify delivery area/i });
      await validateButton.click();

      // Wait for validation result (max 5 seconds)
      await page.waitForSelector('[data-testid="validation-result"]', { timeout: 5000 });
    });

    const orderCreationStart = Date.now();
    
    await test.step('Complete checkout', async () => {
      const checkoutButton = page.getByRole('button', { name: /proceed to payment/i });
      await checkoutButton.click();

      await Promise.race([
        page.waitForSelector('[data-testid="payment-modal"]', { timeout: PERFORMANCE_THRESHOLDS.ORDER_CREATION }),
        page.waitForURL('**/order-success', { timeout: PERFORMANCE_THRESHOLDS.ORDER_CREATION }),
      ]);
    });

    const orderCreationTime = Date.now() - orderCreationStart;
    const totalTime = Date.now() - startTime;

    console.log(`Delivery order creation time: ${orderCreationTime}ms`);
    console.log(`Total delivery checkout time: ${totalTime}ms`);

    expect(orderCreationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ORDER_CREATION);
  });

  test('checkout handles validation errors without hanging', async ({ page }) => {
    await test.step('Add item and navigate to cart', async () => {
      const menuItem = page.locator('[data-testid="menu-item"]').first();
      await menuItem.waitFor({ state: 'visible', timeout: 5000 });
      await menuItem.click();

      const addButton = page.getByRole('button', { name: /add to cart/i });
      await addButton.click();

      const cartButton = page.getByRole('button', { name: /cart/i }).first();
      await cartButton.click();
      await page.waitForURL('**/cart');
    });

    await test.step('Submit with invalid data', async () => {
      // Leave name empty
      await page.fill('input[name="phone"]', '123'); // Invalid phone
      await page.fill('input[name="email"]', 'invalid-email'); // Invalid email

      const checkoutButton = page.getByRole('button', { name: /proceed to payment/i });
      await checkoutButton.click();

      // Should show validation errors immediately
      const errorMessage = page.locator('[role="alert"]').or(page.locator('.text-destructive'));
      await expect(errorMessage).toBeVisible({ timeout: 2000 });

      // Button should not stay in loading state
      await expect(checkoutButton).not.toHaveAttribute('disabled');
    });
  });

  test('checkout button resets after network error', async ({ page }) => {
    // Simulate network failure
    await page.route('**/functions/v1/**', route => route.abort());

    await test.step('Add item and attempt checkout', async () => {
      const menuItem = page.locator('[data-testid="menu-item"]').first();
      await menuItem.waitFor({ state: 'visible', timeout: 5000 });
      await menuItem.click();

      const addButton = page.getByRole('button', { name: /add to cart/i });
      await addButton.click();

      const cartButton = page.getByRole('button', { name: /cart/i }).first();
      await cartButton.click();
      await page.waitForURL('**/cart');

      await page.fill('input[name="name"]', 'Error Test');
      await page.fill('input[name="phone"]', '555-000-0000');
      await page.fill('input[name="email"]', 'error@test.com');

      const checkoutButton = page.getByRole('button', { name: /proceed to payment/i });
      await checkoutButton.click();

      // Should show error toast
      const errorToast = page.locator('[data-testid="toast-error"]').or(page.locator('.sonner'));
      await expect(errorToast).toBeVisible({ timeout: 3000 });

      // Button should be re-enabled after error
      await expect(checkoutButton).not.toBeDisabled({ timeout: 2000 });
    });
  });
});

test.describe('Checkout UI Responsiveness', () => {
  test('loading states display correctly during checkout', async ({ page }) => {
    await page.goto('/cart');

    await test.step('Fill and submit form', async () => {
      await page.fill('input[name="name"]', 'Loading Test');
      await page.fill('input[name="phone"]', '555-111-2222');
      await page.fill('input[name="email"]', 'loading@test.com');

      const checkoutButton = page.getByRole('button', { name: /proceed to payment/i });
      
      // Click and immediately check for loading state
      await checkoutButton.click();
      
      // Button should show loading state
      await expect(checkoutButton).toContainText(/processing/i, { timeout: 1000 });
      await expect(checkoutButton).toBeDisabled();
    });
  });

  test('mobile checkout maintains performance', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');

    const startTime = Date.now();

    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    const menuItem = page.locator('[data-testid="menu-item"]').first();
    await menuItem.click();

    const addButton = page.getByRole('button', { name: /add to cart/i });
    await addButton.click();

    const cartButton = page.getByRole('button', { name: /cart/i }).first();
    await cartButton.click();

    await page.fill('input[name="name"]', 'Mobile Test');
    await page.fill('input[name="phone"]', '555-333-4444');
    await page.fill('input[name="email"]', 'mobile@test.com');

    const checkoutButton = page.getByRole('button', { name: /proceed to payment/i });
    await checkoutButton.click();

    const totalTime = Date.now() - startTime;

    // Mobile should still meet performance threshold
    expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.TOTAL_CHECKOUT);
  });
});
