# End-to-End Tests

## Overview

This directory contains Playwright E2E tests for La Taco Atelier. Tests are organized by feature area and include performance monitoring.

## Test Files

### Performance Tests
- **`checkout-performance.spec.ts`** - Main checkout flow performance tests
  - Guest checkout timing
  - Delivery checkout with address validation
  - Error handling and recovery
  - UI responsiveness checks
  - Mobile performance

- **`checkout-database-performance.spec.ts`** - Database-specific performance tests
  - Concurrent order processing
  - Large cart orders
  - Guest vs authenticated order performance
  - Performance baseline measurements

### Feature Tests
- **`cart-flow.spec.ts`** - Cart functionality tests
- **`order-complete-flow.spec.ts`** - Complete order lifecycle
- **`homepage.spec.ts`** - Homepage load and navigation
- **`navigation.spec.ts`** - Site navigation tests
- **`admin-kitchen-flow.spec.ts`** - Admin and kitchen workflows

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Performance Tests Only
```bash
npm run test:e2e -- e2e/checkout-performance.spec.ts
npm run test:e2e -- e2e/checkout-database-performance.spec.ts
```

### Specific Browser
```bash
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

## Performance Thresholds

The checkout tests enforce these performance thresholds:

| Operation | Threshold | Purpose |
|-----------|-----------|---------|
| Order Creation | < 10s | Prevent database query slowdowns |
| Payment Intent | < 12s | Ensure Stripe API responsiveness |
| Total Checkout | < 30s | Maintain good user experience |

Tests will **fail** if these thresholds are exceeded, helping catch:
- Slow database queries
- Missing indexes
- RLS policy issues
- Network timeouts
- API slowdowns

## Writing New Tests

### Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    await test.step('Step 1: Description', async () => {
      // Test step 1
    });

    await test.step('Step 2: Description', async () => {
      // Test step 2
    });

    // Assertions
    expect(result).toBe(expected);
  });
});
```

### Performance Testing Pattern
```typescript
test('operation completes within threshold', async ({ page }) => {
  const startTime = Date.now();
  
  // Perform operation
  await someSlowOperation();
  
  const duration = Date.now() - startTime;
  console.log(`Operation took ${duration}ms`);
  
  expect(duration).toBeLessThan(THRESHOLD);
});
```

## Test Data

Use these conventions for test data:
- **Names:** "E2E Test Customer", "Concurrent Test 1", etc.
- **Phones:** "555-XXX-XXXX" format
- **Emails:** "test@example.com", "e2e-test@example.com"
- **Addresses:** "123 Test Street, New York, NY 10001"

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          CI: true
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests Timeout
- Check dev server is running
- Increase timeout in `playwright.config.ts`
- Use `--debug` flag to see what's happening

### Performance Tests Fail
- Check database has proper indexes
- Verify no slow queries in Supabase logs
- Run tests individually to isolate issues

### Flaky Tests
- Add proper waits: `waitForLoadState('networkidle')`
- Use data-testid attributes for reliable selectors
- Avoid timing-dependent assertions

## Best Practices

1. **Use data-testid attributes** for critical elements
2. **Add logging** for performance measurements
3. **Test both happy path and errors**
4. **Include mobile tests** for responsive design
5. **Keep tests independent** - no shared state
6. **Use meaningful test names** describing what's tested
7. **Add comments** explaining complex test logic

## Performance Monitoring

Run the baseline test regularly to track performance trends:

```bash
npm run test:e2e -- e2e/checkout-database-performance.spec.ts -g "baseline"
```

Compare measurements over time to identify gradual performance degradation.
