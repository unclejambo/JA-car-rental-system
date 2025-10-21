# Auto-Cancel & Payment Deadline Logic Analysis

**Date:** October 19, 2025  
**Analysis of:** Payment deadline rules and auto-cancellation implementation

---

## 📋 Executive Summary

The auto-cancel system is **implemented and functional** with the following characteristics:

### ✅ What's Working:
1. Auto-cancel scheduler runs every hour
2. Payment deadline logic is based on booking start date proximity
3. Expired unpaid bookings are automatically deleted
4. Car status is restored to "Available" after cancellation
5. Transaction records are created for audit trail

### ⚠️ Issues Identified:
1. **CRITICAL:** No payment deadline stored in database (calculated on-the-fly)
2. **CRITICAL:** Auto-cancel DELETES bookings instead of marking them as cancelled
3. **Missing:** Customer notification before/after auto-cancellation
4. **Missing:** Grace period or warning system
5. **Inconsistency:** `isPay` field usage vs `payment_status`

---

## 🔍 Current Implementation Details

### Payment Deadline Rules

Located in: `backend/src/utils/autoCancel.js`

The system uses **THREE different deadline periods** based on booking start date:

| Scenario | Deadline | Example |
|----------|----------|---------|
| **Same-day booking** (start_date = TODAY) | 1 hour from booking_date | Book at 10:00 AM → Must pay by 11:00 AM |
| **Within 3 days** (start_date is 1-3 days away) | 24 hours from booking_date | Book Monday for Wednesday → Must pay by Tuesday same time |
| **Standard booking** (start_date > 3 days away) | 72 hours (3 days) from booking_date | Book today for next month → Must pay within 3 days |

### Code Analysis

```javascript
// From autoCancel.js lines 64-81
if (daysUntilStart === 0) {
  // Booking start date is TODAY - 1 hour deadline
  deadline = new Date(bookingDate.getTime() + (1 * 60 * 60 * 1000));
  deadlineDescription = '1 hour (same-day booking)';
} else if (daysUntilStart > 0 && daysUntilStart <= 3) {
  // Booking start date is within 3 days (but not today) - 24 hour deadline
  deadline = new Date(bookingDate.getTime() + (24 * 60 * 60 * 1000));
  deadlineDescription = '24 hours (booking within 3 days)';
} else {
  // Booking start date is more than 3 days away - 72 hour (3 day) deadline
  deadline = new Date(bookingDate.getTime() + (72 * 60 * 60 * 1000));
  deadlineDescription = '72 hours (standard deadline)';
}
```

---

## 🚨 Critical Issues

### Issue #1: No Payment Deadline Field in Database

**Problem:**  
The `Booking` model does not have a `payment_deadline` field. The deadline is calculated on-the-fly during each auto-cancel check.

**Why it's a problem:**
- Users cannot see their payment deadline in the UI
- No way to query bookings by payment deadline
- Inconsistent calculation if logic changes
- Cannot send "deadline approaching" notifications

**Recommendation:**
```prisma
model Booking {
  // ... existing fields ...
  payment_deadline DateTime? @db.Timestamptz(6)
  // ... rest of fields ...
}
```

Then calculate and store it during booking creation in `bookingController.js`:

```javascript
// In createBooking function (around line 290)
const daysUntilStart = Math.ceil((startDateTime - today) / (1000 * 60 * 60 * 24));
let paymentDeadline;

if (daysUntilStart === 0) {
  paymentDeadline = new Date(bookingDate.getTime() + (1 * 60 * 60 * 1000));
} else if (daysUntilStart > 0 && daysUntilStart <= 3) {
  paymentDeadline = new Date(bookingDate.getTime() + (24 * 60 * 60 * 1000));
} else {
  paymentDeadline = new Date(bookingDate.getTime() + (72 * 60 * 60 * 1000));
}

const bookingData = {
  // ... existing fields ...
  payment_deadline: paymentDeadline,
  // ... rest of fields ...
};
```

---

### Issue #2: Bookings Are DELETED Instead of Marked as Cancelled

**Problem:**  
Line 114-117 in `autoCancel.js`:

```javascript
// Then delete the booking (auto-cancel for non-payment)
await prisma.booking.delete({
  where: { booking_id: booking.booking_id }
});
```

**Why it's a problem:**
- **Loss of historical data** - No record that the booking ever existed
- **Cannot track cancellation metrics** - How many bookings are auto-cancelled?
- **No audit trail** - Which bookings failed due to non-payment?
- **Customer confusion** - Booking disappears from their history
- **Refund issues** - If any payment was made, how to track refunds?

**Recommendation:**
Change deletion to update with cancellation flags:

```javascript
// Instead of deleting, update the booking
await prisma.booking.update({
  where: { booking_id: booking.booking_id },
  data: {
    isCancel: true,
    booking_status: 'Auto-Cancelled',
    payment_status: 'Expired',
    // Could add: auto_cancelled_at: now,
    // Could add: cancellation_reason: 'Payment deadline expired'
  }
});
```

Also need to handle payment deletion differently:
```javascript
// Don't delete payments if you want to track them
// If booking had any payments, they should remain for refund processing
if (deletedPayments.count > 0) {
  // Flag payments as part of cancelled booking instead of deleting
  await prisma.payment.updateMany({
    where: { booking_id: booking.booking_id },
    data: { 
      verification_status: 'cancelled_booking'
    }
  });
}
```

---

### Issue #3: No Customer Notifications

**Problem:**  
Lines 145-146 in `autoCancel.js`:

```javascript
// TODO: Send email notification to customer
// Could use nodemailer here to notify customer their booking was auto-cancelled
```

The TODO is never implemented.

**Impact:**
- Customers have no idea their booking was cancelled
- No warning before deadline expires
- Poor user experience

**Recommendation:**

1. **Deadline Warning Notification** (24 hours before deadline):
```javascript
// Add to autoCancel.js or separate warning scheduler
export const sendPaymentDeadlineWarnings = async () => {
  const warningWindow = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours from now
  
  const bookingsNearDeadline = await prisma.booking.findMany({
    where: {
      booking_status: 'Pending',
      payment_status: 'Unpaid',
      payment_deadline: {
        lte: warningWindow,
        gte: new Date() // Not expired yet
      }
    },
    include: { customer: true, car: true }
  });
  
  for (const booking of bookingsNearDeadline) {
    await sendPaymentDeadlineWarningNotification(booking);
  }
};
```

2. **Auto-Cancellation Notification**:
```javascript
// After cancellation (replace the TODO)
await sendBookingAutoCancelledNotification(
  booking.customer.email,
  booking.customer.first_name,
  booking,
  'Payment deadline expired'
);
```

---

### Issue #4: Inconsistent Field Usage

**Problem:**  
The system uses both `isPay` and `payment_status` to track payment state:

From `autoCancel.js` line 22-25:
```javascript
where: {
  booking_status: 'Pending',
  OR: [
    { isPay: false },
    { isPay: null }
  ],
  isCancel: false,
},
```

But `paymentController.js` updates `payment_status`:
```javascript
bookingUpdateData.payment_status = finalBalance <= 0 ? 'Paid' : 'Unpaid';
```

**Why it's a problem:**
- Redundant fields cause confusion
- May have synchronization issues
- Unclear which is the "source of truth"

**Recommendation:**
Choose ONE field to track payment status:
- **Option A:** Use only `payment_status` (more descriptive)
- **Option B:** Use only `isPay` (simpler boolean)

If using `payment_status`, update `autoCancel.js`:
```javascript
where: {
  booking_status: 'Pending',
  payment_status: 'Unpaid',
  isCancel: false,
},
```

---

## 📊 Auto-Cancel Scheduler Configuration

**Location:** `backend/src/index.js` (lines 115-132)

```javascript
// Runs every hour to check for expired bookings
const AUTO_CANCEL_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

// Run immediately on startup (after 30 seconds)
setTimeout(() => {
  console.log('Running initial auto-cancel check...');
  autoCancelExpiredBookings();
}, 30000);

// Then run every hour
setInterval(() => {
  console.log('Running scheduled auto-cancel check...');
  autoCancelExpiredBookings();
}, AUTO_CANCEL_INTERVAL);
```

### Current Behavior:
- ✅ Runs on server startup (after 30 seconds)
- ✅ Runs every hour automatically
- ✅ Can be manually triggered via `/api/auto-cancel/trigger` endpoint

### Potential Issues:
1. **30-second delay might miss urgent cancellations** during server restart
2. **1-hour interval might be too long** for 1-hour deadline bookings
3. **No error recovery** - if one check fails, waits another hour

### Recommendations:

1. **Reduce interval for production:**
```javascript
const AUTO_CANCEL_INTERVAL = 15 * 60 * 1000; // 15 minutes instead of 1 hour
```

2. **Add error handling with retry:**
```javascript
const runAutoCancelWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await autoCancelExpiredBookings();
      break; // Success, exit retry loop
    } catch (error) {
      console.error(`Auto-cancel attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        // Send alert to admin if all retries fail
        console.error('🚨 Auto-cancel failed after all retries!');
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s before retry
    }
  }
};

setInterval(runAutoCancelWithRetry, AUTO_CANCEL_INTERVAL);
```

---

## 🔄 Complete Flow Analysis

### Booking Creation Flow

1. **Customer creates booking** → `bookingController.js:createBooking()`
   - Status: `booking_status = "Pending"`, `payment_status = "Unpaid"`
   - Car status immediately updated to `"Rented"` (Line 363-369)
   - Balance equals total_amount
   - **Issue:** No `payment_deadline` calculated or stored

2. **Auto-cancel scheduler runs** (every hour)
   - Finds all bookings with `booking_status = "Pending"` and `isPay = false/null`
   - Calculates deadline on-the-fly based on start_date proximity
   - If deadline passed → **DELETES** booking + associated payments
   - Updates car status back to `"Available"`
   - Creates transaction record with `cancellation_date`
   - **Issue:** No customer notification

### Payment Flow

1. **Customer makes payment** → `paymentController.js:createPayment()`
   - Creates payment record with amount
   - Calculates running balance
   - Updates booking:
     - `balance` = remaining amount
     - `payment_status` = "Paid" if fully paid, else "Unpaid"
     - `booking_status` may change to "Confirmed" based on `determineBookingStatus()`
   - Sends notifications for Cash payments
   - **Issue:** Doesn't clear/update payment_deadline

2. **Booking status logic** (Line 78-87):
```javascript
const determineBookingStatus = (totalPaid, totalAmount, currentStatus) => {
  if (totalPaid <= 0) {
    return 'Pending';
  } else if (totalPaid >= totalAmount) {
    return currentStatus in ['Confirmed', 'In Progress', 'Completed', 'Returned'] 
      ? currentStatus 
      : 'Confirmed';
  } else {
    return 'Confirmed'; // Partially paid
  }
};
```

**Issue:** Partial payments change status to "Confirmed", which removes booking from auto-cancel consideration! This means:
- Customer pays $1 of $1000 → Status becomes "Confirmed"
- Auto-cancel won't touch it anymore (only looks for "Pending")
- **This is a major loophole!**

---

## 🐛 Discovered Bugs

### Bug #1: Partial Payment Bypass
**Severity:** HIGH

**Description:** Making any payment (even $1) changes `booking_status` to "Confirmed", which removes it from auto-cancel consideration.

**Location:** `paymentController.js` lines 78-87 + `autoCancel.js` line 22

**Exploit scenario:**
1. Customer books car for $1000
2. Pays $1 before deadline
3. Status becomes "Confirmed"
4. Auto-cancel never triggers (only checks for "Pending" status)
5. Customer owes $999 but car is marked as rented

**Fix:**
Change auto-cancel query to also check partially paid bookings:
```javascript
const pendingBookings = await prisma.booking.findMany({
  where: {
    OR: [
      { booking_status: 'Pending' },
      { 
        booking_status: 'Confirmed',
        balance: { gt: 0 }, // Has remaining balance
        start_date: { gt: new Date() } // Hasn't started yet
      }
    ],
    payment_status: 'Unpaid',
    isCancel: false,
  },
  // ... rest of query
});
```

Or better yet, don't change status to "Confirmed" until fully paid:
```javascript
const determineBookingStatus = (totalPaid, totalAmount, currentStatus) => {
  if (totalPaid <= 0) {
    return 'Pending';
  } else if (totalPaid >= totalAmount) {
    return currentStatus in ['Confirmed', 'In Progress', 'Completed', 'Returned'] 
      ? currentStatus 
      : 'Confirmed';
  } else {
    // Keep as Pending if not fully paid
    return 'Pending';
  }
};
```

---

### Bug #2: Car Status Mismatch After Failed Auto-Cancel

**Severity:** MEDIUM

**Location:** `autoCancel.js` lines 119-129

**Description:** If booking deletion fails but car status update succeeds, car becomes "Available" while booking still exists in "Rented" state.

**Current code:**
```javascript
try {
  await prisma.booking.delete({ where: { booking_id: booking.booking_id } });
  
  // Update car status back to 'Available'
  if (booking.car?.car_id) {
    await prisma.car.update({
      where: { car_id: booking.car.car_id },
      data: { car_status: 'Available' }
    });
  }
} catch (error) {
  console.error(`❌ Error cancelling booking #${booking.booking_id}:`, error);
  // Error caught but car status might be inconsistent
}
```

**Fix:** Use transaction to ensure atomicity:
```javascript
await prisma.$transaction([
  prisma.booking.update({
    where: { booking_id: booking.booking_id },
    data: { isCancel: true, booking_status: 'Auto-Cancelled' }
  }),
  prisma.car.update({
    where: { car_id: booking.car.car_id },
    data: { car_status: 'Available' }
  })
]);
```

---

### Bug #3: Transaction Creation After Booking Deletion

**Severity:** LOW

**Location:** `autoCancel.js` lines 132-144

**Description:** Transaction record references `booking_id` that was just deleted, which may violate foreign key constraints.

**Current code:**
```javascript
await prisma.booking.delete({ where: { booking_id } });

// Later...
await prisma.transaction.create({
  data: {
    booking_id: booking.booking_id, // This booking_id was just deleted!
    // ...
  },
});
```

**Impact:** Depends on foreign key configuration in Prisma schema. Currently the Transaction model references Booking, so this could fail.

**Fix:** Create transaction record BEFORE deleting booking, or keep booking and mark as cancelled.

---

## 📈 Recommendations Priority

### 🔴 HIGH PRIORITY (Must Fix Before Production)

1. **Add `payment_deadline` field to database**
   - Update Prisma schema
   - Calculate and store during booking creation
   - Display in customer UI

2. **Fix partial payment bypass bug**
   - Update `determineBookingStatus()` logic
   - Keep bookings as "Pending" until fully paid

3. **Change deletion to soft-delete (status update)**
   - Keep historical records
   - Enable refund processing
   - Improve audit trail

4. **Implement customer notifications**
   - Warning 24 hours before deadline
   - Confirmation when auto-cancelled

### 🟡 MEDIUM PRIORITY (Important for UX)

5. **Reduce scheduler interval to 15 minutes**
   - Critical for 1-hour deadline bookings
   - Better responsiveness

6. **Add retry logic and error handling**
   - Prevent silent failures
   - Alert admins on persistent errors

7. **Standardize payment status tracking**
   - Use either `isPay` OR `payment_status`, not both
   - Update all queries consistently

### 🟢 LOW PRIORITY (Nice to Have)

8. **Add grace period**
   - 15-30 minute buffer before cancellation
   - Friendly user experience

9. **Admin dashboard for auto-cancellations**
   - View cancelled bookings
   - Statistics and trends
   - Manual override capability

10. **Payment deadline reminders**
    - SMS notifications
    - Email reminders at 50% and 75% of deadline

---

## 🧪 Testing Checklist

### Test Scenarios

- [ ] **Same-day booking (1-hour deadline)**
  - Create booking with `start_date = today`
  - Verify 1-hour deadline calculated
  - Wait 1 hour, trigger auto-cancel
  - Verify booking cancelled and car available

- [ ] **Within 3-day booking (24-hour deadline)**
  - Create booking with `start_date = 2 days from now`
  - Verify 24-hour deadline
  - Wait 24+ hours, trigger auto-cancel

- [ ] **Standard booking (72-hour deadline)**
  - Create booking with `start_date = 1 week from now`
  - Verify 72-hour deadline
  - Wait 3+ days, trigger auto-cancel

- [ ] **Partial payment bypass test**
  - Create booking for $1000
  - Pay $1
  - Check if status changes to "Confirmed"
  - Verify auto-cancel still runs after deadline

- [ ] **Full payment protection**
  - Create booking
  - Pay in full before deadline
  - Verify auto-cancel does NOT cancel it

- [ ] **Scheduler functionality**
  - Restart server
  - Verify initial check runs after 30 seconds
  - Verify hourly checks run
  - Verify manual trigger endpoint works

- [ ] **Car status consistency**
  - Create booking → verify car status = "Rented"
  - Auto-cancel → verify car status = "Available"
  - Multiple bookings on same car → verify no conflicts

---

## 📝 Implementation Checklist

### Database Changes
- [ ] Add `payment_deadline` field to Booking model
- [ ] Add `auto_cancelled_at` field (optional)
- [ ] Add `cancellation_reason` field (optional)
- [ ] Run migration

### Code Changes
- [ ] Update `bookingController.js` to calculate and store payment_deadline
- [ ] Update `autoCancel.js` to use stored deadline instead of calculating
- [ ] Change deletion to status update in auto-cancel
- [ ] Fix partial payment bypass in `determineBookingStatus()`
- [ ] Add customer notification functions
- [ ] Update scheduler interval to 15 minutes
- [ ] Add error handling and retry logic
- [ ] Remove redundant `isPay` field or synchronize it

### Testing
- [ ] Unit tests for deadline calculation
- [ ] Integration tests for auto-cancel flow
- [ ] Test all three deadline scenarios
- [ ] Test partial payment scenarios
- [ ] Test notification delivery
- [ ] Load test scheduler performance

### Documentation
- [ ] Update API documentation
- [ ] Add admin guide for auto-cancel monitoring
- [ ] Create customer FAQ about payment deadlines
- [ ] Document notification templates

---

## 🎯 Conclusion

The auto-cancel payment deadline system is **functionally implemented** but has **critical issues** that need addressing:

1. ✅ **Working:** Basic auto-cancel logic, scheduler, deadline rules
2. ⚠️ **Needs fixing:** Database storage, notification system, partial payment bypass
3. 🔴 **Critical:** Booking deletion instead of soft-delete, missing payment_deadline field

**Recommended Action:** Address HIGH PRIORITY items before production deployment.

---

**Last Updated:** October 19, 2025  
**Reviewed By:** GitHub Copilot  
**Status:** ⚠️ Needs Improvements
