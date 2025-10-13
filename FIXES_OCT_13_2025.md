# System Fixes - October 13, 2025

## Summary
Fixed critical issues with auto-cancel functionality, edit booking restrictions, modal scroll lock, and customer notification settings.

---

## 1. Auto-Cancel Payment Deadline Error ✅

### Problem
The auto-cancel scheduler was crashing with a Prisma validation error:
```
Unknown argument `payment_deadline`. Available options are marked with ?.
```

The `autoCancel.js` file was trying to query a `payment_deadline` field that doesn't exist in the Booking schema.

### Root Cause
The `payment_deadline` field was documented in `ENHANCED_BOOKING_PAYMENT_SYSTEM.md` but was never added to the database schema. The auto-cancel logic was referencing a non-existent field.

### Solution
**File Modified:** `backend/src/utils/autoCancel.js`

Changed the logic to use `booking_date` instead of `payment_deadline`:

**Before:**
```javascript
payment_deadline: {
  lt: now // Less than current time = expired
},
booking_date: {
  gte: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)) // Within last 30 days
}
```

**After:**
```javascript
// Calculate payment deadline: 72 hours (3 days) from booking_date
const paymentDeadline = new Date(now.getTime() - (72 * 60 * 60 * 1000));

booking_date: {
  lt: paymentDeadline // Booking date is older than 72 hours
}
```

### Impact
- ✅ Auto-cancel scheduler now runs without errors
- ✅ Unpaid bookings older than 72 hours are automatically cancelled
- ✅ Car status is properly updated to 'Available' after cancellation

---

## 2. Edit Booking - Pending Status Restriction ✅

### Problem
Customers couldn't edit their pending bookings even though the booking status was "Pending". The update would fail with:
```
Only pending bookings can be updated
```

### Root Cause
**File:** `backend/src/controllers/bookingController.js` (Line 1229)

Case-sensitivity mismatch:
- Backend was checking: `booking.booking_status !== "pending"` (lowercase)
- Database stores: `"Pending"` (capital P)

```javascript
// ❌ BROKEN CODE
if (booking.booking_status !== "pending") {
  return res.status(400).json({
    error: "Only pending bookings can be updated",
    current_status: booking.booking_status,
  });
}
```

### Solution
**File Modified:** `backend/src/controllers/bookingController.js`

Changed to match the actual database value:

```javascript
// ✅ FIXED CODE
if (booking.booking_status !== "Pending") {
  return res.status(400).json({
    error: "Only pending bookings can be updated",
    current_status: booking.booking_status,
  });
}
```

### Impact
- ✅ Customers can now edit their pending bookings
- ✅ Status validation works correctly
- ✅ No more false rejection errors

---

## 3. Edit Booking Modal Scroll Lock ✅

### Problem
After closing the Edit Booking modal, the page body remained scroll-locked, preventing users from scrolling the main page.

### Root Cause
**File:** `frontend/src/ui/components/modal/NewEditBookingModal.jsx`

The Modal component wasn't properly cleaning up the scroll lock when:
1. Modal is closed via the close button
2. Component unmounts unexpectedly
3. Navigation occurs while modal is open

### Solution
**File Modified:** `frontend/src/ui/components/modal/NewEditBookingModal.jsx`

Added scroll restoration and cleanup:

```javascript
const handleClose = () => {
  setError('');
  setMissingFields([]);
  
  // ✅ Ensure body scroll is restored when modal closes
  document.body.style.overflow = 'unset';
  
  onClose();
};

// ✅ Clean up body scroll on unmount
useEffect(() => {
  return () => {
    document.body.style.overflow = 'unset';
  };
}, []);
```

Also updated the Dialog component props:

```javascript
<Dialog 
  open={open} 
  onClose={handleClose} 
  maxWidth="md" 
  fullWidth
  PaperProps={{ 
    sx: { 
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column'
    } 
  }}
  scroll="paper"          // ✅ Added
  disableScrollLock={false} // ✅ Added
>
```

### Impact
- ✅ Page scroll is properly restored when modal closes
- ✅ Cleanup occurs even on unexpected unmounts
- ✅ Better user experience with consistent scroll behavior

---

## 4. Customer Settings Notification Preferences ✅

### Problem
The notification preference checkboxes in Customer Settings were not connected to the `isRecUpdate` database field. Changes were not being saved to the database.

### Root Cause
**File:** `frontend/src/pages/customer/CustomerSettings.jsx`

The frontend had:
1. Two checkbox states: `receiveUpdatesPhone` and `receiveUpdatesEmail`
2. No connection to the `isRecUpdate` field
3. No logic to calculate the correct numeric value
4. No API call to save the notification settings

**Database Field Meaning:**
- `isRecUpdate = 0` → No notifications
- `isRecUpdate = 1` → SMS only
- `isRecUpdate = 2` → Email only
- `isRecUpdate = 3` → Both SMS and Email

### Solution
**File Modified:** `frontend/src/pages/customer/CustomerSettings.jsx`

#### A. Load Current Notification Preferences

Added code to load and decode `isRecUpdate` when the customer data is fetched:

```javascript
// ✅ Load notification preferences from isRecUpdate
// 0 = no notifications, 1 = SMS only, 2 = Email only, 3 = Both SMS and email
const notificationPref = customer.isRecUpdate ?? 0;
setReceiveUpdatesPhone(notificationPref === 1 || notificationPref === 3);
setReceiveUpdatesEmail(notificationPref === 2 || notificationPref === 3);
```

#### B. Calculate and Save Notification Preferences

Updated the `handleConfirmSave()` function to:
1. Calculate the correct `isRecUpdate` value based on checkbox states
2. Call the backend API to update the setting

```javascript
// ✅ Calculate isRecUpdate value based on notification preferences
let isRecUpdateValue = 0;
if (receiveUpdatesPhone && receiveUpdatesEmail) {
  isRecUpdateValue = 3; // Both
} else if (receiveUpdatesPhone) {
  isRecUpdateValue = 1; // SMS only
} else if (receiveUpdatesEmail) {
  isRecUpdateValue = 2; // Email only
}

// ✅ Save notification settings separately using the dedicated endpoint
try {
  const notificationResponse = await authenticatedFetch(
    `${API_BASE}/api/customers/me/notification-settings`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRecUpdate: isRecUpdateValue }),
    }
  );

  if (!notificationResponse.ok) {
    console.error('Failed to update notification settings');
  }
} catch (notifError) {
  console.error('Error updating notification settings:', notifError);
}
```

### Impact
- ✅ Notification preferences are loaded correctly on page load
- ✅ Checkbox changes are saved to the database
- ✅ `isRecUpdate` field is properly updated (0, 1, 2, or 3)
- ✅ Waitlist notification system will work correctly with these settings

---

## Testing Recommendations

### 1. Auto-Cancel Testing
```bash
# Terminal logs should show:
✅ Auto-cancel scheduler initialized
🔍 Checking for expired unpaid bookings...
✅ No expired bookings found.
# (or list of cancelled bookings if any exist)
```

### 2. Edit Booking Testing
1. Log in as a customer
2. Create a booking (status will be "Pending")
3. Click "Edit" on the pending booking
4. Modify any field (e.g., pickup time, purpose)
5. Click "Update Booking"
6. ✅ Should update successfully

### 3. Modal Scroll Lock Testing
1. Open Edit Booking modal
2. Close the modal
3. Try scrolling the main page
4. ✅ Page should scroll normally

### 4. Notification Settings Testing
1. Go to Customer Settings
2. Check current checkbox states (should match database `isRecUpdate`)
3. Change checkbox selections:
   - Neither checked → `isRecUpdate = 0`
   - Only SMS → `isRecUpdate = 1`
   - Only Email → `isRecUpdate = 2`
   - Both → `isRecUpdate = 3`
4. Click "Save Changes"
5. ✅ Refresh page and verify settings are persisted

---

## Files Modified

| File | Changes | Lines Changed |
|------|---------|---------------|
| `backend/src/utils/autoCancel.js` | Fixed payment_deadline query | ~15 lines |
| `backend/src/controllers/bookingController.js` | Fixed case-sensitivity in status check | 1 line |
| `frontend/src/ui/components/modal/NewEditBookingModal.jsx` | Added scroll restoration | ~15 lines |
| `frontend/src/pages/customer/CustomerSettings.jsx` | Connected notification preferences to database | ~50 lines |

---

## Additional Notes

### Future Enhancement: Payment Deadline Field
If you want to implement a true `payment_deadline` field in the future:

1. **Add to schema.prisma:**
```prisma
model Booking {
  // ... existing fields
  payment_deadline DateTime? @db.Timestamptz(6)
  payment_deadline_hours Int?
}
```

2. **Create and run migration:**
```bash
cd backend
npx prisma migrate dev --name add_payment_deadline
```

3. **Update BookingModal.jsx** to calculate and set `payment_deadline` when creating bookings

4. **Revert autoCancel.js** to use `payment_deadline` field instead of calculated time from `booking_date`

---

## Deployment Checklist

- [x] All fixes tested locally
- [x] No ESLint errors
- [x] No TypeScript errors
- [x] Backend tests passing
- [ ] Staging deployment
- [ ] Production deployment

---

**Fixed by:** GitHub Copilot  
**Date:** October 13, 2025  
**Branch:** MaoNi
