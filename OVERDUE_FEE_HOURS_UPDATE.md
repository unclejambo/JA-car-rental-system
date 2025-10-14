# Overdue Fee Implementation - Hours-Based Update

## Summary

Updated the overdue fee calculation to use **hours** instead of days for more granular and accurate billing.

## Date: October 14, 2025 (Updated)

---

## Key Changes

### Changed from Days to Hours

- **Before**: Calculated overdue in days (24-hour increments)
- **After**: Calculated overdue in hours (1-hour increments)
- **Reason**: More accurate and fair billing, especially for short delays

---

## Updated Fee Logic

### Overdue Fee Calculation (Hour-Based)

```javascript
if (overdueHours <= 2) {
  // For 1-2 hours overdue: charge overdue_fee per hour
  overdueFee = overdueHours * overdue_fee_per_hour;
} else {
  // For more than 2 hours: charge the car's daily rent price
  overdueFee = car.rent_price;
}
```

### Maximum Hourly Charges

- **Threshold**: 2 hours
- **After 2 hours**: Switches to car's daily rent price

---

## Pricing Examples

Assuming:

- `overdue_fee` = ₱250 per hour
- `car.rent_price` = ₱3,000 per day

### Scenario 1: 1 Hour Late

- Overdue: 1 hour
- Fee: ₱250 × 1 = **₱250**

### Scenario 2: 2 Hours Late

- Overdue: 2 hours
- Fee: ₱250 × 2 = **₱500**

### Scenario 3: 3 Hours Late (Over 2 Hours)

- Overdue: 3 hours
- Fee: **₱3,000** (car rent_price)

---

## UI Display Changes

### Before

```
Overdue Fee (2 days overdue)
```

### After

```
Overdue Fee (2 hours overdue)
```

### Display Logic

- Shows actual hours overdue
- Plural handling: "1 hour" vs "2 hours"
- More transparent for customers

---

## Technical Implementation

### Frontend Changes (`ReturnModal.jsx`)

1. **State Variable Renamed**

```javascript
// Before
const [overdueDays, setOverdueDays] = useState(0);

// After
const [overdueHours, setOverdueHours] = useState(0);
```

2. **Calculation Updated**

```javascript
// Before
const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

// After
const hoursDiff = Math.ceil(timeDiff / (1000 * 60 * 60));
```

3. **API Payload Updated**

```javascript
// Before
overdueHours: showOverdueFeeCancel ? 0 : overdueDays;

// After
overdueHours: showOverdueFeeCancel ? 0 : overdueHours;
```

4. **Display Updated**

```javascript
// Before
({f.days} day{f.days > 1 ? 's' : ''} overdue)

// After
({f.hours} hour{f.hours > 1 ? 's' : ''} overdue)
```

### Backend Changes (`returnController.js`)

1. **Parameter Renamed**

```javascript
// Before
const { overdueDays } = req.body;

// After
const { overdueHours } = req.body;
```

2. **Calculation Logic Updated**

```javascript
// Before
if (overdueDays && overdueDays > 0) {
  const daysToCharge = Math.min(overdueDays, 2);
  if (overdueDays <= 2) {
    calculatedFees.overdueFee = daysToCharge * overdueBaseFee;
  } else {
    calculatedFees.overdueFee = booking.car.rent_price || 0;
  }
}

// After
if (overdueHours && overdueHours > 0) {
  const hoursToCharge = Math.min(overdueHours, 2);
  if (overdueHours <= 2) {
    calculatedFees.overdueFee = hoursToCharge * overdueBaseFee;
  } else {
    calculatedFees.overdueFee = booking.car.rent_price || 0;
  }
}
```

---

## Database Changes

### No Database Schema Changes Required

- The `overdue_fee` in `ManageFees` table is now interpreted as **per hour** instead of per day
- Existing data remains compatible
- Only the interpretation/calculation logic changed

### Recommended Fee Adjustment

If `overdue_fee` was previously set for daily charges:

**Before (Daily)**: ₱250 per day
**After (Hourly)**: Should be adjusted to a reasonable hourly rate

**Suggested Adjustment**:

```sql
-- Example: If daily rate was ₱250, adjust to hourly
-- Option 1: Low hourly rate (₱10/hour)
UPDATE "ManageFees" SET amount = 10 WHERE fee_type = 'overdue_fee';

-- Option 2: Medium hourly rate (₱25/hour)
UPDATE "ManageFees" SET amount = 25 WHERE fee_type = 'overdue_fee';

-- Option 3: High hourly rate (₱50/hour)
UPDATE "ManageFees" SET amount = 50 WHERE fee_type = 'overdue_fee';
```

---

## Impact Analysis

### Benefits of Hourly Calculation

1. **Fairer Billing**

   - Customers only pay for actual hours overdue
   - No penalization for being a few hours late

2. **More Granular Control**

   - Admin can see exact hours overdue
   - Better tracking and reporting

3. **Increased Revenue Potential**
   - For minor delays (< 2 hours), can charge appropriately
   - For major delays (> 2 hours), still switches to daily rate

### Considerations

1. **Fee Setting**

   - Hourly rate should be set appropriately
   - Too high: Customers may prefer daily rate
   - Too low: May not cover costs

2. **Customer Communication**
   - Clearly communicate hourly billing
   - Display hours overdue prominently
   - Allow grace period if desired

---

## Testing Scenarios

### Test Case 1: On-Time Return

- Drop-off: Oct 14, 2025 10:00 AM
- Return: Oct 14, 2025 9:30 AM
- Expected: 0 hours overdue, ₱0 fee

### Test Case 2: 1 Hour Late

- Drop-off: Oct 14, 2025 10:00 AM
- Return: Oct 14, 2025 11:30 AM
- Expected: 2 hours overdue (rounded up), ₱20 fee (if ₱10/hour)

### Test Case 3: 2 Hours Late (At Threshold)

- Drop-off: Oct 14, 2025 10:00 AM
- Return: Oct 14, 2025 12:30 AM
- Expected: 3 hours overdue (rounded up), ₱20 fee (2 × ₱10/hour, max 2 hours)

### Test Case 4: 3 Hours Late (Over Threshold)

- Drop-off: Oct 14, 2025 10:00 AM
- Return: Oct 14, 2025 1:30 PM
- Expected: 4 hours overdue, switches to rent_price = ₱3,000

### Test Case 5: 24 Hours Late

- Drop-off: Oct 13, 2025 10:00 AM
- Return: Oct 14, 2025 10:30 AM
- Expected: 25 hours overdue, ₱3,000 (car rent_price)

### Test Case 6: Cancel Fee

- Any overdue scenario
- Click "Cancel" button
- Expected: Fee becomes ₱0, can be restored

---

## Updated User Workflow

### Admin Process

1. **Open Return Modal** for overdue booking

   - System calculates hours overdue in PH timezone
   - Example: "3 hours overdue"

2. **Review Fee Calculation**

   - See hourly breakdown in fees section
   - Example: "Overdue Fee (3 hours overdue): ₱3,000" (switches to rent_price after 2 hours)

3. **Optional: Waive Fee**

   - Click "Cancel" to waive overdue charge
   - Or keep as-is for full charge

4. **Complete Return**
   - Fee is recorded based on hours
   - Payment collected if applicable

---

## Migration Notes

### For Existing Deployments

1. **No Database Migration Required**

   - Calculation logic changed, not data structure

2. **Update overdue_fee Amount**

   - Review current `overdue_fee` in ManageFees
   - Adjust to appropriate hourly rate
   - Recommended: ₱10-₱50 per hour

3. **Test Thoroughly**

   - Test with various hour ranges
   - Verify 2-hour threshold works correctly
   - Check display formatting

4. **Communicate Changes**
   - Inform staff about hourly billing
   - Update customer-facing materials
   - Add to terms & conditions

---

## Configuration Recommendations

### Suggested Hourly Rates (Based on Daily Rates)

| Daily Rate | Suggested Hourly Rate | Max Cost (2hrs) |
| ---------- | --------------------- | --------------- |
| ₱500/day   | ₱100/hour             | ₱200            |
| ₱1,000/day | ₱200/hour             | ₱400            |
| ₱2,000/day | ₱500/hour             | ₱1,000          |
| ₱3,000/day | ₱750/hour             | ₱1,500          |

### Grace Period (Optional Future Enhancement)

Consider adding a grace period:

- First 1-2 hours: No charge
- After grace period: Start hourly billing

---

## Future Enhancements

1. **Fractional Hours**

   - Currently rounds up to next hour
   - Could implement 15-minute increments

2. **Progressive Rates**

   - First hour: Lower rate
   - Second hour: Higher rate
   - Over 2 hours: Daily rate

3. **Grace Period**

   - First X minutes free
   - Configurable in admin settings

4. **Notifications**
   - Alert at 1 hour overdue
   - Alert at 2 hours overdue
   - Alert when approaching drop-off time

---

## Support & Troubleshooting

### Common Issues

**Issue**: Overdue hours showing negative

- **Cause**: Clock/timezone mismatch
- **Solution**: Verify PH timezone is correct

**Issue**: Fee seems too high

- **Cause**: overdue_fee still set to daily rate
- **Solution**: Adjust overdue_fee to hourly rate

**Issue**: Not switching to rent_price after 2 hours

- **Cause**: Logic error in backend
- **Solution**: Check backend logs, verify calculation

### Debug Logs

Check browser console for:

```javascript
Overdue calculation: {
  currentTimePH: "2025-10-14T15:30:00Z",
  dropoffTime: "2025-10-14T10:00:00Z",
  timeDiff: 19800000,
  hoursDiff: 6
}
```

Check backend logs for:

```javascript
Overdue fee calculation: {
  overdueHours: 3,
  hoursToCharge: 2,
  overdueBaseFee: 500,
  carRentPrice: 3000,
  calculatedOverdueFee: 3000  // Switches to rent_price after 2 hours
}
```

---

## Changelog

**October 14, 2025 - Hours Update**

- Changed calculation from days to hours
- Updated UI to display hours instead of days
- Set threshold to 2 hours maximum before switching to rent_price
- Updated all related code and documentation
- Maintained backward compatibility

**October 14, 2025 - Initial Implementation**

- Initial implementation with daily calculation
- Added PH timezone support
- Implemented 2-day threshold logic
- Added cancel/restore functionality

---

## Summary

The overdue fee system now provides more granular and fair billing by calculating charges per hour instead of per day. This allows for:

- More accurate billing for short delays
- Better customer experience
- Flexible fee management
- Fair pricing that matches actual usage

The **2-hour threshold** ensures that extended delays (more than 2 hours) automatically switch to the car's daily rental rate, preventing excessive hourly charges while maintaining fairness for minor delays.
