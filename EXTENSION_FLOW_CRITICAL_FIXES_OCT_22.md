# Extension Flow - Critical Fixes (October 22, 2024)

## 🐛 PROBLEMS IDENTIFIED

### 1. Database Analysis of Booking #49
Running diagnostic query revealed multiple issues:

**Booking State:**
- `isExtend: true` (has pending extension)
- `isPay: false` (not paid)
- `booking_status: "In Progress"`
- `end_date: 2025-10-22` (original)
- `new_end_date: 2025-10-23` (requested)

**Extension Records:**
- **5 approved extensions** (IDs: 25, 24, 21, 20, 19) - all with `extension_status: "approved"`
- **2 cancelled extensions** (IDs: 23, 22)
- **3 completed extensions** with `null` status (IDs: 18, 11, 9)

### 2. Root Causes

#### Issue A: Duplicate Extension Records
**Problem:** Every time admin clicks "Approve", a NEW Extension record was created instead of updating the existing one.

**Original Code (WRONG):**
```javascript
// confirmExtensionRequest - BEFORE FIX
await prisma.extension.create({  // ❌ CREATES NEW RECORD EVERY TIME
  data: {
    booking_id: bookingId,
    old_end_date: booking.end_date,
    new_end_date: booking.new_end_date,
    approve_time: phTime,
    extension_status: "approved",
  },
});
```

**Result:** Multiple "approved" extensions accumulating in database, causing confusion in tracking.

#### Issue B: Missing Extension Record Creation
**Problem:** When customer requests extension, NO Extension record was created initially.

**Original Flow (WRONG):**
1. Customer requests → Only `Booking.isExtend=true`, NO Extension record
2. Admin approves → CREATE Extension record (first time)
3. Result: Extension record only exists after approval, not after request

**Correct Flow (FIXED):**
1. Customer requests → CREATE Extension record with `approve_time: null`, `extension_status: null`
2. Admin approves → UPDATE existing Extension record with `approve_time` and `extension_status: "approved"`

#### Issue C: Display Logic Can't Distinguish States
**Problem:** Frontend couldn't tell difference between:
- New extension request (before admin approval)
- Approved extension (after admin approval, awaiting payment)

**Why:** Both scenarios had:
- `booking_status: "In Progress"` (ongoing booking)
- `isPay: false`

**Original Logic (WRONG):**
```javascript
// If status = "In Progress" AND isPay = false → Shows "awaiting payment"
if (bookingStatus === 'in progress' && !isPaid) {
  return "💰 Extension approved - Awaiting customer payment";
}
```

**Issue:** Shows "awaiting payment" even for NEW requests that admin hasn't approved yet!

#### Issue D: No Cleanup of Old Approved Extensions
**Problem:** When customer cancels an approved extension and submits a NEW request, old approved extensions remained as "approved", causing multiple approved records.

---

## ✅ FIXES IMPLEMENTED

### Fix 1: Create Extension Record on Customer Request

**File:** `backend/src/controllers/bookingController.js`  
**Function:** `extendMyBooking`

**Added:**
```javascript
// Create Extension record when customer requests extension
await prisma.extension.create({
  data: {
    booking_id: bookingId,
    old_end_date: booking.end_date,
    new_end_date: newEndDate,
    approve_time: null, // Not yet approved
    extension_status: null, // Pending admin approval
  },
});
```

**Also added cleanup logic:**
```javascript
// Clean up any old approved but unpaid extensions before creating new request
await prisma.extension.updateMany({
  where: {
    booking_id: bookingId,
    extension_status: "approved",
  },
  data: {
    extension_status: "Cancelled by Customer",
    rejection_reason: "Customer submitted a new extension request",
  },
});
```

### Fix 2: Update (Don't Create) Extension on Admin Approval

**File:** `backend/src/controllers/bookingController.js`  
**Function:** `confirmExtensionRequest`

**BEFORE (Wrong):**
```javascript
const booking = await prisma.booking.findUnique({
  where: { booking_id: bookingId },
  include: {
    customer: { ... },
    car: { ... },
    // ❌ NO extensions included
  },
});

// ❌ CREATE new extension record
await prisma.extension.create({
  data: { ... },
});
```

**AFTER (Fixed):**
```javascript
const booking = await prisma.booking.findUnique({
  where: { booking_id: bookingId },
  include: {
    customer: { ... },
    car: { ... },
    extensions: {
      where: { approve_time: null }, // ✅ Find pending extension
      orderBy: { extension_id: "desc" },
      take: 1,
    },
  },
});

// Find the pending extension record
const pendingExtension = booking.extensions[0];
if (!pendingExtension) {
  return res.status(404).json({ error: "Pending extension record not found" });
}

// ✅ UPDATE the existing extension record (don't create a new one!)
await prisma.extension.update({
  where: { extension_id: pendingExtension.extension_id },
  data: {
    approve_time: phTime,
    extension_status: "approved",
  },
});
```

### Fix 3: Update Specific Extension on Payment Confirmation

**File:** `backend/src/controllers/bookingController.js`  
**Function:** `confirmBooking` (CASE C)

**BEFORE (Imprecise):**
```javascript
// Update extension record to mark as completed
await prisma.extension.updateMany({  // ❌ Updates ALL approved extensions
  where: {
    booking_id: bookingId,
    extension_status: "approved",
  },
  data: {
    extension_status: "completed",
  },
});
```

**AFTER (Precise):**
```javascript
// Update extension record to mark as completed (find the latest approved extension)
const approvedExtension = await prisma.extension.findFirst({
  where: {
    booking_id: bookingId,
    extension_status: "approved",
  },
  orderBy: { extension_id: "desc" }, // ✅ Get latest
});

if (approvedExtension) {
  await prisma.extension.update({  // ✅ Update specific record
    where: { extension_id: approvedExtension.extension_id },
    data: {
      extension_status: "completed",
    },
  });
}
```

### Fix 4: Include Extension Data in API Response

**File:** `backend/src/controllers/bookingController.js`  
**Function:** `getBookings`

**Added:**
```javascript
const bookings = await prisma.booking.findMany({
  where,
  skip,
  take: pageSize,
  orderBy: { [sortBy]: sortOrder },
  include: {
    customer: { ... },
    car: { ... },
    payments: { ... },
    extensions: {  // ✅ NEW: Include extension info
      orderBy: { extension_id: "desc" },
      take: 1, // Get the latest extension only
      select: {
        extension_id: true,
        extension_status: true,
        approve_time: true,
      },
    },
  },
});

// In response shaping:
const latestExtension = extensions?.[0] || null;

return {
  ...rest,
  balance: remainingBalance,
  customer_name: `...`,
  car_model: `...`,
  total_paid: totalPaid,
  remaining_balance: remainingBalance,
  latest_extension: latestExtension, // ✅ Include extension info
};
```

### Fix 5: Updated Display Logic to Use Extension Data

**File:** `frontend/src/ui/components/table/ManageBookingsTable.jsx`  
**Column:** `request_type` in EXTENSION tab

**BEFORE (Wrong):**
```javascript
const isPaid = params.row.isPay === true;
const bookingStatus = params.row.booking_status?.toLowerCase();

// ❌ Can't distinguish between new request and approved request
if (bookingStatus === 'in progress' && !isPaid) {
  return "💰 Extension approved - Awaiting customer payment";
}
```

**AFTER (Fixed):**
```javascript
const isPaid = params.row.isPay === true;
const bookingStatus = params.row.booking_status?.toLowerCase();
const latestExtension = params.row.latest_extension;  // ✅ NEW

// Check if extension has been approved by admin
const isExtensionApproved = latestExtension && 
                            (latestExtension.extension_status === 'approved' || 
                             latestExtension.approve_time !== null);

// State 1: Extension paid, awaiting admin confirmation
if (bookingStatus === 'in progress' && isPaid) {
  return "✅ Extension paid - Confirm to apply new date";
}

// State 2: Extension approved, awaiting customer payment
if (bookingStatus === 'in progress' && isExtensionApproved) {  // ✅ Now checks extension!
  return "💰 Extension approved - Awaiting customer payment";
}

// State 3: New extension request - not yet approved
return "📅 New extension request - Review & approve/reject";
```

---

## 🔄 COMPLETE FLOW (AFTER FIXES)

### Stage 1: Customer Requests Extension
**Customer Action:** Click "Extend Booking" → Submit new end date

**Backend (`extendMyBooking`):**
1. ✅ Check if extension already pending (`isExtend === true`) → Reject if true
2. ✅ Clean up old approved extensions (mark as "Cancelled by Customer")
3. ✅ Create NEW Extension record:
   - `approve_time: null`
   - `extension_status: null`
4. ✅ Update Booking:
   - `isExtend: true`
   - `new_end_date: [requested date]`
   - `total_amount: [original + extension cost]`
   - `balance: [original + extension cost]`

**Frontend Display:**
- EXTENSION tab shows: **"📅 New extension request - Review & approve/reject"**

---

### Stage 2: Admin Approves Extension
**Admin Action:** Click ✅ (green check) button on extension request

**Backend (`confirmExtensionRequest`):**
1. ✅ Find booking with `isExtend: true`
2. ✅ Find existing Extension record with `approve_time: null`
3. ✅ UPDATE Extension record:
   - `approve_time: [current timestamp]`
   - `extension_status: "approved"`
4. ✅ Keep Booking unchanged:
   - `isExtend: true` (stays true - keeps it in EXTENSION tab)
   - `isPay: false` (stays false)
   - `end_date: [original]` (don't apply new date yet)

**Frontend Display:**
- EXTENSION tab shows: **"💰 Extension approved - Awaiting customer payment"**

---

### Stage 3: Customer Pays Extension Fee
**Customer Action:** Click "Pay" button → Submit payment

**Backend (`payment confirmation`):**
1. ✅ Record payment
2. ✅ Update Booking:
   - `balance: [reduced by payment]`
   - `isPay: true` (flag for admin to confirm)

**Frontend Display:**
- EXTENSION tab shows: **"✅ Extension paid - Confirm to apply new date"**

---

### Stage 4: Admin Confirms Payment & Applies Extension
**Admin Action:** Click ✅ (green check) button to confirm payment

**Backend (`confirmBooking` CASE C):**
1. ✅ Check if `isPay: true` and `booking_status: "In Progress"`
2. ✅ Find latest approved Extension
3. ✅ Update Extension:
   - `extension_status: "completed"`
4. ✅ Update Booking:
   - `end_date: [new_end_date]` (apply extension!)
   - `dropoff_time: [calculated from new end date]`
   - `isExtend: false` (clear flag)
   - `isPay: false` (clear flag)
   - `new_end_date: null` (clear temp field)
   - `isExtended: true` (mark as extended)

**Frontend Display:**
- Booking moves to **BOOKINGS tab** (no longer extension)
- Extension is complete!

---

## 📁 FILES MODIFIED

1. **`backend/src/controllers/bookingController.js`**
   - `extendMyBooking`: Create Extension record on request, cleanup old approved extensions
   - `confirmExtensionRequest`: Update existing Extension instead of creating new
   - `confirmBooking` CASE C: Update specific Extension (not all)
   - `getBookings`: Include latest extension in API response

2. **`frontend/src/ui/components/table/ManageBookingsTable.jsx`**
   - Updated `request_type` column display logic to check `latest_extension` data

3. **`backend/check-booking.js`** (NEW - diagnostic tool)
   - Created script to query booking and extension records for debugging

---

## 🧪 TESTING CHECKLIST

### Clean Database Before Testing
```sql
-- Reset booking #49 or use a new booking
UPDATE Booking SET 
  isExtend = false,
  isPay = false,
  new_end_date = NULL,
  extension_payment_deadline = NULL
WHERE booking_id = 49;

-- Delete all extension records for booking #49
DELETE FROM Extension WHERE booking_id = 49;
```

### Test Scenario 1: New Extension Request
✅ **Expected:** Admin sees "📅 New extension request - Review & approve/reject"

1. Customer requests extension
2. Check EXTENSION tab
3. **Verify:** Shows blue message about new request

### Test Scenario 2: Admin Approval
✅ **Expected:** Message changes to "💰 Extension approved - Awaiting customer payment"

1. Admin clicks ✅ to approve
2. Check EXTENSION tab
3. **Verify:** Shows orange message about awaiting payment

### Test Scenario 3: Customer Payment
✅ **Expected:** Message changes to "✅ Extension paid - Confirm to apply new date"

1. Customer pays extension fee
2. Check EXTENSION tab
3. **Verify:** Shows green message about confirming

### Test Scenario 4: Admin Confirms Payment
✅ **Expected:** Booking moves to BOOKINGS tab, end_date updated

1. Admin clicks ✅ to confirm payment
2. **Verify in Database:**
   - `end_date` = `new_end_date` (extension applied!)
   - `isExtend` = `false`
   - `isPay` = `false`
   - `new_end_date` = `null`
   - `isExtended` = `true`
3. **Verify in Extension table:**
   - Latest extension has `extension_status: "completed"`

### Test Scenario 5: Multiple Approvals (Should NOT duplicate)
✅ **Expected:** Only ONE Extension record with `extension_status: "approved"`

1. Customer requests extension
2. Admin clicks approve TWICE (accidentally)
3. **Verify in Database:**
   - Only 1 Extension record exists
   - NO duplicate Extension records created

### Test Scenario 6: Cancel After Approval
✅ **Expected:** Customer can cancel, old approved extensions cleaned up

1. Customer requests extension → Admin approves
2. Customer cancels extension
3. Customer requests NEW extension
4. **Verify in Database:**
   - Old Extension marked as "Cancelled by Customer"
   - New Extension created with `approve_time: null`
   - Only ONE approved extension at a time

---

## 🔍 DATABASE DIAGNOSTIC COMMANDS

### Check Booking State
```bash
cd backend
node check-booking.js
```

### Manual SQL Query
```sql
-- Check booking
SELECT booking_id, booking_status, isExtend, isPay, end_date, new_end_date 
FROM Booking 
WHERE booking_id = 49;

-- Check extensions
SELECT extension_id, extension_status, approve_time, old_end_date, new_end_date
FROM Extension
WHERE booking_id = 49
ORDER BY extension_id DESC;
```

---

## 🎯 SUCCESS CRITERIA

✅ Customer request shows "New extension request" (blue)  
✅ After admin approval, shows "Extension approved - Awaiting payment" (orange)  
✅ After customer payment, shows "Extension paid - Confirm" (green)  
✅ After admin confirms, end_date is updated and booking moves to BOOKINGS tab  
✅ No duplicate Extension records created  
✅ Old approved extensions cleaned up when new request submitted  
✅ Each stage displays correct contextual message

---

## 📝 SUMMARY

**Root Issue:** Extension records were being created incorrectly:
- Not created on initial request
- Created as new records on each approval (duplicates!)
- Display logic couldn't distinguish between states

**Solution:**
- Create Extension on customer request (with null status)
- Update Extension on admin approval (don't create new)
- Include Extension data in API for frontend display logic
- Clean up old approved extensions when new request submitted

**Result:** 
- Clean 4-stage flow
- No duplicate records
- Correct contextual messages at each stage
- Proper date application after payment
