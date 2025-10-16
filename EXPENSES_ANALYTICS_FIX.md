# Expenses Analytics Fix - Real Maintenance & Refund Data

## Overview

Fixed the expenses view in the analytics dashboard to display real maintenance and refund data from the database instead of showing zeros.

## Date

January 14, 2025

## Problem

The expenses chart was showing all zeros because:

1. The `/maintenance` endpoint didn't exist at the root level - it was nested under `/cars/:carId/maintenance`
2. The frontend was trying to fetch from a non-existent endpoint
3. The field name for maintenance cost was incorrect (`cost` vs `maintenance_cost`)

## Solution

### 1. Backend - New Maintenance Endpoint

#### Added `getAllMaintenanceRecords` function (`maintenanceController.js`)

```javascript
// @desc    Get all maintenance records (for analytics)
// @route   GET /maintenance
// @access  Private/Admin
export const getAllMaintenanceRecords = async (req, res) => {
  try {
    const maintenanceRecords = await prisma.maintenance.findMany({
      orderBy: { maintenance_start_date: "desc" },
    });
    res.json(maintenanceRecords);
  } catch (error) {
    console.error("Error fetching all maintenance records:", error);
    res.status(500).json({ error: "Failed to fetch maintenance records" });
  }
};
```

#### Registered new route (`index.js`)

```javascript
import { getAllMaintenanceRecords } from "./controllers/maintenanceController.js";

// ...

app.use("/maintenance", (req, res, next) => {
  if (req.method === "GET" && req.path === "/") {
    return getAllMaintenanceRecords(req, res);
  }
  next();
});
```

#### Added `getAllRefundsForAnalytics` function (`refundController.js`)

```javascript
// @desc    Get all refunds (for analytics - returns raw data)
// @route   GET /refunds/analytics
// @access  Private/Admin
export const getAllRefundsForAnalytics = async (req, res) => {
  try {
    const refunds = await prisma.refund.findMany({
      orderBy: { refund_date: "desc" },
    });
    res.json(refunds); // Return raw data without shaping
  } catch (error) {
    console.error("Error fetching refunds for analytics:", error);
    res.status(500).json({ error: "Failed to fetch refunds" });
  }
};
```

**Why a separate analytics endpoint?**

- The existing `/refunds` endpoint uses `shapeRefund()` which transforms field names to camelCase (`refund_amount` → `refundAmount`)
- For analytics, we need raw database field names to match the schema exactly
- This avoids breaking existing UI components that depend on the shaped data

#### Registered analytics route (`refundRoute.js`)

```javascript
import { getAllRefundsForAnalytics } from "../controllers/refundController.js";

router.get("/analytics", getAllRefundsForAnalytics); // Must be before '/' route
router.get("/", getRefunds);
```

**Important:** The `/analytics` route must be registered **before** the `/` route to prevent route matching issues.

### 2. Frontend - Fixed Field Names and Updated Endpoints

#### Updated API endpoint for refunds

```javascript
// Fetch maintenance and refunds data
const [maintenanceRes, refundsRes] = await Promise.all([
  authFetch(`${API_BASE}/maintenance`),
  authFetch(`${API_BASE}/refunds/analytics`), // Use analytics endpoint for raw data
]);
```

**Changed:** `/refunds` → `/refunds/analytics` to get raw database field names instead of shaped data.

#### Updated all references from `record.cost` to `record.maintenance_cost`

**Monthly aggregation:**

```javascript
maintenanceRecords.forEach((record) => {
  const date = new Date(record.maintenance_start_date);
  if (
    date.getFullYear() === selectedYear &&
    date.getMonth() === selectedMonthIndex
  ) {
    const day = date.getDate() - 1;
    maintenanceAggregated[day] += Number(record.maintenance_cost || 0); // Fixed field name
  }
});
```

**Quarterly aggregation:**

```javascript
maintenanceRecords.forEach((record) => {
  const date = new Date(record.maintenance_start_date);
  if (date.getFullYear() === selectedYear) {
    const month = date.getMonth();
    const quarterMonth = month - quarterStartMonth;
    if (quarterMonth >= 0 && quarterMonth < 3) {
      maintenanceAggregated[quarterMonth] += Number(
        record.maintenance_cost || 0
      );
    }
  }
});
```

**Yearly aggregation:**

```javascript
maintenanceRecords.forEach((record) => {
  const date = new Date(record.maintenance_start_date);
  if (date.getFullYear() === selectedYear) {
    const month = date.getMonth();
    maintenanceAggregated[month] += Number(record.maintenance_cost || 0);
  }
});
```

### 3. Data Aggregation Logic

The expenses view now properly aggregates data based on the selected period:

#### Monthly View

- Shows daily expenses for the selected month
- Aggregates maintenance by `maintenance_start_date` (day level)
- Aggregates refunds by `refund_date` (day level)

#### Quarterly View

- Shows monthly expenses for the selected quarter (3 months)
- Aggregates maintenance by month within the quarter
- Aggregates refunds by month within the quarter

#### Yearly View

- Shows all 12 months of expenses
- Aggregates maintenance by month for the entire year
- Aggregates refunds by month for the entire year

## Database Schema Reference

### Maintenance Table

```prisma
model Maintenance {
  maintenance_id         Int       @id @default(autoincrement())
  car_id                 Int
  maintenance_start_date DateTime? @db.Timestamptz(6)
  maintenance_end_date   DateTime? @db.Timestamptz(6)
  description            String?
  maintenance_cost       Int?      // ← This is the correct field name
  maintenance_shop_name  String?
  car                    Car       @relation(fields: [car_id], references: [car_id])
}
```

### Refund Table

```prisma
model Refund {
  refund_id     Int      @id @default(autoincrement())
  booking_id    Int
  customer_id   Int
  refund_method String?
  gcash_no      String?
  reference_no  String?
  refund_amount Decimal  @db.Decimal(10, 2)
  refund_date   DateTime @default(now()) @db.Timestamptz(6)
  description   String?
  booking       Booking  @relation(fields: [booking_id], references: [booking_id])
  customer      Customer @relation(fields: [customer_id], references: [customer_id])
}
```

## API Endpoints

### New Endpoints

- **GET** `/maintenance` - Returns all maintenance records (raw data for analytics)
- **GET** `/refunds/analytics` - Returns all refund records (raw data for analytics)

### Existing Endpoints

- **GET** `/refunds` - Returns all refund records (shaped data with camelCase for UI)
- **GET** `/cars/:carId/maintenance` - Returns maintenance records for specific car

## Testing

### Manual Testing Steps

1. Navigate to Report & Analytics page
2. Click on "EXPENSES" chip
3. Select different periods (Monthly, Quarterly, Yearly)
4. Verify that:
   - Orange line shows maintenance costs
   - Red line shows refund amounts
   - Total displays correct sum
   - Data aggregates correctly for each period

### Expected Results

- **Monthly**: Daily breakdown of expenses for selected month
- **Quarterly**: Monthly breakdown for 3 months in selected quarter
- **Yearly**: Monthly breakdown for all 12 months in selected year

### Sample Data Display

```
EXPENSES FOR October 2025:
  Maintenance: ₱ 15,000.00
  Refunds: ₱ 3,500.00
  Total: ₱ 18,500.00
```

## Files Modified

### Backend

1. `backend/src/controllers/maintenanceController.js`

   - Added `getAllMaintenanceRecords` function

2. `backend/src/index.js`

   - Imported `getAllMaintenanceRecords`
   - Registered `/maintenance` route

3. `backend/src/controllers/refundController.js`

   - Added `getAllRefundsForAnalytics` function
   - Returns raw database data without field name transformation

4. `backend/src/routes/refundRoute.js`
   - Added `/analytics` route before `/` route
   - Imports `getAllRefundsForAnalytics`

### Frontend

5. `frontend/src/pages/admin/AdminReportAnalytics.jsx`
   - Fixed field names: `cost` → `maintenance_cost`
   - Updated refunds endpoint: `/refunds` → `/refunds/analytics`
   - Uses raw database field names for consistency

## Benefits

1. ✅ **Real Data**: Shows actual expenses from database
2. ✅ **Accurate Analytics**: Helps admins track real costs
3. ✅ **Proper Aggregation**: Correctly groups data by period
4. ✅ **Dual Tracking**: Separate lines for maintenance and refunds
5. ✅ **Financial Insights**: Enables better budget planning
6. ✅ **Data Consistency**: Raw database fields ensure accurate calculations

## Technical Notes

### Timezone Handling

- All dates are stored in PostgreSQL with `@db.Timestamptz(6)` (timezone-aware)
- Frontend JavaScript `Date` object handles timezone conversion automatically

### Null Handling

- Uses `Number(record.maintenance_cost || 0)` to handle null values
- Uses `Number(record.refund_amount || 0)` to handle null values

### Performance

- Fetches all maintenance and refund records in parallel using `Promise.all()`
- Aggregation happens in frontend to reduce backend complexity
- Consider adding pagination or date range filters for large datasets in the future

## Future Improvements

- Add date range filters to backend endpoints for better performance
- Implement caching for frequently accessed data
- Add export functionality for expense reports
- Create breakdown by car or maintenance shop
