# Group Booking Payment Feature Implementation

## Overview
Implemented comprehensive group booking payment functionality that allows multiple cars booked together to be displayed as a single group and paid collectively with payment distribution across all vehicles.

## Implementation Date
December 21, 2025

## Features Implemented

### 1. Database Schema Updates
**File: `backend/prisma/schema.prisma`**

Added `booking_group_id` field to both `Booking` and `Payment` models:

```prisma
model Booking {
  // ... existing fields
  booking_group_id String?
  // ... existing relations
}

model Payment {
  // ... existing fields
  booking_group_id String?
  // ... existing relations
}
```

**Migration Required:** Run `npx prisma migrate dev` to update database

### 2. Frontend - Customer Bookings Display

**File: `frontend/src/pages/customer/CustomerBookings.jsx`**

#### Grouping Logic
- Added `groupBookings()` helper function that:
  - Identifies bookings with the same `booking_group_id`
  - Aggregates total amounts, balances, and payment status
  - Creates a single "group" entry for display
  - Preserves individual booking details within the group

#### My Bookings Tab
- **Grouped Bookings Display:**
  - Green-bordered card with "Group Booking (X Cars)" badge
  - Shows all vehicle names in the group
  - Displays aggregated total amount
  - Lists individual cars with their details in a grid

- **Single Bookings Display:**
  - Standard red-bordered cards (unchanged)
  - Original functionality preserved

#### Settlement Tab
- **Grouped Payments:**
  - Green-themed cards for group payments
  - Shows total outstanding balance for the group
  - Displays minimum payment requirement: `car_count × ₱1,000`
  - Lists all vehicles in the group with individual balances
  - "Pay Group Now" button (green)

- **Single Payments:**
  - Standard payment cards (unchanged)
  - "Pay Now" button (red)

### 3. Payment Modal Updates

**File: `frontend/src/ui/components/modal/PaymentModal.jsx`**

#### Enhanced Validation
- Detects grouped vs single bookings via `booking.isGroup` flag
- **Minimum Payment Rules:**
  - Single booking: ₱1,000
  - Group booking: `car_count × ₱1,000`
  - Example: 3 cars = ₱3,000 minimum

#### Payment Details Display
- Shows group booking IDs (comma-separated)
- Lists all vehicles in the group
- Displays total outstanding balance
- Shows minimum payment requirement with explanation

#### Payment Amount Calculation
```javascript
const minimumPayment = booking.isGroup ? (booking.car_count * 1000) : 1000;
```

### 4. Backend - Group Payment Processing

**File: `backend/src/controllers/paymentController.js`**

#### New Endpoint: `processGroupPayment()`
**Route:** `POST /payments/process-group-payment`

**Features:**
1. **Validation:**
   - Verifies all bookings belong to the customer
   - Confirms all bookings share the same `booking_group_id`
   - Validates minimum payment: `car_count × 1000`

2. **Payment Distribution:**
   ```javascript
   const paymentPerCar = totalPayment / car_count;
   ```
   - Divides payment equally among all vehicles
   - Rounds to avoid decimal issues

3. **Database Updates:**
   - Creates individual payment records for each booking
   - Updates each booking's balance proportionally
   - Sets `isPay = true` for admin verification
   - Links all payments via `booking_group_id`

4. **Notifications:**
   - Sends admin payment request notification for GCash payments
   - Includes group details and all vehicle information

**Sample Response:**
```json
{
  "success": true,
  "message": "Group payment of ₱3,000 processed successfully for 3 vehicles! Payment distributed as ₱1,000 per vehicle.",
  "group_payment": {
    "booking_group_id": "GRP123456",
    "total_amount": 3000,
    "payment_per_car": 1000,
    "car_count": 3,
    "bookings_updated": [101, 102, 103],
    "remaining_group_balance": 12000
  },
  "payments": [
    { "payment_id": 201, "booking_id": 101, "amount": 1000, "balance": 4000 },
    { "payment_id": 202, "booking_id": 102, "amount": 1000, "balance": 4000 },
    { "payment_id": 203, "booking_id": 103, "amount": 1000, "balance": 4000 }
  ]
}
```

### 5. Routes Update

**File: `backend/src/routes/paymentRoutes.js`**

Added new route:
```javascript
router.post(
  "/process-group-payment",
  verifyToken,
  requireCustomer,
  processGroupPayment
);
```

## Payment Flow

### For Grouped Bookings

1. **Customer View (My Bookings):**
   - Sees single card representing 3 booked cars
   - Total amount: ₱15,000 (sum of all cars)

2. **Customer View (Settlement Tab):**
   - Single payment card for the group
   - Outstanding balance: ₱15,000
   - Minimum payment: ₱3,000 (3 cars × ₱1,000)

3. **Payment Process:**
   - Customer clicks "Pay Group Now"
   - Enters ₱3,000 payment
   - System validates: ₱3,000 ≥ ₱3,000 (minimum) ✓
   - Payment distributed: ₱1,000 per car

4. **Result:**
   - 3 payment records created (one per booking)
   - Each booking's balance reduced by ₱1,000
   - New group balance: ₱12,000
   - New minimum payment: ₱3,000 (still 3 cars)

### Example Scenario

**Initial State:**
- Booking #101: Honda Civic - ₱5,000 (Balance: ₱5,000)
- Booking #102: Toyota Vios - ₱5,000 (Balance: ₱5,000)
- Booking #103: Nissan Sentra - ₱5,000 (Balance: ₱5,000)
- **Group Total:** ₱15,000

**Customer Pays ₱4,500:**
- ₱4,500 ÷ 3 = ₱1,500 per car
- Booking #101: Balance ₱3,500
- Booking #102: Balance ₱3,500
- Booking #103: Balance ₱3,500
- **New Group Total:** ₱10,500

**Customer Pays ₱9,000:**
- ₱9,000 ÷ 3 = ₱3,000 per car
- Booking #101: Balance ₱500
- Booking #102: Balance ₱500
- Booking #103: Balance ₱500
- **New Group Total:** ₱1,500

**Customer Pays ₱1,500:**
- ₱1,500 ÷ 3 = ₱500 per car
- All bookings: Balance ₱0
- **Status:** PAID ✓

## Visual Design

### Group Booking Cards
- **Border:** 2px solid #4CAF50 (green)
- **Background:** #f1f8f4 (light green tint)
- **Badge:** Green "Group Booking (X Cars)"
- **Button:** Green "Pay Group Now"

### Single Booking Cards
- **Border:** 1px solid #e0e0e0 (gray)
- **Background:** White
- **Badge:** Status-dependent colors
- **Button:** Red "Pay Now"

## Key Business Rules

1. **Minimum Payment:**
   - Single: ₱1,000
   - Group: Number of cars × ₱1,000

2. **Payment Distribution:**
   - Always equal across all cars in group
   - Example: ₱5,000 for 4 cars = ₱1,250 per car

3. **Group Identification:**
   - All bookings with same `booking_group_id` treated as one unit
   - Displayed once in customer views
   - Payments distributed to all

4. **Balance Calculation:**
   - Individual booking balances maintained
   - Group balance = sum of all individual balances
   - Payment reduces all proportionally

## Testing Checklist

### Database
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Verify `booking_group_id` column exists in `Booking` table
- [ ] Verify `booking_group_id` column exists in `Payment` table

### Creating Group Bookings
- [ ] Book multiple cars with same `booking_group_id`
- [ ] Verify group appears as single entry in "My Bookings"
- [ ] Verify group appears as single entry in "Settlement" tab

### Group Payments
- [ ] Verify minimum payment validation (car_count × 1000)
- [ ] Test payment distribution (equal per car)
- [ ] Verify individual booking balances updated
- [ ] Verify group balance calculation

### Edge Cases
- [ ] Test partial payment (less than total)
- [ ] Test exact balance payment
- [ ] Test with 2, 3, 4+ cars in group
- [ ] Verify single bookings still work normally

## Files Modified

1. `backend/prisma/schema.prisma`
2. `backend/src/controllers/paymentController.js`
3. `backend/src/routes/paymentRoutes.js`
4. `frontend/src/pages/customer/CustomerBookings.jsx`
5. `frontend/src/ui/components/modal/PaymentModal.jsx`

## API Endpoints

### New Endpoint
- **POST** `/api/payments/process-group-payment`
  - Body: `{ booking_group_id, booking_ids[], payment_method, amount, gcash_no?, reference_no? }`
  - Returns: Payment details and distribution

### Existing Endpoints (Unchanged)
- **POST** `/api/payments/process-booking-payment` (single bookings)
- **GET** `/api/payments/my-payments`

## Migration Steps

1. **Database:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_booking_group_id
   ```

2. **Backend:**
   - Restart backend server
   - New endpoint automatically available

3. **Frontend:**
   - No build required (React hot reload)
   - Refresh browser to see changes

## Future Enhancements

1. **Admin Panel:**
   - View grouped bookings in admin interface
   - Approve/reject group payments
   - Generate group invoices

2. **Reporting:**
   - Group booking analytics
   - Revenue breakdown by group vs single
   - Popular vehicle combinations

3. **Advanced Features:**
   - Custom payment distribution (not equal split)
   - Group discounts
   - Partial car payment tracking

## Notes

- Group bookings are created by assigning the same `booking_group_id` to multiple bookings during creation
- System automatically detects and groups bookings for display
- Payment logic ensures fair distribution across all vehicles
- All existing single booking functionality remains unchanged

## Support

For issues or questions:
- Check browser console for frontend errors
- Check backend logs for API errors
- Verify `booking_group_id` is set correctly in database
- Ensure all bookings in group belong to same customer
