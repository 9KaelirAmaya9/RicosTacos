# Email Setup Guide: Resend vs Supabase

## Quick Answer

### For Sign-In Functionality: ❌ **NO Resend Needed**
- Supabase handles email confirmations automatically
- Uses Supabase's built-in email service
- Works out of the box - no setup required

### For Order Receipts: ✅ **YES, Resend Recommended**
- Resend is already integrated in the code
- Provides professional branded emails
- Better control over email templates
- Optional but recommended

---

## Current Email Setup

### 1. **Sign-In Emails (Supabase Built-In)** ✅

**What Supabase Handles:**
- ✅ Email confirmation links
- ✅ Password reset emails
- ✅ Magic link emails
- ✅ Email change confirmations

**Configuration:**
- Go to Supabase Dashboard → Authentication → Email Templates
- Customize templates if needed
- **No Resend needed** - works automatically

**Status:** Already working! ✅

---

### 2. **Order Receipts (Resend)** ⚠️

**Current Implementation:**
- ✅ `send-order-confirmation` function uses Resend
- ✅ `send-order-notification` function uses Resend
- ⚠️ **Optional** - code checks if `RESEND_API_KEY` exists
- ⚠️ If missing, emails are skipped (non-blocking)

**What Happens Without Resend:**
- Orders still process successfully ✅
- Customers don't receive email receipts ❌
- Payment still works ✅
- Order confirmation page still shows ✅

**What Happens With Resend:**
- ✅ Professional branded email receipts
- ✅ Order confirmation emails
- ✅ Order status update emails
- ✅ Better customer experience

---

## Do You Need Resend?

### **For Sign-In: NO** ❌
Supabase handles this automatically.

### **For Receipts: YES (Recommended)** ✅
- Better customer experience
- Professional branded emails
- Order confirmations
- Receipts for accounting

---

## How to Set Up Resend

### Step 1: Create Resend Account
1. Go to https://resend.com
2. Sign up for free account
3. Verify your email

### Step 2: Get API Key
1. Go to API Keys section
2. Create new API key
3. Copy the key (starts with `re_...`)

### Step 3: Add to Environment Variables

**For Local Development (.env):**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**For Lovable:**
1. Go to Project Settings → Environment Variables
2. Add: `RESEND_API_KEY` = `re_xxxxxxxxxxxxx`
3. Save

**For Supabase Edge Functions:**
1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Add: `RESEND_API_KEY` = `re_xxxxxxxxxxxxx`
3. Save

### Step 4: Verify Domain (Optional but Recommended)

**For Production:**
1. In Resend dashboard, go to Domains
2. Add your domain (e.g., `ricostacos.com`)
3. Add DNS records to verify
4. Update email `from` address in code

**For Testing:**
- Can use `onboarding@resend.dev` (default)
- Limited to 100 emails/day
- Good for development

---

## Current Email Functions

### 1. `send-order-confirmation`
**Location:** `supabase/functions/send-order-confirmation/index.ts`
**Purpose:** Sends receipt after payment
**Uses:** Resend
**Status:** ✅ Ready (needs `RESEND_API_KEY`)

### 2. `send-order-notification`
**Location:** `supabase/functions/send-order-notification/index.ts`
**Purpose:** Sends order notification to customer
**Uses:** Resend (optional)
**Status:** ✅ Ready (needs `RESEND_API_KEY`)

---

## Email Templates

### Current Templates:
1. **Order Confirmation Email** - Beautiful HTML template
   - Order number
   - Items list
   - Total amount
   - Delivery/pickup info
   - Next steps

2. **Order Notification** - Simple notification
   - Order received confirmation
   - Basic order details

---

## Cost

### Resend Pricing:
- **Free Tier:** 3,000 emails/month
- **Pro:** $20/month for 50,000 emails
- **Pay as you go:** $0.30 per 1,000 emails

### Supabase Email (Built-In):
- **Free** - Included with Supabase
- Unlimited for auth emails
- Basic templates

---

## Recommendation

### For Production: ✅ **Set Up Resend**

**Why:**
1. Professional branded receipts
2. Better customer experience
3. Email receipts for accounting
4. Order confirmations
5. Status updates

**Setup Time:** ~10 minutes
**Cost:** Free for up to 3,000 emails/month

### For Development: ⚠️ **Optional**

- Can test without Resend
- Orders still work
- Just no email receipts
- Can add later

---

## Quick Setup Checklist

- [ ] Create Resend account
- [ ] Get API key
- [ ] Add `RESEND_API_KEY` to Lovable environment variables
- [ ] Add `RESEND_API_KEY` to Supabase Edge Functions secrets
- [ ] Test order confirmation email
- [ ] (Optional) Verify domain for production
- [ ] (Optional) Customize email templates

---

## Summary

| Feature | Needs Resend? | Status |
|---------|---------------|--------|
| Sign-in emails | ❌ No | ✅ Working (Supabase) |
| Password reset | ❌ No | ✅ Working (Supabase) |
| Email confirmation | ❌ No | ✅ Working (Supabase) |
| Order receipts | ✅ Yes (recommended) | ⚠️ Needs `RESEND_API_KEY` |
| Order confirmations | ✅ Yes (recommended) | ⚠️ Needs `RESEND_API_KEY` |

**Bottom Line:**
- **Sign-in works without Resend** ✅
- **Receipts need Resend** (but orders work without it)
- **Recommended:** Set up Resend for better customer experience

---

## Next Steps

1. **For sign-in:** Nothing needed - already works! ✅
2. **For receipts:** Set up Resend (see steps above)
3. **Test:** Place a test order and verify email receipt

---

**Questions?** Check the console logs - they'll show if Resend is configured or not.

