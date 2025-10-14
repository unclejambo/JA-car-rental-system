# Overdue Fee Implementation

## Summary

Implemented automatic overdue fee calculation in the Return Modal based on Philippine timezone.

## Date: October 14, 2025

---

## Features Implemented

### 1. **Overdue Days Calculation (PH Timezone)**

- When the Return Modal opens, the system automatically calculates if the booking is overdue
- Calculation formula: `Current Time (PH) - Drop-off Time`
- Uses Philippine timezone (`Asia/Manila`) for accurate calculation
- Only applies overdue fee if `overdueDays > 0`

### 2. **Overdue Fee Logic**

The overdue fee follows a tiered approach:

```javascript
if (overdueDays <= 2) {
  // For 1-2 days overdue: charge overdue_fee per day
  overdueFee = overdueDays * overdue_fee_amount;
} else {
  // For more than 2 days: charge the car's daily rent price
  overdueFee = car.rent_price;
}
```

**Example:**

- Overdue by 1 day: ₱250 (assuming overdue_fee = ₱250)
- Overdue by 2 days: ₱500 (2 × ₱250)
- Overdue by 3+ days: ₱3,000 (assuming car rent_price = ₱3,000)

### 3. **Cancel/Restore Overdue Fee**

- A "Cancel" button appears next to the overdue fee amount
- Admin can cancel the overdue fee if needed (waives the charge)
- A "Restore" button appears when fee is cancelled to restore the charge
- This provides flexibility for special cases or customer disputes

### 4. **Real-time Fee Display**

- Overdue fee is displayed in the fees breakdown sidebar
- Shows the number of overdue days: `Overdue Fee (X days overdue)`
- Updates dynamically when cancelled/restored
- Total fees automatically recalculate when overdue fee changes

---

## Files Modified

### Frontend

#### `frontend/src/ui/components/modal/ReturnModal.jsx`

**Changes:**

1. Added state variables:

   - `overdueDays` - stores calculated overdue days
   - `showOverdueFeeCancel` - tracks if overdue fee is cancelled

2. Added overdue calculation in `loadData` useEffect:

   ```javascript
   // Calculate overdue days (PH timezone)
   const phTimeZone = "Asia/Manila";
   const now = new Date().toLocaleString("en-US", { timeZone: phTimeZone });
   const currentTimePH = new Date(now);

   const dropoffTime = new Date(
     response.booking.dropoff_time || response.booking.end_date
   );

   const timeDiff = currentTimePH - dropoffTime;
   const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

   if (daysDiff > 0) {
     setOverdueDays(daysDiff);
   }
   ```

3. Updated `calculateFees` API call to include `overdueDays`:

   ```javascript
   const response = await returnAPI.calculateFees(bookingId, {
     // ... other fields
     overdueDays: showOverdueFeeCancel ? 0 : overdueDays,
   });
   ```

4. Updated `calculatedFees` state to include `overdueFee`:

   ```javascript
   const [calculatedFees, setCalculatedFees] = useState({
     gasLevelFee: 0,
     equipmentLossFee: 0,
     damageFee: 0,
     cleaningFee: 0,
     overdueFee: 0, // NEW
     total: 0,
   });
   ```

5. Enhanced fees display with Cancel/Restore button:

   ```jsx
   {
     f.showCancel && f.amount > 0 && !showOverdueFeeCancel && (
       <Button
         size="small"
         variant="text"
         color="error"
         onClick={() => setShowOverdueFeeCancel(true)}
       >
         Cancel
       </Button>
     );
   }
   ```

6. Updated `submitReturn` to include `overdueDays`:
   ```javascript
   const submitData = {
     ...formData,
     // ... other fields
     overdueDays: showOverdueFeeCancel ? 0 : overdueDays,
   };
   ```

### Backend

#### `backend/src/controllers/returnController.js`

**Function: `calculateReturnFees`**

1. Added `overdueDays` parameter extraction:

   ```javascript
   const {
     gasLevel,
     damageStatus,
     equipmentStatus,
     equip_others,
     isClean,
     hasStain,
     overdueDays, // NEW
   } = req.body;
   ```

2. Updated booking query to include car rent_price:

   ```javascript
   const booking = await prisma.booking.findUnique({
     where: { booking_id: parseInt(bookingId) },
     include: {
       releases: true,
       car: {
         select: {
           rent_price: true, // NEW
         },
       },
     },
   });
   ```

3. Added `overdueFee` to calculatedFees object:

   ```javascript
   let calculatedFees = {
     gasLevelFee: 0,
     equipmentLossFee: 0,
     damageFee: 0,
     cleaningFee: 0,
     overdueFee: 0, // NEW
     total: 0,
   };
   ```

4. Implemented overdue fee calculation logic:

   ```javascript
   // Overdue fee calculation
   if (overdueDays && overdueDays > 0) {
     const daysToCharge = Math.min(overdueDays, 2);
     const overdueBaseFee = feesObject.overdue_fee || 0;

     if (overdueDays <= 2) {
       // For 1-2 days: charge overdue_fee per day
       calculatedFees.overdueFee = daysToCharge * overdueBaseFee;
     } else {
       // For more than 2 days: charge the rent_price of the car
       calculatedFees.overdueFee = booking.car.rent_price || 0;
     }
   }
   ```

5. Updated total calculation to include overdueFee:
   ```javascript
   calculatedFees.total =
     calculatedFees.gasLevelFee +
     calculatedFees.equipmentLossFee +
     calculatedFees.damageFee +
     calculatedFees.cleaningFee +
     calculatedFees.overdueFee; // NEW
   ```

**Function: `submitReturn`**

1. Added `overdueDays` parameter extraction
2. Updated booking query to include car rent_price
3. Added same overdue fee calculation logic as in `calculateReturnFees`
4. Overdue fee is added to `calculatedFees` total before saving

---

## Database Dependencies

### Required Tables & Fields

1. **ManageFees table**

   - Must have `overdue_fee` record with an amount (e.g., ₱250)

2. **Booking table**

   - Uses `dropoff_time` or `end_date` for overdue calculation

3. **Car table**
   - Uses `rent_price` for overdue fee when > 2 days

### Sample Data

```sql
-- Ensure overdue_fee exists in ManageFees
INSERT INTO "ManageFees" (fee_type, amount)
VALUES ('overdue_fee', 250)
ON CONFLICT (fee_type) DO UPDATE SET amount = 250;
```

---

## User Experience

### Admin Workflow

1. **Open Return Modal** for a booking

   - System automatically checks if booking is overdue
   - Calculates days difference in PH timezone

2. **Review Fees**

   - If overdue, see "Overdue Fee" in breakdown
   - Shows days overdue: `(2 days overdue)`
   - Amount shown based on logic (per day or rent price)

3. **Optional: Cancel Overdue Fee**

   - Click "Cancel" button next to overdue fee
   - Fee becomes ₱0 and excluded from total
   - Can click "Restore" to add it back

4. **Complete Return**
   - Submit with or without overdue fee
   - Fee is recorded in return record and added to booking total

### Example Scenarios

**Scenario 1: On-time Return**

- Drop-off: Oct 14, 2025 10:00 AM
- Return: Oct 14, 2025 9:30 AM
- Overdue Days: 0
- Overdue Fee: ₱0

**Scenario 2: 1 Day Late**

- Drop-off: Oct 13, 2025 10:00 AM
- Return: Oct 14, 2025 3:00 PM
- Overdue Days: 2
- Overdue Fee: ₱250 × 1 = ₱250

**Scenario 3: 2 Days Late**

- Drop-off: Oct 12, 2025 10:00 AM
- Return: Oct 14, 2025 3:00 PM
- Overdue Days: 3
- Overdue Fee: ₱250 × 2 = ₱500

**Scenario 4: 3+ Days Late**

- Drop-off: Oct 10, 2025 10:00 AM
- Return: Oct 14, 2025 3:00 PM
- Overdue Days: 5
- Overdue Fee: ₱3,000 (car's rent_price)

**Scenario 5: Cancelled Overdue Fee**

- Admin clicks "Cancel" on overdue fee
- Overdue Fee: ₱0 (waived by admin)
- Can restore by clicking "Restore"

---

## Testing Checklist

- [ ] Test on-time return (no overdue fee)
- [ ] Test 1 day overdue (1 × overdue_fee)
- [ ] Test 2 days overdue (2 × overdue_fee)
- [ ] Test 3+ days overdue (should use car rent_price)
- [ ] Test cancel overdue fee functionality
- [ ] Test restore overdue fee functionality
- [ ] Verify PH timezone is used correctly
- [ ] Verify total calculation includes overdue fee
- [ ] Verify overdue fee is saved to database
- [ ] Test payment flow with overdue fees

---

## Technical Notes

### Timezone Handling

- Uses `Asia/Manila` timezone for consistency
- Converts current time to PH timezone before calculation
- Uses `Math.ceil()` to round up partial days

### Fee Priority

Maximum of 2 days at per-day rate, then switches to rent price:

- Days 1-2: Per-day overdue_fee
- Days 3+: Full car rent_price

### Cancel Feature

- Only affects frontend calculation
- Sends `overdueDays: 0` to backend when cancelled
- Does not modify database fee structure
- Can be toggled on/off during return process

---

## Future Enhancements

1. **Grace Period**: Add 1-hour grace period before overdue kicks in
2. **Notification**: Alert customer when approaching drop-off time
3. **Auto-charge**: Automatically charge overdue to customer's payment method
4. **Reporting**: Add overdue analytics to admin dashboard
5. **Configurable Logic**: Make the 2-day threshold configurable in settings

---

## Support

For issues or questions about overdue fee calculation:

1. Check ManageFees table has `overdue_fee` record
2. Verify booking has valid `dropoff_time` or `end_date`
3. Verify car has valid `rent_price`
4. Check browser console for calculation logs
5. Review backend logs for fee calculation details

---

## Changelog

**October 14, 2025**

- Initial implementation of overdue fee calculation
- Added PH timezone support
- Implemented 2-day threshold logic
- Added cancel/restore functionality
- Updated frontend and backend fee calculations
