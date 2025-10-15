# Return Modal - Fees Breakdown & Auto Maintenance

## Overview

Enhanced the return process to track which fees are applied and automatically set cars to maintenance status upon return.

## Features Implemented

### 1. Fees Breakdown Tracking

**Purpose:** Store a comma-separated list of fee types that were applied to the return in the `fees_breakdown` column of the Return table.

**Fee Types Tracked:**

- `Gas` - Gas level fee (when car is returned with less gas than released)
- `Equipment` - Equipment loss/damage fee
- `Damage` - Damage fee (minor or major)
- `Cleaning` - Cleaning fee (when car is not clean)
- `Stain` - Stain removal fee (when car has stains)
- `Overdue` - Overdue fee (when car is returned late)

**Example Storage:**

```
fees_breakdown: "Gas, Equipment, Cleaning, Overdue"
fees_breakdown: "Damage, Cleaning, Stain"
fees_breakdown: null  // No fees charged
```

#### Implementation Details

**Backend - `returnController.js` > `submitReturn()`:**

```javascript
// Track which fees are being charged for fees_breakdown
const feesList = [];

// Gas level fee
if (releaseGasLevel > returnGasLevel) {
  const gasLevelDiff = releaseGasLevel - returnGasLevel;
  calculatedFees += gasLevelDiff * (feesObject.gas_level_fee || 0);
  feesList.push('Gas');
}

// Equipment loss fee
if (lostItemCount > 0) {
  calculatedFees += lostItemCount * (feesObject.equipment_loss_fee || 0);
  feesList.push('Equipment');
}

// Damage fee
if (damageStatus === 'minor' || damageStatus === 'major') {
  calculatedFees += /* damage fee calculation */;
  feesList.push('Damage');
}

// Cleaning fee
if (!isClean) {
  calculatedFees += feesObject.cleaning_fee || 0;
  feesList.push('Cleaning');

  if (hasStain) {
    calculatedFees += feesObject.stain_removal_fee || 0;
    feesList.push('Stain');
  }
}

// Overdue fee
if (overdueHours > 0) {
  calculatedFees += /* overdue fee calculation */;
  feesList.push('Overdue');
}

// Create comma-separated string
const feesBreakdown = feesList.join(', ') || null;

// Store in Return table
await tx.return.create({
  data: {
    // ... other fields
    fees_breakdown: feesBreakdown
  }
});
```

### 2. Auto Maintenance on Return

**Purpose:** Automatically set car status to "Maintenance" and create a maintenance record when a car is returned.

**Workflow:**

1. ✅ Customer clicks "Return" button in Return Modal
2. ✅ Backend processes return
3. ✅ Car status updated to `Maintenance`
4. ✅ New maintenance record created with:
   - Start date = Return date (current date/time)
   - Description = "Post-rental inspection and maintenance"
   - End date = null (to be set when maintenance completes)
   - Cost = null (to be filled by admin)
   - Shop name = null (to be filled by admin)

#### Implementation Details

**Backend - `returnController.js` > `submitReturn()`:**

```javascript
// Update car mileage and set status to maintenance
await tx.car.update({
  where: { car_id: booking.car_id },
  data: {
    mileage: parseInt(odometer),
    car_status: "Maintenance", // ← Changed from 'Available'
  },
});

// Create maintenance record with return date as start date
const returnDate = new Date();
await tx.maintenance.create({
  data: {
    car_id: booking.car_id,
    maintenance_start_date: returnDate,
    description: "Post-rental inspection and maintenance",
    maintenance_cost: null,
    maintenance_end_date: null,
    maintenance_shop_name: null,
  },
});

console.log("✅ Car set to Maintenance status and maintenance record created");
```

## Database Schema Updates

### Return Table

```sql
-- Column already exists in schema
fees_breakdown String?  -- Stores comma-separated fee types
```

### Car Table

```sql
-- Status updated on return
car_status String?  -- Set to 'Maintenance' on return
```

### Maintenance Table

```sql
-- New record created on return
CREATE TABLE Maintenance (
  maintenance_id SERIAL PRIMARY KEY,
  car_id INT REFERENCES Car(car_id),
  maintenance_start_date TIMESTAMPTZ,  -- Set to return date
  maintenance_end_date TIMESTAMPTZ,    -- NULL initially
  description TEXT,                    -- 'Post-rental inspection and maintenance'
  maintenance_cost INT,                -- NULL initially
  maintenance_shop_name TEXT           -- NULL initially
);
```

## API Response Changes

### `calculateReturnFees` Endpoint

**Response now includes separate stain removal fee:**

```json
{
  "fees": {
    "gasLevelFee": 500,
    "equipmentLossFee": 1000,
    "damageFee": 5000,
    "cleaningFee": 300,
    "stainRemovalFee": 200,  // ← NEW: Separated from cleaning fee
    "overdueFee": 800,
    "total": 7800
  },
  "releaseData": { ... }
}
```

### `submitReturn` Endpoint

**Request Body:**

```json
{
  "gasLevel": "Mid",
  "odometer": "15000",
  "damageStatus": "minor",
  "equipmentStatus": "no",
  "equip_others": "spare tire",
  "isClean": false,
  "hasStain": true,
  "totalFees": 7800,
  "paymentData": { ... },
  "damageImageUrl": "https://...",
  "overdueHours": 3
}
```

**Database Updates:**

1. ✅ Return record created with `fees_breakdown: "Gas, Equipment, Damage, Cleaning, Stain, Overdue"`
2. ✅ Car status updated to `Maintenance`
3. ✅ Car mileage updated
4. ✅ Maintenance record created
5. ✅ Booking status updated to `Completed`
6. ✅ Transaction record created

## Frontend Updates (ReturnModal.jsx)

### Fees Display

The modal already displays fees dynamically:

```javascript
const fees = [
  { label: "Gas Level Fee", amount: calculatedFees.gasLevelFee },
  { label: "Equipment Loss Fee", amount: calculatedFees.equipmentLossFee },
  { label: "Damage Fee", amount: calculatedFees.damageFee },
  { label: "Cleaning Fee", amount: calculatedFees.cleaningFee },
  { label: "Stain Removal Fee", amount: calculatedFees.stainRemovalFee }, // ← NEW
  {
    label: "Overdue Fee",
    amount: calculatedFees.overdueFee,
    hours: overdueHours,
  },
].filter((fee) => fee.amount > 0);
```

**No frontend changes needed** - the fees are already displayed correctly!

## Use Cases

### Scenario 1: Return with Multiple Fees

**Input:**

- Gas level: High → Mid (fee applies)
- Equipment: missing spare tire (fee applies)
- Damage: minor (fee applies)
- Clean: No (fee applies)
- Has stain: Yes (fee applies)
- Overdue: 5 hours (fee applies)

**Result:**

```
fees_breakdown: "Gas, Equipment, Damage, Cleaning, Stain, Overdue"
car_status: "Maintenance"
maintenance_start_date: 2025-10-15 14:30:00
```

### Scenario 2: Clean Return with No Issues

**Input:**

- Gas level: High → High (no fee)
- Equipment: complete (no fee)
- Damage: none (no fee)
- Clean: Yes (no fee)
- On time (no fee)

**Result:**

```
fees_breakdown: null
car_status: "Maintenance"  // Still goes to maintenance for inspection
maintenance_start_date: 2025-10-15 14:30:00
```

### Scenario 3: Only Overdue Fee

**Input:**

- Everything perfect except returned 3 hours late

**Result:**

```
fees_breakdown: "Overdue"
car_status: "Maintenance"
maintenance_start_date: 2025-10-15 14:30:00
```

## Admin Workflow

After a car is returned:

1. **Car automatically set to Maintenance**

   - Car is no longer available for booking
   - Status shown as "Maintenance" in car list

2. **Maintenance record created**

   - Admin can view in Maintenance table
   - Pre-filled with return date as start date
   - Description: "Post-rental inspection and maintenance"

3. **Admin completes maintenance details:**
   - Inspect car based on return data
   - Add maintenance costs
   - Add shop name (if external)
   - Set maintenance end date
   - Change car status back to "Available"

## Benefits

### 1. Fees Breakdown Tracking

✅ **Transparency:** Easy to see which fees were charged
✅ **Reporting:** Can analyze most common fee types
✅ **Dispute Resolution:** Clear record of what was charged
✅ **Analytics:** Track revenue by fee type

### 2. Auto Maintenance

✅ **Safety:** Ensures all returned cars are inspected
✅ **Workflow:** Prevents booking dirty/damaged cars
✅ **Compliance:** Maintains proper car maintenance records
✅ **Automation:** Reduces manual status updates

## Testing Checklist

- [ ] Return car with gas level difference → Check "Gas" in fees_breakdown
- [ ] Return car with missing equipment → Check "Equipment" in fees_breakdown
- [ ] Return car with damage → Check "Damage" in fees_breakdown
- [ ] Return car not clean → Check "Cleaning" in fees_breakdown
- [ ] Return car with stain → Check "Stain" in fees_breakdown
- [ ] Return car late → Check "Overdue" in fees_breakdown
- [ ] Return with multiple fees → Check all applicable fees comma-separated
- [ ] Return with no fees → Check fees_breakdown is null
- [ ] Verify car_status changes to "Maintenance"
- [ ] Verify maintenance record created with correct start date
- [ ] Verify car mileage updated correctly
- [ ] Verify booking status becomes "Completed"

## Database Query Examples

### View Returns with Fees Breakdown

```sql
SELECT
  r.return_id,
  r.booking_id,
  r.total_fee,
  r.fees_breakdown,
  b.customer_id,
  c.first_name || ' ' || c.last_name as customer_name
FROM "Return" r
JOIN "Booking" b ON r.booking_id = b.booking_id
JOIN "Customer" c ON b.customer_id = c.customer_id
WHERE r.fees_breakdown IS NOT NULL
ORDER BY r.return_id DESC;
```

### View Cars in Maintenance

```sql
SELECT
  c.car_id,
  c.make || ' ' || c.model as car_name,
  c.car_status,
  m.maintenance_start_date,
  m.description
FROM "Car" c
LEFT JOIN "Maintenance" m ON c.car_id = m.car_id
  AND m.maintenance_end_date IS NULL
WHERE c.car_status = 'Maintenance'
ORDER BY m.maintenance_start_date DESC;
```

### Analyze Fee Types Distribution

```sql
SELECT
  UNNEST(string_to_array(fees_breakdown, ', ')) as fee_type,
  COUNT(*) as count,
  SUM(total_fee) as total_revenue
FROM "Return"
WHERE fees_breakdown IS NOT NULL
GROUP BY fee_type
ORDER BY count DESC;
```

## Notes

- The `fees_breakdown` column stores simple fee type names for easy reading
- Separate from the detailed fee amounts stored in other columns
- Maintenance record is created even for clean returns (inspection still needed)
- Admin must manually update car status back to "Available" after maintenance
- Maintenance end date initially null, set by admin when maintenance completes
