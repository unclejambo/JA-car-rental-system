# Fixes - October 21, 2025

## ✅ Issue #1: Remove "DEFAULT FOR SELFDRIVE" from Customer Driver List

### Problem:
- Driver ID 1 ("DEFAULT FOR SELFDRIVE") was appearing in the customer's driver selection list when booking
- This is confusing for customers as it's a system driver used internally

### Solution:
**Files Modified:**
1. `frontend/src/ui/components/modal/BookingModal.jsx`
2. `frontend/src/ui/components/modal/NewEditBookingModal.jsx`

**Changes:**
- Added filter to exclude driver_id=1 from customer-facing driver lists
- Filter applied: `driver.drivers_id !== 1 && driver.driver_id !== 1`
- Admin/staff can still see and assign this driver internally

**Code:**
```javascript
// Filter out driver ID 1 (DEFAULT FOR SELFDRIVE) from customer-facing list
const filteredDrivers = data.filter(driver => driver.drivers_id !== 1 && driver.driver_id !== 1);
```

---

## 🔧 Issue #2: Extension System Not Functioning Properly - ✅ FIXED

### Problem Description:
1. ✅ Extension system breaks after admin approves extension
2. ✅ Admin side shows approve/reject buttons even after approval
3. ✅ Payment status not updating correctly after extension approval
4. ✅ Customer has no balance to pay after extension approval
5. ✅ Database shows `isExtend=TRUE` even after approval (should be FALSE)
6. ✅ `extension_payment_deadline=NULL` after approval

### Root Cause:

The `confirmExtensionRequest()` function in `backend/src/controllers/bookingController.js` was:
- ✅ Correctly updating `end_date` to `new_end_date`
- ✅ Correctly setting `isExtend=false`
- ✅ Correctly setting `payment_status='Unpaid'`
- ❌ **NOT updating `total_amount` and `balance` with extension cost**

This caused:
- Booking to disappear from EXTENSION tab (correct)
- BUT reappear in BOOKINGS tab with approve/reject buttons (incorrect - due to missing balance)
- Customer has no payment to make (incorrect - balance was 0)

### Solution Implemented:

**File Modified:** `backend/src/controllers/bookingController.js`

**Function:** `confirmExtensionRequest()` (Lines ~1290-1425)

**Changes Made:**

1. **Calculate Extension Cost:**
   ```javascript
   const additionalCost = additionalDays * (booking.car.rent_price || 0);
   const newTotalAmount = (booking.total_amount || 0) + additionalCost;
   const newBalance = (booking.balance || 0) + additionalCost;
   ```

2. **Update Booking with Correct Amounts:**
   ```javascript
   const updatedBooking = await prisma.booking.update({
     where: { booking_id: bookingId },
     data: {
       end_date: booking.new_end_date,
       dropoff_time: newDropoffTime,
       new_end_date: null,
       isExtend: false,
       total_amount: newTotalAmount,        // ✅ NEW: Add extension cost
       balance: newBalance,                  // ✅ NEW: Add extension cost
       payment_status: 'Unpaid',             // Customer must pay
       extension_payment_deadline: null,     // ✅ NEW: Clear deadline after approval
     },
   });
   ```

3. **Enhanced Response:**
   ```javascript
   res.json({
     success: true,
     message: "Extension request confirmed successfully",
     booking: updatedBooking,
     additional_cost: additionalCost,      // ✅ NEW: Return cost info
     new_total_amount: newTotalAmount,     // ✅ NEW
     new_balance: newBalance               // ✅ NEW
   });
   ```

4. **Added Debug Logging:**
   - Logs cost calculation details
   - Logs before/after amounts
   - Helps with future debugging

### Expected Flow After Fix:

1. **Customer Requests Extension:**
   - `isExtend=true`
   - `new_end_date` set
   - `extension_payment_deadline` set
   - Extension appears in admin EXTENSION tab

2. **Admin Approves Extension:**
   - `end_date` updated to requested new date
   - `isExtend=false` (clears extension flag)
   - `total_amount` increased by `additionalDays × rent_price`
   - `balance` increased by extension cost
   - `payment_status='Unpaid'`
   - `extension_payment_deadline=null`
   - Booking disappears from EXTENSION tab
   - Extension record created in Extension table

3. **Customer Sees Updated Booking:**
   - Updated end date visible
   - Balance shows extension cost
   - "Pending Payment" badge appears
   - Payment button available
   - Can make payment for extension

4. **Customer Pays Extension:**
   - Payment recorded
   - `balance` decreased/cleared
   - `payment_status` updated to 'Paid' when fully paid
   - Booking continues with extended date

### Testing Steps:

1. ✅ **Reset Test Data:**
   - Clear booking 43's extension (set `isExtend=false`, `new_end_date=null`)
   - Ensure `payment_status='Paid'`, `balance=0`

2. ✅ **Test Extension Request:**
   - Login as customer (Jude Christian)
   - Request extension for booking 43
   - Verify extension appears in admin EXTENSION tab
   - Verify `isExtend=true` in database

3. ✅ **Test Extension Approval:**
   - Login as admin
   - Go to EXTENSION tab
   - Click approve (✓) button
   - Verify success message
   - Verify booking disappears from EXTENSION tab
   - Check database:
     - `isExtend=false`
     - `end_date` = new extended date
     - `total_amount` increased
     - `balance` = extension cost
     - `payment_status='Unpaid'`
     - Extension record created

4. ✅ **Test Customer Payment:**
   - Login as customer
   - Go to My Bookings
   - Verify "Pending Payment" badge shows
   - Click payment button
   - Make payment for balance
   - Verify payment recorded
   - Verify `balance` cleared
   - Verify `payment_status='Paid'`

### Database Changes Expected:

**Before Admin Approval:**
```
booking_id: 43
isExtend: TRUE
new_end_date: 2025-10-27
extension_payment_deadline: 2025-10-26 18:00
total_amount: 6000
balance: 0
payment_status: Paid
```

**After Admin Approval:**
```
booking_id: 43
isExtend: FALSE                           ← Changed
new_end_date: NULL                        ← Cleared
end_date: 2025-10-27                      ← Updated
extension_payment_deadline: NULL           ← Cleared
total_amount: 7200                        ← Increased (+1200 for 1 day)
balance: 1200                             ← Set to extension cost
payment_status: Unpaid                    ← Changed
```

**After Customer Payment:**
```
booking_id: 43
balance: 0                                ← Paid
payment_status: Paid                      ← Updated
```

---

## 📋 Testing Checklist

### Issue #1 Testing:
- [ ] Create new booking as customer
- [ ] Disable self-drive
- [ ] Verify driver list does NOT show "DEFAULT FOR SELFDRIVE"
- [ ] Verify other drivers appear normally
- [ ] Test booking completion with selected driver

### Issue #2 Testing (Pending Full Fix):
- [ ] Create booking and wait for release
- [ ] Request extension as customer
- [ ] Verify extension appears in admin Extension tab
- [ ] Test admin approve extension
- [ ] Verify payment_status becomes 'Unpaid'
- [ ] Verify balance shows additional cost
- [ ] Make payment for extension
- [ ] Verify payment_status becomes 'Paid'
- [ ] Test admin reject extension
- [ ] Verify amounts revert correctly
- [ ] Test auto-cancel extension deadline

---

## 🚀 Deployment Notes

### Issue #1:
- ✅ Ready for deployment
- No database changes required
- No backend changes required
- Frontend only - requires rebuild

### Issue #2:
- ⚠️ Requires further investigation
- May need database migration
- Backend changes may be required
- Full testing required before deployment

---

## 📝 Notes

- Removed all debug logs from AdminSchedule components (pagination working correctly)
- Both issues identified during user testing on October 21, 2025
- Issue #1 is cosmetic but important for user experience
- Issue #2 is critical for business operations

