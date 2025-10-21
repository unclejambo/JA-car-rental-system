# Extension Cancellation - Complete Guide

**Date:** October 20, 2025  
**Topic:** How extension cancellation works in different scenarios

---

## 🎯 Three Types of Extension Cancellation

### **Type 1: Customer Cancels Extension Request (Before Admin Review)**
### **Type 2: Admin Rejects Extension Request**
### **Type 3: Auto-Cancel (Payment Deadline Expired)**

---

## 📋 **TYPE 1: Customer Cancels Own Extension Request**

### **Scenario:**
Customer requested extension, but changed their mind **BEFORE** admin approved/rejected it.

### **Requirements:**
- ✅ Extension must be in `"Pending"` status
- ✅ Admin has NOT yet approved/rejected
- ✅ `approve_time = null` (not yet processed)

### **Current Implementation Status:**
❌ **NOT IMPLEMENTED** - Need to add this function

### **Proposed Implementation:**

#### **New Function: `cancelExtensionRequest()`**
```javascript
// bookingController.js

/**
 * Customer cancels their own pending extension request
 * POST /bookings/:id/cancel-extension
 */
const cancelExtensionRequest = async (req, res) => {
  try {
    const { id } = req.params; // booking_id
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Only customer can cancel their own extension
    if (userRole !== 'customer') {
      return res.status(403).json({ error: 'Only customers can cancel extension requests' });
    }

    // 1. Get booking
    const booking = await prisma.booking.findUnique({
      where: { booking_id: Number(id) },
      include: {
        customer: true,
        extensions: {
          where: { 
            approve_time: null // Only pending extensions
          },
          orderBy: { extension_id: 'desc' },
          take: 1
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify customer owns this booking
    if (booking.customer_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if there's a pending extension
    if (!booking.isExtend) {
      return res.status(400).json({ error: 'No pending extension request' });
    }

    const pendingExtension = booking.extensions[0];
    if (!pendingExtension) {
      return res.status(404).json({ error: 'Pending extension not found' });
    }

    // 2. Calculate amounts to revert
    const additionalCost = booking.total_amount - 
      (booking.total_amount - booking.balance); // Calculate from balance increase
    const restoredTotalAmount = booking.total_amount - additionalCost;
    const restoredBalance = booking.balance - additionalCost;

    // 3. Update Extension record (mark as cancelled by customer)
    await prisma.extension.update({
      where: { extension_id: pendingExtension.extension_id },
      data: {
        extension_status: 'Cancelled by Customer',
        rejection_reason: 'Customer cancelled the extension request'
      }
    });

    // 4. Revert Booking to original state
    await prisma.booking.update({
      where: { booking_id: booking.booking_id },
      data: {
        new_end_date: null,
        isExtend: false,
        total_amount: restoredTotalAmount,
        balance: restoredBalance,
        payment_status: restoredBalance > 0 ? 'Partially Paid' : 'Paid',
        extension_payment_deadline: null,
        // Keep end_date as original - no change to booking period
      }
    });

    // 5. Send notification to admin (optional)
    await sendNotification('admin', {
      type: 'EXTENSION_CANCELLED_BY_CUSTOMER',
      booking_id: booking.booking_id,
      customer_name: `${booking.customer.first_name} ${booking.customer.last_name}`,
      message: `Customer cancelled extension request for booking #${booking.booking_id}`
    });

    res.json({
      success: true,
      message: 'Extension request cancelled successfully',
      booking: {
        booking_id: booking.booking_id,
        end_date: booking.end_date, // Original end date restored
        total_amount: restoredTotalAmount,
        balance: restoredBalance
      }
    });

  } catch (error) {
    console.error('Error cancelling extension request:', error);
    res.status(500).json({ error: 'Failed to cancel extension request' });
  }
};

module.exports = {
  // ... existing exports
  cancelExtensionRequest
};
```

#### **Add Route:**
```javascript
// bookingRoutes.js
router.post('/:id/cancel-extension', customerOnly, cancelExtensionRequest);
```

#### **Frontend Implementation:**
```javascript
// CustomerBookings.jsx - Add cancel button in extension request pending state

{booking.isExtend && (
  <Alert severity="warning">
    <AlertTitle>Extension Request Pending</AlertTitle>
    Your extension request is awaiting admin approval.
    <Box mt={2}>
      <Typography variant="body2">
        New End Date: {formatDate(booking.new_end_date)}
      </Typography>
      <Typography variant="body2">
        Additional Cost: {formatCurrency(booking.balance)}
      </Typography>
      <Button 
        color="error" 
        variant="outlined"
        onClick={() => handleCancelExtension(booking.booking_id)}
        sx={{ mt: 1 }}
      >
        Cancel Extension Request
      </Button>
    </Box>
  </Alert>
)}

const handleCancelExtension = async (bookingId) => {
  if (!confirm('Are you sure you want to cancel your extension request?')) {
    return;
  }
  
  try {
    const response = await authenticatedFetch(
      `${API_BASE}/bookings/${bookingId}/cancel-extension`,
      { method: 'POST' }
    );
    
    if (response.ok) {
      toast.success('Extension request cancelled successfully');
      fetchBookings(); // Refresh bookings list
    } else {
      const error = await response.json();
      toast.error(error.error || 'Failed to cancel extension');
    }
  } catch (error) {
    console.error('Error cancelling extension:', error);
    toast.error('Failed to cancel extension request');
  }
};
```

---

## 📋 **TYPE 2: Admin Rejects Extension Request**

### **Scenario:**
Admin reviews extension request and decides to **reject** it.

### **Current Implementation Status:**
✅ **ALREADY IMPLEMENTED** - `rejectExtensionRequest()` function exists

### **How It Works:**

#### **Existing Function: `rejectExtensionRequest()`**
Location: `bookingController.js` lines ~1420-1460

```javascript
// Already implemented - just documenting behavior

const rejectExtensionRequest = async (req, res) => {
  // 1. Get booking with pending extension
  // 2. Calculate additional cost to subtract
  // 3. Update Extension record (NO approve_time set)
  // 4. Revert Booking state:
  //    - new_end_date → null
  //    - isExtend → false
  //    - total_amount → original amount
  //    - balance → original balance
  //    - Keep original end_date
  // 5. Send notification to customer
};
```

#### **What Happens:**
```javascript
// Extension Table Record:
{
  extension_id: 5,
  booking_id: 123,
  old_end_date: "2025-12-05",
  new_end_date: "2025-12-08",
  approve_time: null,  // ← Still null (never approved)
  extension_status: "Rejected", // NEW field
  rejection_reason: "Vehicle needed for another booking" // NEW field
}

// Booking Table Record (REVERTED):
{
  booking_id: 123,
  end_date: "2025-12-05",      // ← RESTORED to original
  new_end_date: null,          // ← CLEARED
  isExtend: false,             // ← RESET
  total_amount: 10000,         // ← RESTORED (was 13000)
  balance: 0,                  // ← RESTORED (was 3000)
  payment_status: "Paid",      // ← RESTORED
  extension_payment_deadline: null // ← CLEARED
}
```

#### **Customer Notification:**
```javascript
// Current notification (already implemented)
{
  type: 'EXTENSION_REJECTED',
  title: 'Extension Request Rejected',
  message: 'Your extension request for booking #123 has been rejected by admin.',
  reason: 'Vehicle needed for another booking', // If admin provided reason
  booking_id: 123
}
```

---

## 📋 **TYPE 3: Auto-Cancel (Payment Deadline Expired)**

### **Scenario:**
Customer requested extension but didn't pay the additional cost before deadline.

### **Current Implementation Status:**
❌ **NOT IMPLEMENTED** - Need to add to `autoCancel.js`

### **Proposed Implementation:**

#### **Add to `autoCancel.js`:**
```javascript
// autoCancel.js

async function autoCancelExpiredExtensions() {
  const now = new Date();
  
  console.log(`🔍 Checking for expired extension payment deadlines...`);
  
  // Find bookings with expired extension payment deadline
  const expiredExtensions = await prisma.booking.findMany({
    where: {
      isExtend: true, // Has pending extension
      extension_payment_deadline: { 
        lte: now  // Deadline has passed
      },
      booking_status: 'In Progress' // Still active booking
    },
    include: {
      customer: true,
      car: true,
      extensions: {
        where: {
          approve_time: null // Pending extension
        },
        orderBy: { extension_id: 'desc' },
        take: 1
      }
    }
  });

  console.log(`⚠️ Found ${expiredExtensions.length} extension(s) with expired payment deadline`);

  for (const booking of expiredExtensions) {
    try {
      const pendingExtension = booking.extensions[0];
      
      if (!pendingExtension) {
        console.log(`⚠️ No pending extension found for booking ${booking.booking_id}, skipping...`);
        continue;
      }

      // Calculate amounts to revert
      const additionalCost = booking.balance; // Assuming balance is the unpaid extension cost
      const restoredTotalAmount = booking.total_amount - additionalCost;
      const restoredBalance = 0; // Should be 0 if original booking was paid

      console.log(`🚫 Auto-cancelling extension for booking ${booking.booking_id}`);
      console.log(`   Original end date: ${booking.end_date}`);
      console.log(`   Requested new end date: ${booking.new_end_date}`);
      console.log(`   Additional cost: ₱${additionalCost}`);

      // 1. Update Extension record
      await prisma.extension.update({
        where: { extension_id: pendingExtension.extension_id },
        data: {
          extension_status: 'Auto-Cancelled',
          rejection_reason: `Payment deadline expired (${formatDateTime(booking.extension_payment_deadline)})`
        }
      });

      // 2. Revert Booking to original state
      await prisma.booking.update({
        where: { booking_id: booking.booking_id },
        data: {
          new_end_date: null,
          isExtend: false,
          total_amount: restoredTotalAmount,
          balance: restoredBalance,
          payment_status: restoredBalance > 0 ? 'Unpaid' : 'Paid',
          extension_payment_deadline: null,
          // Keep original end_date - booking continues until original date
        }
      });

      // 3. Send notification to customer
      await sendNotification(booking.customer_id, {
        type: 'EXTENSION_AUTO_CANCELLED',
        title: 'Extension Request Auto-Cancelled',
        message: `Your extension request for booking #${booking.booking_id} was automatically cancelled because the payment deadline (${formatDateTime(booking.extension_payment_deadline)}) expired. Your rental continues until the original end date: ${formatDate(booking.end_date)}.`,
        booking_id: booking.booking_id,
        original_end_date: booking.end_date
      });

      // 4. Send notification to admin
      await sendNotification('admin', {
        type: 'EXTENSION_AUTO_CANCELLED_ADMIN',
        title: 'Extension Auto-Cancelled (Payment Expired)',
        message: `Extension for booking #${booking.booking_id} (${booking.customer.first_name} ${booking.customer.last_name}) was auto-cancelled due to unpaid extension fee.`,
        booking_id: booking.booking_id
      });

      console.log(`✅ Extension auto-cancelled for booking ${booking.booking_id}`);
      console.log(`   Booking continues until: ${booking.end_date}`);

    } catch (error) {
      console.error(`❌ Error auto-cancelling extension for booking ${booking.booking_id}:`, error);
    }
  }

  return expiredExtensions.length;
}

// Update main function
async function autoCancelExpiredBookings() {
  try {
    console.log('🤖 Running auto-cancel job...');
    
    // 1. Check for expired EXTENSION payment deadlines
    const expiredExtensionCount = await autoCancelExpiredExtensions();
    
    // 2. Check for expired BOOKING payment deadlines (existing logic)
    const expiredBookings = await prisma.booking.findMany({
      where: {
        isExtend: false, // No pending extension
        payment_deadline: { lte: new Date() },
        payment_status: { in: ['Unpaid', 'Partially Paid'] },
        booking_status: { in: ['Pending', 'Confirmed'] }
      }
    });
    
    // ... existing auto-cancel logic for bookings ...
    
    console.log(`✅ Auto-cancel complete:`);
    console.log(`   - Extensions cancelled: ${expiredExtensionCount}`);
    console.log(`   - Bookings cancelled: ${expiredBookings.length}`);
    
  } catch (error) {
    console.error('❌ Auto-cancel job failed:', error);
  }
}
```

#### **What Happens:**
```javascript
// Extension Table Record:
{
  extension_id: 7,
  booking_id: 456,
  old_end_date: "2025-12-10",
  new_end_date: "2025-12-15",
  approve_time: null,  // ← Never approved
  extension_status: "Auto-Cancelled", // ← System cancelled
  rejection_reason: "Payment deadline expired (2025-12-09 18:00)"
}

// Booking Table Record (REVERTED):
{
  booking_id: 456,
  end_date: "2025-12-10",      // ← ORIGINAL date (unchanged)
  new_end_date: null,          // ← CLEARED
  isExtend: false,             // ← RESET
  total_amount: 10000,         // ← RESTORED
  balance: 0,                  // ← RESTORED
  payment_status: "Paid",      // ← RESTORED
  extension_payment_deadline: null, // ← CLEARED
  booking_status: "In Progress" // ← CONTINUES normally
}
```

#### **Customer Notification:**
```
📧 Subject: Extension Request Auto-Cancelled - Booking #456

Hello John,

Your extension request for booking #456 was automatically cancelled 
because the payment deadline (Dec 9, 2025 6:00 PM) expired.

Your vehicle rental continues as originally scheduled:
• Original End Date: December 10, 2025
• Please return the vehicle by this date.

If you still need to extend, please submit a new extension request 
and pay before the deadline.

Thank you,
JA Car Rental Team
```

---

## 📊 **Comparison Table: All Three Cancellation Types**

| Aspect | Customer Cancels | Admin Rejects | Auto-Cancel |
|--------|------------------|---------------|-------------|
| **Trigger** | Customer action | Admin decision | System timer |
| **Timing** | Before admin reviews | During admin review | After payment deadline |
| **Extension Status** | "Cancelled by Customer" | "Rejected" | "Auto-Cancelled" |
| **Booking Impact** | Reverted to original | Reverted to original | Reverted to original |
| **Original End Date** | Unchanged ✅ | Unchanged ✅ | Unchanged ✅ |
| **Refund Needed?** | No (never paid) | No (never paid) | No (never paid) |
| **Notification To** | Admin | Customer | Customer + Admin |
| **Can Re-request?** | Yes ✅ | Yes ✅ | Yes ✅ |
| **Implementation** | ❌ Need to add | ✅ Already exists | ❌ Need to add |

---

## 🔄 **Complete Extension Lifecycle Flow**

```
1. CUSTOMER REQUESTS EXTENSION
   ↓
   Booking: isExtend = true, new_end_date set, extension_payment_deadline set
   Extension: Created with status "Pending"
   ↓
   ┌─────────────────────────────────────────────────────┐
   │                                                     │
   │  [A] Customer Cancels    [B] Admin Rejects    [C] Auto-Cancel
   │      (Before review)         (During review)       (After deadline)
   │           ↓                       ↓                      ↓
   │      Cancel own           Admin decision          System timer
   │      request                                      expired
   │           ↓                       ↓                      ↓
   └─────────────────────────────────────────────────────┘
                           ↓
                    EXTENSION CANCELLED
                           ↓
              Extension status = "Cancelled by Customer" 
                            or "Rejected" 
                            or "Auto-Cancelled"
                           ↓
              Booking reverted to original state:
              • end_date = original (unchanged)
              • new_end_date = null
              • isExtend = false
              • total_amount = original
              • balance = original
              • extension_payment_deadline = null
                           ↓
                   Booking continues normally
                   until original end_date
                           ↓
              Customer can submit NEW extension request
              (if still within rental period)
```

---

## 💡 **Important Notes**

### **1. Original Booking Remains Active**
When extension is cancelled (any type), the **original booking is NOT affected**:
- ✅ Customer still has the vehicle
- ✅ Rental continues until original `end_date`
- ✅ No disruption to ongoing rental
- ✅ Customer must return vehicle by original date

### **2. Can Request Extension Again**
After cancellation, customer can:
- ✅ Submit a NEW extension request
- ✅ With same or different new end date
- ✅ Will get new payment deadline
- ✅ Admin reviews independently

### **3. No Financial Loss**
Since extension is cancelled BEFORE payment:
- ✅ Customer didn't pay extension fee yet
- ✅ No refund needed
- ✅ Only original booking cost applies
- ✅ Balance reverted to original amount

### **4. Extension History Preserved**
Cancelled extensions are still recorded:
- ✅ Extension table keeps the record
- ✅ Status shows why it was cancelled
- ✅ Audit trail for reporting
- ✅ Can analyze cancellation patterns

### **5. Grace Period for Auto-Cancel (Optional)**
Consider adding grace period before auto-cancel:
```javascript
// Example: 1 hour grace period after deadline
const gracePeriod = 1 * 60 * 60 * 1000; // 1 hour in ms
const deadlineWithGrace = new Date(booking.extension_payment_deadline.getTime() + gracePeriod);

if (now > deadlineWithGrace) {
  // Auto-cancel extension
}
```

---

## 📝 **Implementation Checklist**

### **To Be Implemented:**
- [ ] Add `cancelExtensionRequest()` function (Customer cancels own request)
- [ ] Add route `POST /bookings/:id/cancel-extension`
- [ ] Add `autoCancelExpiredExtensions()` in autoCancel.js
- [ ] Add `extension_status` field to Extension table
- [ ] Add `rejection_reason` field to Extension table
- [ ] Frontend: "Cancel Extension" button for customers
- [ ] Frontend: Show extension status in booking history
- [ ] Update notifications for all three cancellation types
- [ ] Add grace period logic (optional)
- [ ] Testing: All three cancellation scenarios

### **Already Implemented:**
- [x] `rejectExtensionRequest()` (Admin rejects)
- [x] Revert booking state on rejection
- [x] Extension table basic structure
- [x] Extension approval workflow

---

## 🎯 **Summary**

### **Extension Cancellation = Reverting to Original Booking**

No matter which type of cancellation occurs:

1. **Extension record** is marked with status (Cancelled/Rejected/Auto-Cancelled)
2. **Booking state** is reverted to before extension request:
   - Original `end_date` restored
   - Original `total_amount` restored
   - Original `balance` restored
   - `isExtend` flag cleared
3. **Original booking continues** normally until original end date
4. **No financial impact** since extension wasn't paid yet
5. **Customer can re-request** if they want to try again

Think of it as **"UNDO"** - the extension request is completely undone, and everything goes back to how it was before the request was made.

---

**Ready to implement the missing pieces?** Let me know! 🚀
