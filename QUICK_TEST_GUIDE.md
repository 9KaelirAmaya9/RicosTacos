# Quick Testing Guide
## Rapid Testing Checklist for La Taco Atelier

---

## 🎯 Critical Path Testing (5 minutes)

### 1. Order Placement Flow
```
1. Browse menu → Add item to cart
2. View cart → Verify items and totals
3. Enter customer info → Validate required fields
4. Select delivery → Enter address → Validate zone
5. Proceed to payment → Complete payment
6. Verify order confirmation
```

### 2. Admin Dashboard
```
1. Login as admin
2. View dashboard metrics
3. Navigate to orders
4. Search/filter orders
5. Update order status
6. Print receipt
```

### 3. Kitchen Display
```
1. Login as kitchen staff
2. View pending orders
3. Update order status (pending → preparing → ready)
4. Verify real-time updates
```

---

## 🔍 Quick Validation Tests

### Input Validation
- [ ] Empty name → Error shown
- [ ] Invalid email → Error shown
- [ ] Short phone → Error shown
- [ ] Empty delivery address → Error shown

### Cart Functionality
- [ ] Add item → Appears in cart
- [ ] Update quantity → Changes reflected
- [ ] Remove item → Item removed
- [ ] Clear cart → All items removed

### Error Scenarios
- [ ] Network offline → Graceful error
- [ ] Invalid address → Pickup suggestion
- [ ] Payment failure → Clear error message
- [ ] Session expired → Re-authentication prompt

---

## ⚡ Performance Quick Check

- [ ] Page loads < 3 seconds
- [ ] Cart updates instant
- [ ] Form submissions < 500ms
- [ ] Real-time updates < 1 second

---

## 🔒 Security Quick Check

- [ ] Cannot access /admin without role
- [ ] Cannot access /kitchen without role
- [ ] Invalid inputs rejected
- [ ] Payment data secure

---

## 📱 Compatibility Quick Check

- [ ] Works on Chrome
- [ ] Works on Safari
- [ ] Works on mobile
- [ ] Responsive layout

---

## ✅ All Systems Go Checklist

- [ ] Order placement works
- [ ] Payment processing works
- [ ] Admin dashboard works
- [ ] Kitchen display works
- [ ] Real-time updates work
- [ ] Error handling works
- [ ] Mobile responsive
- [ ] Cross-browser compatible

**If all checked → System is production-ready! ✅**


