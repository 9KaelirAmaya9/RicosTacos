# Sentry Error Tracking Setup
## Production Error Monitoring

---

## Overview

Sentry has been integrated for comprehensive error tracking, performance monitoring, and session replay.

---

## Setup Instructions

### 1. Create Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account
3. Create a new project (select React)
4. Copy your DSN (Data Source Name)

### 2. Configure Environment Variable

Add to your `.env` file:

```env
VITE_SENTRY_DSN=your_sentry_dsn_here
```

**Important**: The DSN is safe to expose in client-side code. It's a public key.

### 3. Deploy

Sentry will automatically initialize when `VITE_SENTRY_DSN` is set.

---

## Features

### Error Tracking

- ✅ Uncaught errors
- ✅ Unhandled promise rejections
- ✅ React Error Boundary errors
- ✅ 404 errors (logged as warnings)

### Performance Monitoring

- ✅ Transaction tracing
- ✅ Performance metrics
- ✅ Slow operation detection

### Session Replay

- ✅ User session recordings
- ✅ Error replay
- ✅ Privacy-focused (masks text and media)

---

## Usage

### Automatic Tracking

Errors are automatically captured:
- Global error handlers
- React Error Boundary
- Unhandled promise rejections

### Manual Tracking

```typescript
import { captureException, captureMessage } from '@/utils/sentry';

// Capture an exception
try {
  // risky code
} catch (error) {
  captureException(error, {
    context: 'checkout',
    userId: user.id,
  });
}

// Capture a message
captureMessage('User completed checkout', 'info');
```

### User Context

```typescript
import { setUser, clearUser } from '@/utils/sentry';

// Set user context
setUser({
  id: user.id,
  email: user.email,
  name: user.name,
});

// Clear user context (on logout)
clearUser();
```

---

## Configuration

### Environment-Based Settings

- **Development**: 100% sample rate (all events)
- **Production**: 10% sample rate (reduces volume)

### Customization

Edit `src/utils/sentry.ts` to customize:
- Sample rates
- Integrations
- Release tracking
- Environment settings

---

## Disabling Sentry

If `VITE_SENTRY_DSN` is not set, Sentry is automatically disabled (no-op). No errors will occur.

---

## Best Practices

1. **Don't log sensitive data**: Sentry automatically scrubs common patterns
2. **Use context**: Add relevant context to errors
3. **Set user context**: Helps track user-specific issues
4. **Monitor performance**: Review slow transactions
5. **Review replays**: Watch session replays for UX issues

---

## Sentry Dashboard

Access your Sentry dashboard at:
- **URL**: https://sentry.io
- **Features**:
  - Error list and details
  - Performance metrics
  - Session replays
  - Release tracking
  - User impact analysis

---

## Troubleshooting

### Sentry not capturing errors

1. Check `VITE_SENTRY_DSN` is set correctly
2. Check browser console for Sentry initialization messages
3. Verify network requests to Sentry (check Network tab)

### Too many events

1. Reduce sample rates in `sentry.ts`
2. Add filters for specific error types
3. Use `beforeSend` hook to filter events

### Privacy concerns

- Session replay masks all text and media by default
- Can disable session replay if needed
- All data is encrypted in transit

---

## Cost

Sentry free tier includes:
- 5,000 errors/month
- 10,000 performance units/month
- 1,000 session replays/month

For production, consider upgrading based on volume.


