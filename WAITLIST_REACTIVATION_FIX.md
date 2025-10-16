# Waitlist Reactivation Fix

## Date: October 16, 2025

## Issue
When a customer was notified about a car becoming available (status changed from `'waiting'` to `'notified'`), they couldn't join the waitlist again for the same car if it became rented again. The system showed: "You are already on the waitlist for this car"

## Root Cause
The `joinWaitlist` function was checking for existing entries with status `'waiting'` OR `'notified'`, and blocking all of them. This prevented customers from re-subscribing after being notified.

## Solution
Updated the logic to **reactivate** old notified entries instead of creating duplicates:

### Before:
```javascript
// Blocked if ANY entry exists (waiting or notified)
const existingEntry = await prisma.waitlist.findFirst({
  where: {
    customer_id: customerId,
    car_id: carId,
    status: { in: ['waiting', 'notified'] }
  }
});

if (existingEntry) {
  return res.status(400).json({ error: 'You are already on the waitlist for this car' });
}

// Always created new entry
const waitlistEntry = await prisma.waitlist.create({...});
```

### After:
```javascript
// Check for ANY entry (not just waiting)
const existingEntry = await prisma.waitlist.findFirst({
  where: {
    customer_id: customerId,
    car_id: carId
  }
});

if (existingEntry) {
  // Block if already waiting
  if (existingEntry.status === 'waiting') {
    return res.status(400).json({ error: 'You are already on the waitlist for this car' });
  }
  
  // Reactivate if previously notified
  if (existingEntry.status === 'notified') {
    waitlistEntry = await prisma.waitlist.update({
      where: { waitlist_id: existingEntry.waitlist_id },
      data: {
        status: 'waiting',
        notified_date: null,
        notification_method: null,
        notification_success: null
      },
      include: { Customer: {...}, Car: {...} }
    });
  }
} else {
  // Create new entry if none exists
  waitlistEntry = await prisma.waitlist.create({...});
}
```

## Benefits

1. ✅ **No Duplicate Entries**: Respects unique constraint `[customer_id, car_id]`
2. ✅ **Preserves History**: Old notification data remains in database until reactivated
3. ✅ **Better UX**: Customers can re-subscribe after being notified
4. ✅ **Clean Data**: Reuses same entry instead of creating multiple entries per customer/car

## Flow Examples

### Scenario 1: First Time Joining
```
Customer clicks "Notify me" → No existing entry → Create new entry
Status: 'waiting'
```

### Scenario 2: Already Waiting
```
Customer clicks "Notify me" → Entry exists with status='waiting' → Block
Error: "You are already on the waitlist for this car"
```

### Scenario 3: Previously Notified (THE FIX)
```
Customer clicks "Notify me" → Entry exists with status='notified' → Reactivate
Action: Update entry to status='waiting', clear notification fields
Result: Customer will be notified again when car becomes available
```

## Response Format

```json
{
  "success": true,
  "message": "You will be notified when the Ford Granger becomes available.",
  "waitlist_entry": { ... },
  "reactivated": false  // or true if entry was reactivated
}
```

## Testing

1. **Join waitlist** for a car (status = 'waiting')
2. **Admin changes car** to "Available" (customer notified, status = 'notified')
3. **Admin changes car** back to "Rented"
4. **Join waitlist again** → Should reactivate entry (status back to 'waiting')
5. **Admin changes car** to "Available" again
6. **Customer receives notification** again ✅

## Files Modified

- `backend/src/controllers/waitlistController.js`
  - Updated `joinWaitlist()` function
  - Added reactivation logic for notified entries
  - Added `reactivated` flag in response

## Status: ✅ FIXED
