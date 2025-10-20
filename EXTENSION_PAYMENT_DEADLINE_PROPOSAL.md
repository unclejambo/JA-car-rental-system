# Extension Payment Deadline System - Proposal & Process Flow

**Date:** October 20, 2025  
**Purpose:** Integration of payment deadline logic with booking extension system  
**Status:** 📋 Proposal for Review

---

## 📋 Executive Summary

This document outlines how the **payment deadline auto-cancel system** will integrate with the **booking extension feature**. The goal is to ensure that extension requests and approvals properly handle payment deadlines, prevent auto-cancellation during pending extensions, and manage continuous extensions correctly.

---

## 🎯 Core Requirements (Based on Your Specifications)

### 1. Extension Approval Workflow
- ✅ Customer requests extension → Goes to admin approval (ALREADY IMPLEMENTED)
- ✅ Extension creates record in `Extension` table (ALREADY IMPLEMENTED)
- 🆕 **NEW:** Extension request should have its own payment deadline
- 🆕 **NEW:** Auto-cancel should handle extension requests differently

### 2. Auto-Cancel Behavior with Extensions
When auto-cancel runs:
- **If extension is PENDING (isExtend = true):**
  - Should NOT cancel the booking immediately
  - Should give grace period for admin to review
  - OR revert extension and restore original end_date

- **If extension is REJECTED by admin:**
  - Revert `end_date` back to `old_end_date` ✅ (ALREADY IMPLEMENTED)
  - Restore `total_amount` and `balance` ✅ (ALREADY IMPLEMENTED)
  - Reset payment deadline based on original end_date 🆕 (TO BE IMPLEMENTED)

### 3. Continuous Extensions
- Keep same `booking_id` ✅ (ALREADY IMPLEMENTED)
- Create new `Extension` record with new `extension_id` ✅ (ALREADY IMPLEMENTED)
- Update `old_end_date` to be the previous `new_end_date` 🆕 (NEEDS MODIFICATION)
- Set new `new_end_date` for the latest extension 🆕 (NEEDS MODIFICATION)

---

## 🗂️ Database Schema Analysis

### Current Extension Table Structure
```prisma
model Extension {
  extension_id Int       @id @default(autoincrement())
  booking_id   Int
  old_end_date DateTime  @db.Timestamptz(6)
  new_end_date DateTime? @db.Timestamptz(6)
  approve_time DateTime? @db.Timestamptz(6)
  booking      Booking   @relation(fields: [booking_id], references: [booking_id])
}
```

### Proposed Addition to Booking Table
```prisma
model Booking {
  // ... existing fields ...
  payment_deadline DateTime? @db.Timestamptz(6) // NEW FIELD
  extension_payment_deadline DateTime? @db.Timestamptz(6) // NEW FIELD (for extensions)
  // ... existing fields ...
}
```

**Why two deadline fields?**
- `payment_deadline`: For initial booking payment
- `extension_payment_deadline`: For extension additional cost payment

---

## 🔄 Complete Process Flow

### **SCENARIO 1: First Extension Request**

#### Step 1: Customer Requests Extension
**Function:** `extendMyBooking()` in `bookingController.js`

**Current Behavior:**
```javascript
// Line 1163 - Current implementation
data: {
  isExtend: true,
  new_end_date: newEndDate,
  total_amount: newTotalAmount,
  balance: newBalance,
  payment_status: 'Unpaid',
}
```

**Proposed Enhancement:**
```javascript
// Calculate extension payment deadline
const extensionDeadline = calculateExtensionPaymentDeadline(booking.end_date);

data: {
  isExtend: true,
  new_end_date: newEndDate,
  total_amount: newTotalAmount,
  balance: newBalance,
  payment_status: 'Unpaid',
  extension_payment_deadline: extensionDeadline, // NEW
}
```

**Extension Payment Deadline Rules:**
- **If extension is requested while booking is ongoing:** 24 hours to pay additional cost
- **If extension is approved BEFORE booking starts:** Use standard payment deadline rules

#### Step 2: Admin Approves Extension
**Function:** `confirmExtensionRequest()` in `bookingController.js`

**Current Behavior (Line 1282-1289):**
```javascript
await prisma.extension.create({
  data: {
    booking_id: bookingId,
    old_end_date: booking.end_date,
    new_end_date: booking.new_end_date,
    approve_time: phTime,
  },
});
```

**Proposed Enhancement:**
```javascript
// Check if there are previous extensions for this booking
const previousExtensions = await prisma.extension.findMany({
  where: { booking_id: bookingId },
  orderBy: { extension_id: 'desc' },
  take: 1
});

// Determine the correct old_end_date
let oldEndDate;
if (previousExtensions.length > 0) {
  // Continuous extension: use previous new_end_date as old_end_date
  oldEndDate = previousExtensions[0].new_end_date;
} else {
  // First extension: use original booking end_date
  oldEndDate = booking.end_date;
}

await prisma.extension.create({
  data: {
    booking_id: bookingId,
    old_end_date: oldEndDate, // MODIFIED
    new_end_date: booking.new_end_date,
    approve_time: phTime,
  },
});

// Update booking with extension deadline reset
await prisma.booking.update({
  where: { booking_id: bookingId },
  data: {
    end_date: booking.new_end_date,
    dropoff_time: newDropoffTime,
    new_end_date: null,
    isExtend: false,
    payment_status: 'Unpaid',
    extension_payment_deadline: null, // Clear extension deadline after approval
    // Keep payment_deadline if balance still exists
  },
});
```

#### Step 3: Customer Pays Extension Fee
**Function:** `createPayment()` in `paymentController.js`

**Proposed Enhancement:**
```javascript
// After payment is recorded successfully
// Clear extension_payment_deadline if balance is 0
if (finalBalance <= 0) {
  await prisma.booking.update({
    where: { booking_id: Number(booking_id) },
    data: {
      extension_payment_deadline: null,
      payment_status: 'Paid'
    }
  });
}
```

---

### **SCENARIO 2: Continuous Extensions (Multiple Extensions)**

#### Example Timeline:
1. **Original booking:** Dec 1-5 (5 days) - `end_date = Dec 5`
2. **First extension:** Dec 5 → Dec 8 (+3 days)
   - Extension #1: `old_end_date = Dec 5`, `new_end_date = Dec 8`
   - Booking: `end_date = Dec 8`
3. **Second extension:** Dec 8 → Dec 12 (+4 days)
   - Extension #2: `old_end_date = Dec 8`, `new_end_date = Dec 12`
   - Booking: `end_date = Dec 12`
4. **Third extension:** Dec 12 → Dec 15 (+3 days)
   - Extension #3: `old_end_date = Dec 12`, `new_end_date = Dec 15`
   - Booking: `end_date = Dec 15`

#### Implementation Logic:
```javascript
// In confirmExtensionRequest() - MODIFIED LOGIC

// Get the most recent approved extension for this booking
const latestExtension = await prisma.extension.findFirst({
  where: { 
    booking_id: bookingId,
    approve_time: { not: null } // Only approved extensions
  },
  orderBy: { extension_id: 'desc' }
});

// Determine old_end_date based on extension history
const oldEndDate = latestExtension 
  ? latestExtension.new_end_date  // Use previous extension's new date
  : booking.end_date;              // Use original booking end date

// Create new extension record
await prisma.extension.create({
  data: {
    booking_id: bookingId,
    old_end_date: oldEndDate,        // Previous new_end_date OR original end_date
    new_end_date: booking.new_end_date, // Latest requested end_date
    approve_time: phTime,
  },
});
```

**Extension Table After Multiple Extensions:**
```
extension_id | booking_id | old_end_date | new_end_date | approve_time
-------------|------------|--------------|--------------|-------------
1            | 123        | 2025-12-05   | 2025-12-08   | 2025-12-01 10:00
2            | 123        | 2025-12-08   | 2025-12-12   | 2025-12-05 14:30
3            | 123        | 2025-12-12   | 2025-12-15   | 2025-12-10 09:15
```

---

### **SCENARIO 3: Extension Rejected by Admin**

#### Current Behavior (ALREADY CORRECT):
**Function:** `rejectExtensionRequest()` in `bookingController.js`

```javascript
// Lines 1429-1440 - Current implementation
const restoredTotalAmount = (booking.total_amount || 0) - additionalCost;
const restoredBalance = (booking.balance || 0) - additionalCost;

await prisma.booking.update({
  where: { booking_id: bookingId },
  data: {
    new_end_date: null,
    isExtend: false,
    total_amount: restoredTotalAmount,
    balance: restoredBalance,
    payment_status: paymentStatus,
  },
});
```

**Proposed Enhancement:**
```javascript
// Add extension_payment_deadline clearing
await prisma.booking.update({
  where: { booking_id: bookingId },
  data: {
    new_end_date: null,
    isExtend: false,
    total_amount: restoredTotalAmount,
    balance: restoredBalance,
    payment_status: paymentStatus,
    extension_payment_deadline: null, // NEW: Clear extension deadline
  },
});
```

**Note:** NO extension record is created when rejected (correct behavior)

---

### **SCENARIO 4: Customer Cancels Extension Request**

#### Current Status: NOT IMPLEMENTED ❌

**Proposed Implementation:**
Add new function `cancelExtensionRequest()` for customers to cancel their own pending extension:

```javascript
export const cancelExtensionRequest = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;

    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: { car: true }
    });

    // Verify ownership
    if (booking.customer_id !== parseInt(customerId)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Must have pending extension
    if (!booking.isExtend) {
      return res.status(400).json({ error: "No pending extension to cancel" });
    }

    // Calculate and restore amounts (same as rejection logic)
    const originalEndDate = new Date(booking.end_date);
    const newEndDate = new Date(booking.new_end_date);
    const additionalDays = Math.ceil(
      (newEndDate - originalEndDate) / (1000 * 60 * 60 * 24)
    );
    const additionalCost = additionalDays * (booking.car.rent_price || 0);
    
    const restoredTotalAmount = (booking.total_amount || 0) - additionalCost;
    const restoredBalance = (booking.balance || 0) - additionalCost;
    const paymentStatus = restoredBalance <= 0 ? 'Paid' : 'Unpaid';

    await prisma.booking.update({
      where: { booking_id: bookingId },
      data: {
        new_end_date: null,
        isExtend: false,
        total_amount: restoredTotalAmount,
        balance: restoredBalance,
        payment_status: paymentStatus,
        extension_payment_deadline: null,
      },
    });

    res.json({
      success: true,
      message: "Extension request cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling extension:", error);
    res.status(500).json({ error: "Failed to cancel extension request" });
  }
};
```

---

### **SCENARIO 5: Auto-Cancel with Pending Extensions**

#### Proposed Auto-Cancel Logic Enhancement

**Current Problem:**
- Auto-cancel checks `booking_status = 'Pending'` and `isPay = false`
- Extension requests might be auto-cancelled while waiting for admin approval

**Proposed Solution:**

Update `autoCancelExpiredBookings()` in `autoCancel.js`:

```javascript
export const autoCancelExpiredBookings = async () => {
  try {
    console.log('🔍 Checking for expired unpaid bookings...');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Find all bookings that need payment deadline checking
    const pendingBookings = await prisma.booking.findMany({
      where: {
        OR: [
          // Original booking payment deadline
          {
            booking_status: 'Pending',
            payment_status: 'Unpaid',
            balance: { gt: 0 },
            isCancel: false,
            isExtend: false, // NOT in extension process
          },
          // Extension payment deadline (for ongoing bookings with extensions)
          {
            booking_status: { in: ['Confirmed', 'In Progress', 'ongoing'] },
            isExtend: false, // Extension already approved
            extension_payment_deadline: { not: null }, // Has extension deadline
            payment_status: 'Unpaid',
            balance: { gt: 0 },
          }
        ]
      },
      include: {
        car: { select: { car_id: true, make: true, model: true, car_status: true } },
        customer: { select: { customer_id: true, first_name: true, last_name: true, email: true } }
      }
    });

    if (pendingBookings.length === 0) {
      console.log('✅ No pending bookings found.');
      return { cancelled: 0, message: 'No pending bookings found' };
    }

    console.log(`🔍 Checking ${pendingBookings.length} booking(s) for expiration...`);

    const expiredBookings = [];

    for (const booking of pendingBookings) {
      let deadline;
      let deadlineType;

      // Check if this is an extension payment deadline
      if (booking.extension_payment_deadline) {
        deadline = new Date(booking.extension_payment_deadline);
        deadlineType = 'extension';
      } else if (booking.payment_deadline) {
        deadline = new Date(booking.payment_deadline);
        deadlineType = 'initial';
      } else {
        // Fallback: calculate deadline if not stored (backward compatibility)
        const bookingDate = new Date(booking.booking_date);
        const startDate = new Date(booking.start_date);
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const daysUntilStart = Math.ceil((startDateOnly - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilStart === 0) {
          deadline = new Date(bookingDate.getTime() + (1 * 60 * 60 * 1000));
        } else if (daysUntilStart > 0 && daysUntilStart <= 3) {
          deadline = new Date(bookingDate.getTime() + (24 * 60 * 60 * 1000));
        } else {
          deadline = new Date(bookingDate.getTime() + (72 * 60 * 60 * 1000));
        }
        deadlineType = 'calculated';
      }

      // Check if deadline has passed
      if (now > deadline) {
        console.log(`⏰ Booking #${booking.booking_id} expired (${deadlineType} deadline). Deadline: ${deadline.toISOString()}`);
        expiredBookings.push({ ...booking, deadlineType });
      }
    }

    if (expiredBookings.length === 0) {
      console.log('✅ No expired bookings found.');
      return { cancelled: 0, message: 'No expired bookings found' };
    }

    console.log(`⚠️ Found ${expiredBookings.length} expired booking(s). Processing...`);

    let cancelledCount = 0;
    const results = [];

    for (const booking of expiredBookings) {
      try {
        // CHANGE: Update booking status instead of deleting
        await prisma.booking.update({
          where: { booking_id: booking.booking_id },
          data: {
            isCancel: true,
            booking_status: 'Auto-Cancelled',
            payment_status: 'Expired',
            // Note: Could add cancellation_reason field
          }
        });

        // Update car status back to 'Available'
        if (booking.car?.car_id) {
          await prisma.car.update({
            where: { car_id: booking.car.car_id },
            data: { car_status: 'Available' }
          });
          
          console.log(`✅ Booking #${booking.booking_id} auto-cancelled (${booking.deadlineType} deadline) and car ${booking.car.car_id} set to Available`);
        }

        // Create transaction record
        await prisma.transaction.create({
          data: {
            booking_id: booking.booking_id,
            customer_id: booking.customer.customer_id,
            car_id: booking.car.car_id,
            completion_date: null,
            cancellation_date: now,
          },
        });

        // TODO: Send notification to customer
        // await sendBookingAutoCancelledNotification(booking);

        cancelledCount++;
        results.push({
          booking_id: booking.booking_id,
          customer: `${booking.customer.first_name} ${booking.customer.last_name}`,
          car: `${booking.car.make} ${booking.car.model}`,
          deadline_type: booking.deadlineType,
          status: 'cancelled'
        });

      } catch (error) {
        console.error(`❌ Error cancelling booking #${booking.booking_id}:`, error);
        results.push({
          booking_id: booking.booking_id,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`✅ Auto-cancel completed: ${cancelledCount} booking(s) cancelled`);
    
    return {
      cancelled: cancelledCount,
      total: expiredBookings.length,
      results: results
    };

  } catch (error) {
    console.error('❌ Error in auto-cancel process:', error);
    return {
      cancelled: 0,
      error: error.message
    };
  }
};
```

**Key Changes:**
1. ✅ Exclude bookings with `isExtend = true` from auto-cancel (pending admin review)
2. ✅ Check `extension_payment_deadline` for ongoing bookings with approved extensions
3. ✅ Update to soft-delete (status change) instead of hard delete
4. ✅ Support both initial and extension payment deadlines

---

## 📊 Extension Payment Deadline Calculation

### Helper Function to Add

**File:** `backend/src/utils/autoCancel.js`

```javascript
/**
 * Calculate payment deadline for extension requests
 * @param {Date} currentEndDate - Current end date of the booking
 * @returns {Date} - Payment deadline for extension
 */
export const calculateExtensionPaymentDeadline = (currentEndDate) => {
  const now = new Date();
  const endDate = new Date(currentEndDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  
  // Calculate days until booking ends
  const daysUntilEnd = Math.ceil((endDateOnly - today) / (1000 * 60 * 60 * 24));
  
  if (daysUntilEnd <= 0) {
    // Booking already ended or ending today - 12 hour deadline
    return new Date(now.getTime() + (12 * 60 * 60 * 1000));
  } else if (daysUntilEnd <= 2) {
    // Ending within 2 days - 24 hour deadline
    return new Date(now.getTime() + (24 * 60 * 60 * 1000));
  } else {
    // Ending in more than 2 days - 48 hour deadline
    return new Date(now.getTime() + (48 * 60 * 60 * 1000));
  }
};
```

**Extension Deadline Rules:**
| Days Until Current End Date | Payment Deadline |
|------------------------------|------------------|
| Already ended or today | 12 hours from request |
| 1-2 days | 24 hours from request |
| 3+ days | 48 hours from request |

---

## 🎯 Summary of Changes Required

### 1. Database Changes
```sql
-- Add new columns to Booking table
ALTER TABLE "Booking" 
ADD COLUMN "payment_deadline" TIMESTAMPTZ,
ADD COLUMN "extension_payment_deadline" TIMESTAMPTZ;
```

**Prisma Schema Update:**
```prisma
model Booking {
  // ... existing fields ...
  payment_deadline DateTime? @db.Timestamptz(6)
  extension_payment_deadline DateTime? @db.Timestamptz(6)
  // ... rest of fields ...
}
```

### 2. Code Modifications

#### File: `backend/src/controllers/bookingController.js`

**A. In `createBooking()` function (~Line 290)**
- Calculate and store `payment_deadline` when booking is created

**B. In `extendMyBooking()` function (~Line 1163)**
- Calculate and store `extension_payment_deadline` when extension is requested

**C. In `confirmExtensionRequest()` function (~Line 1282)**
- Check for previous extensions to determine correct `old_end_date`
- Clear `extension_payment_deadline` after approval
- Update Extension record creation logic

**D. In `rejectExtensionRequest()` function (~Line 1440)**
- Clear `extension_payment_deadline` when extension is rejected

**E. Add new function `cancelExtensionRequest()`**
- Allow customers to cancel their own pending extension requests

#### File: `backend/src/controllers/paymentController.js`

**In `createPayment()` function (~Line 220)**
- Clear `extension_payment_deadline` when extension balance is fully paid

#### File: `backend/src/utils/autoCancel.js`

**A. Add `calculateExtensionPaymentDeadline()` helper function**
- Calculate deadline for extension payment based on current end_date

**B. Update `autoCancelExpiredBookings()` function**
- Exclude bookings with `isExtend = true` from cancellation
- Check both `payment_deadline` and `extension_payment_deadline`
- Change from DELETE to UPDATE (soft-delete)
- Add notification for auto-cancelled bookings

#### File: `backend/src/routes/bookingRoute.js`

**Add new route:**
```javascript
router.put("/:id/cancel-extension", verifyToken, customerOnly, cancelExtensionRequest);
```

---

## 📋 Implementation Checklist

### Phase 1: Database & Core Logic
- [ ] Add `payment_deadline` field to Booking model
- [ ] Add `extension_payment_deadline` field to Booking model
- [ ] Run Prisma migration
- [ ] Update `createBooking()` to calculate and store payment_deadline
- [ ] Add `calculateExtensionPaymentDeadline()` helper function

### Phase 2: Extension Logic
- [ ] Update `extendMyBooking()` to set extension_payment_deadline
- [ ] Update `confirmExtensionRequest()` to handle continuous extensions
- [ ] Update `confirmExtensionRequest()` to clear extension deadline
- [ ] Update `rejectExtensionRequest()` to clear extension deadline
- [ ] Implement `cancelExtensionRequest()` for customers

### Phase 3: Payment Integration
- [ ] Update `createPayment()` to clear extension_payment_deadline when paid
- [ ] Test payment flow with extensions

### Phase 4: Auto-Cancel Integration
- [ ] Update `autoCancelExpiredBookings()` to check extension_payment_deadline
- [ ] Exclude bookings with `isExtend = true` from auto-cancel
- [ ] Change deletion to status update (soft-delete)
- [ ] Test auto-cancel with pending extensions
- [ ] Test auto-cancel with approved extensions + unpaid balance

### Phase 5: Testing
- [ ] Test single extension flow
- [ ] Test continuous extensions (2-3 extensions in a row)
- [ ] Test extension rejection reverting dates
- [ ] Test customer cancelling their own extension
- [ ] Test auto-cancel respecting pending extensions
- [ ] Test auto-cancel enforcing extension payment deadlines
- [ ] Test payment clearing extension deadlines

### Phase 6: Documentation
- [ ] Update API documentation
- [ ] Create admin guide for extension management
- [ ] Create customer FAQ about extensions
- [ ] Document extension payment deadline rules

---

## 🧪 Test Scenarios

### Test 1: Single Extension
1. Create booking (Dec 1-5)
2. Request extension to Dec 8 while booking is ongoing
3. Verify `extension_payment_deadline` is set (24-48 hours)
4. Admin approves extension
5. Verify Extension record created with correct dates
6. Verify booking `end_date` updated to Dec 8
7. Pay extension fee
8. Verify `extension_payment_deadline` cleared

### Test 2: Continuous Extensions
1. Create booking (Dec 1-5)
2. First extension: Dec 5 → Dec 8
   - Extension #1: `old_end_date = Dec 5`, `new_end_date = Dec 8`
3. Second extension: Dec 8 → Dec 12
   - Extension #2: `old_end_date = Dec 8`, `new_end_date = Dec 12`
4. Verify both Extension records exist with correct dates

### Test 3: Extension Rejection
1. Create booking, request extension
2. Admin rejects extension
3. Verify `end_date` remains unchanged
4. Verify `total_amount` and `balance` restored
5. Verify `extension_payment_deadline` cleared
6. Verify NO Extension record created

### Test 4: Customer Cancels Extension
1. Create booking, request extension
2. Customer cancels extension before admin reviews
3. Verify same behavior as rejection (amounts restored, deadline cleared)

### Test 5: Auto-Cancel with Pending Extension
1. Create booking with payment deadline
2. Request extension (isExtend = true)
3. Wait for original payment deadline to pass
4. Run auto-cancel
5. Verify booking is NOT cancelled (still pending admin review)

### Test 6: Auto-Cancel Extension Payment
1. Create booking, pay initial amount
2. Request and approve extension
3. Do NOT pay extension fee
4. Wait for extension_payment_deadline to pass
5. Run auto-cancel
6. Verify booking is cancelled due to unpaid extension

---

## 🚦 Decision Points for Review

Before implementing, please discuss with your groupmate:

### 1. Extension Payment Deadline Duration
**Current Proposal:**
- 12 hours if booking already ended
- 24 hours if ending within 2 days
- 48 hours if ending in 3+ days

**Question:** Are these timeframes appropriate for your business?

### 2. Auto-Cancel Behavior for Pending Extensions
**Option A (Proposed):** Do NOT cancel bookings with pending extensions (`isExtend = true`)
- **Pro:** Gives admin time to review
- **Con:** Customer could game the system by requesting extensions to delay cancellation

**Option B:** Give 24-hour grace period, then cancel if admin doesn't respond
- **Pro:** Prevents gaming the system
- **Con:** More complex logic

**Your choice:** _______________

### 3. Soft-Delete vs Hard-Delete
**Proposed:** Soft-delete (update status to 'Auto-Cancelled')
- **Pro:** Keeps historical data, audit trail
- **Con:** More records in database

**Question:** Do you want to keep cancelled booking records or delete them?

### 4. Customer Cancelling Extension
**Proposed:** Allow customers to cancel their own pending extension requests

**Question:** Should customers be able to cancel extensions, or only admin?

### 5. Extension Payment Tracking
**Option A (Proposed):** Use separate `extension_payment_deadline` field

**Option B:** Reuse `payment_deadline` field and just update it

**Your choice:** _______________

---

## 📞 Next Steps

1. **Review this document** with your groupmate
2. **Answer decision points** above
3. **Confirm or modify** the proposed logic
4. **Approve implementation plan**
5. **I will then implement** all changes based on your feedback

---

## ✅ Approval

- [ ] Reviewed and approved by: _______________
- [ ] Date: _______________
- [ ] Modifications requested: _______________
- [ ] Ready to implement: _______________

---

**Prepared by:** GitHub Copilot  
**Date:** October 20, 2025  
**Status:** 📋 Awaiting Review & Approval
