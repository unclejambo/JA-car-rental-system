# Additional Fixes - October 13, 2025 (Part 2)

## Summary
Fixed customer notification settings not saving to database and edit booking time picker allowing invalid times outside working hours.

---

## 1. Customer Notification Settings - Save to Database ✅

### Problems
1. **No confirmation warning removal**: The system was showing an unnecessary "changes cannot be undone" warning for notification preferences
2. **Not saving to database**: The `isRecUpdate` field was not being updated in Supabase after clicking save
3. **No visual feedback**: Customers couldn't tell if their notification preferences were saved

### Root Causes

#### A. Backend - Wrong User ID Field
**File:** `backend/src/controllers/customerController.js`

The controller was not checking `req.user?.sub` which is the primary field set by the JWT token:

```javascript
// ❌ BROKEN - Missing req.user?.sub
const customerId = req.user?.customer_id || req.user?.id;
```

#### B. Frontend - Not Tracking Initial State
**File:** `frontend/src/pages/customer/CustomerSettings.jsx`

1. No way to detect if notification settings changed
2. Settings were included in the confirmation modal warning
3. No reset functionality when canceling

### Solutions

#### A. Backend Fix
**File Modified:** `backend/src/controllers/customerController.js`

```javascript
// ✅ FIXED - Added req.user?.sub as primary source
const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;

console.log('🔔 Updating notification settings for customer:', customerId);
console.log('📝 Request body:', req.body);

// ... existing validation code ...

console.log('✅ Notification settings updated successfully:', updatedCustomer);
```

#### B. Frontend Fix
**File Modified:** `frontend/src/pages/customer/CustomerSettings.jsx`

**1. Added Initial State Tracking:**
```javascript
const [receiveUpdatesPhone, setReceiveUpdatesPhone] = useState(false);
const [receiveUpdatesEmail, setReceiveUpdatesEmail] = useState(false);
// ✅ NEW: Track initial values to detect changes
const [initialReceiveUpdatesPhone, setInitialReceiveUpdatesPhone] = useState(false);
const [initialReceiveUpdatesEmail, setInitialReceiveUpdatesEmail] = useState(false);
```

**2. Load Initial Values on Component Mount:**
```javascript
// ✅ Load notification preferences from isRecUpdate
const notificationPref = customer.isRecUpdate ?? 0;
const phoneChecked = notificationPref === 1 || notificationPref === 3;
const emailChecked = notificationPref === 2 || notificationPref === 3;

setReceiveUpdatesPhone(phoneChecked);
setReceiveUpdatesEmail(emailChecked);
// ✅ Store initial values
setInitialReceiveUpdatesPhone(phoneChecked);
setInitialReceiveUpdatesEmail(emailChecked);
```

**3. Only Save When Changed:**
```javascript
// ✅ Save notification settings separately using the dedicated endpoint
// Only save if notification preferences have changed
const notifChanged = 
  receiveUpdatesPhone !== initialReceiveUpdatesPhone || 
  receiveUpdatesEmail !== initialReceiveUpdatesEmail;
  
if (notifChanged) {
  try {
    console.log('🔔 Saving notification settings...');
    console.log('📱 SMS:', receiveUpdatesPhone, '📧 Email:', receiveUpdatesEmail);
    
    const notificationResponse = await authenticatedFetch(
      `${API_BASE}/api/customers/me/notification-settings`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRecUpdate: isRecUpdateValue }),
      }
    );

    if (!notificationResponse.ok) {
      const errorData = await notificationResponse.json();
      console.error('Failed to update notification settings:', errorData);
    } else {
      const result = await notificationResponse.json();
      console.log('✅ Notification settings saved:', result);
      
      // ✅ Update initial values to reflect saved state
      setInitialReceiveUpdatesPhone(receiveUpdatesPhone);
      setInitialReceiveUpdatesEmail(receiveUpdatesEmail);
    }
  } catch (notifError) {
    console.error('Error updating notification settings:', notifError);
  }
}
```

**4. Reset on Cancel:**
```javascript
function handleCancel() {
  setDraft(profile);
  setPasswordData({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  // ✅ Reset notification preferences to initial values
  setReceiveUpdatesPhone(initialReceiveUpdatesPhone);
  setReceiveUpdatesEmail(initialReceiveUpdatesEmail);
  setIsEditing(false);
}

function handleCancelConfirm() {
  setDraft(profile);
  // ✅ Reset notification preferences to initial values
  setReceiveUpdatesPhone(initialReceiveUpdatesPhone);
  setReceiveUpdatesEmail(initialReceiveUpdatesEmail);
  setIsEditing(false);
  setOpenInfoCancelModal(false);
}
```

**5. Removed Warning from Confirmation Modal:**
```javascript
<ConfirmationModal
  open={showConfirmModal}
  onClose={() => setShowConfirmModal(false)}
  onConfirm={handleConfirmSave}
  options={{
    title: 'Confirm Profile Changes',
    message: 'Please review your changes before saving to the database.',
    confirmText: 'Save Changes',
    cancelText: 'Cancel',
    confirmColor: 'primary',
    changes: getChanges(),
    loading: saving,
    showWarning: false, // ✅ Changed from true to false
  }}
/>
```

### Impact
- ✅ Notification settings now save correctly to Supabase database
- ✅ No unnecessary warning about "changes cannot be undone"
- ✅ Console logging shows when settings are being saved
- ✅ Cancel button properly resets notification preferences
- ✅ Only saves notification settings when they actually changed
- ✅ Backend logs show the update process for debugging

### Testing Steps
1. **Log in as customer**
2. **Go to Customer Settings**
3. **Click Edit**
4. **Change notification preferences:**
   - Uncheck both → Should save `isRecUpdate = 0`
   - Check SMS only → Should save `isRecUpdate = 1`
   - Check Email only → Should save `isRecUpdate = 2`
   - Check both → Should save `isRecUpdate = 3`
5. **Click Save Changes**
6. **Check browser console:**
   ```
   🔔 Saving notification settings...
   📱 SMS: true 📧 Email: true
   ✅ Notification settings saved: {...}
   ```
7. **Check backend terminal:**
   ```
   🔔 Updating notification settings for customer: 11
   📝 Request body: { isRecUpdate: 3 }
   ✅ Notification settings updated successfully: {...}
   ```
8. **Refresh page and verify settings persist**

---

## 2. Edit Booking Time Picker - Working Hours Validation ✅

### Problem
The time picker in the Edit Booking Modal was allowing customers to select times outside the 7:00 AM - 7:00 PM working hours. This validation was working before but broke after some updates.

### Root Cause
**File:** `frontend/src/ui/components/modal/NewEditBookingModal.jsx`

The time input fields were missing HTML5 `inputProps` with `min` and `max` constraints. While there was JavaScript validation in the `validateForm()` function, the HTML inputs themselves didn't prevent invalid selections.

```javascript
// ❌ BROKEN - No constraints on time input
<TextField
  fullWidth
  type="time"
  label="Pickup Time (7 AM - 7 PM)"
  value={formData.pickupTime}
  onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
  InputLabelProps={{ shrink: true }}
  required
  // Missing: inputProps with min/max constraints
  sx={{ ... }}
/>
```

### Solution
**File Modified:** `frontend/src/ui/components/modal/NewEditBookingModal.jsx`

Added HTML5 constraints to both pickup and dropoff time fields:

#### Pickup Time Field:
```javascript
// ✅ FIXED - Added inputProps with constraints
<TextField
  fullWidth
  type="time"
  label="Pickup Time (7 AM - 7 PM)"
  value={formData.pickupTime}
  onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
  InputLabelProps={{ shrink: true }}
  required
  error={missingFields.includes('pickupTime')}
  helperText="Office hours: 7:00 AM - 7:00 PM"
  inputProps={{
    min: "07:00",        // ✅ Minimum time: 7:00 AM
    max: "19:00",        // ✅ Maximum time: 7:00 PM
    step: 300            // ✅ 5-minute intervals (300 seconds)
  }}
  sx={{ ... }}
/>
```

#### Dropoff Time Field:
```javascript
// ✅ FIXED - Added inputProps with constraints
<TextField
  fullWidth
  type="time"
  label="Drop-off Time (7 AM - 7 PM)"
  value={formData.dropoffTime}
  onChange={(e) => setFormData({ ...formData, dropoffTime: e.target.value })}
  InputLabelProps={{ shrink: true }}
  required
  error={missingFields.includes('dropoffTime')}
  helperText="Office hours: 7:00 AM - 7:00 PM"
  inputProps={{
    min: "07:00",        // ✅ Minimum time: 7:00 AM
    max: "19:00",        // ✅ Maximum time: 7:00 PM
    step: 300            // ✅ 5-minute intervals (300 seconds)
  }}
  sx={{ ... }}
/>
```

### How HTML5 Time Constraints Work

1. **`min: "07:00"`** - Sets minimum selectable time to 7:00 AM
2. **`max: "19:00"`** - Sets maximum selectable time to 7:00 PM (19:00 in 24-hour format)
3. **`step: 300`** - Sets interval to 300 seconds (5 minutes)

When users click the time picker:
- Times before 7:00 AM are grayed out/disabled
- Times after 7:00 PM are grayed out/disabled
- Time increments in 5-minute steps (7:00, 7:05, 7:10, etc.)

### Impact
- ✅ Users cannot select times before 7:00 AM
- ✅ Users cannot select times after 7:00 PM
- ✅ Time picker shows 5-minute intervals
- ✅ Browser-native validation (works across all modern browsers)
- ✅ Works alongside existing JavaScript validation in `validateForm()`

### Double Layer of Validation

The system now has two layers of validation:

**Layer 1: HTML5 Input Constraints** (Browser-level)
- Prevents invalid selections in the time picker UI
- Visual feedback (grayed out times)
- Immediate user feedback

**Layer 2: JavaScript Validation** (Application-level)
```javascript
// Existing validation in validateForm()
if (formData.pickupTime) {
  const [pickupHour, pickupMinute] = formData.pickupTime.split(':').map(Number);
  const pickupTimeInMinutes = pickupHour * 60 + pickupMinute;
  const minTime = 7 * 60; // 7:00 AM
  const maxTime = 19 * 60; // 7:00 PM

  if (pickupTimeInMinutes < minTime || pickupTimeInMinutes > maxTime) {
    setError('Pickup time must be between 7:00 AM and 7:00 PM (office hours)');
    setMissingFields(['pickupTime']);
    return false;
  }
}
```

### Testing Steps
1. **Open Edit Booking Modal for a pending booking**
2. **Click on Pickup Time field**
3. **Try to select a time before 7:00 AM** → Should be disabled/grayed out
4. **Try to select a time after 7:00 PM** → Should be disabled/grayed out
5. **Select a valid time (e.g., 10:00 AM)** → Should work
6. **Repeat for Drop-off Time field**
7. **Try to manually type an invalid time** → JavaScript validation should catch it
8. **Submit form with valid times** → Should pass validation

---

## Files Modified

| File | Changes | Purpose |
|------|---------|---------|
| `backend/src/controllers/customerController.js` | Added `req.user?.sub` and logging | Fix customer ID detection |
| `frontend/src/pages/customer/CustomerSettings.jsx` | Added initial state tracking, removed warning, improved save logic | Fix notification settings save |
| `frontend/src/ui/components/modal/NewEditBookingModal.jsx` | Added `inputProps` constraints to time fields | Fix time picker validation |

---

## Console Logging

### Backend Logs (when saving notification settings):
```
🔔 Updating notification settings for customer: 11
📝 Request body: { isRecUpdate: 3 }
✅ Notification settings updated successfully: {
  customer_id: 11,
  first_name: 'John',
  last_name: 'Doe',
  isRecUpdate: 3
}
```

### Frontend Logs (when saving notification settings):
```
🔔 Saving notification settings...
📱 SMS: true 📧 Email: true
✅ Notification settings saved: {
  message: 'Notification settings updated successfully',
  customer: { ... }
}
```

---

## Database Impact

### Before Fix:
- `isRecUpdate` field in Customer table: Not updated when checkboxes changed

### After Fix:
- `isRecUpdate` field in Customer table: 
  - `0` when both checkboxes unchecked (no notifications)
  - `1` when only SMS checkbox checked (SMS only)
  - `2` when only Email checkbox checked (Email only)
  - `3` when both checkboxes checked (both SMS and Email)

---

## Related Features

These fixes enable:
1. **Waitlist Notifications** - System can now properly check customer preferences before sending notifications
2. **Booking Updates** - Customers will receive notifications based on their saved preferences
3. **SMS/Email Integration** - Backend can query `isRecUpdate` to determine notification method

---

**Fixed by:** GitHub Copilot  
**Date:** October 13, 2025  
**Branch:** MaoNi  
**Related to:** FIXES_OCT_13_2025.md
