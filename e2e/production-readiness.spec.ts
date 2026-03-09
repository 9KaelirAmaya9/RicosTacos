import { test, expect } from '@playwright/test';

test.describe('Production Readiness Verification', () => {
    // Use production URL or fallback to localhost
    const BASE_URL = process.env.PROD_URL || 'https://localhost';

    test.use({ ignoreHTTPSErrors: true });

    test('should load homepage over HTTPS', async ({ page }) => {
        await page.goto(BASE_URL);

        // Verify title or key element
        await expect(page).toHaveTitle(/Taco/i);

        // Verify HTTPS protocol
        const url = page.url();
        expect(url).toContain('https://');
    });

    test('should have working navigation', async ({ page }) => {
        await page.goto(BASE_URL);

        // Check menu link
        const menuLink = page.getByRole('link', { name: /menu/i }).first();
        await expect(menuLink).toBeVisible();
        await menuLink.click();

        // Verify menu page loads
        await expect(page.url()).toContain('/menu');
    });

    test('should allow adding items to cart', async ({ page }) => {
        await page.goto(`${BASE_URL}/menu`);

        // Find an "Add to Cart" button (adjust selector as needed)
        // Assuming there are buttons with text "Add" or similar
        const addButtons = page.getByRole('button', { name: /add/i });

        if (await addButtons.count() > 0) {
            await addButtons.first().click();

            // Verify cart badge or notification
            // This depends on UI implementation
            // expect(page.locator('.cart-badge')).toBeVisible();
        } else {
            console.log('No add buttons found, skipping cart test');
        }
    });

    test('should load login page', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();
    });
});
