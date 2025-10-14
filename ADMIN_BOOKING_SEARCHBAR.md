# Admin Booking Page SearchBar Implementation

## Overview

Added a comprehensive SearchBar component to the AdminBookingPage that filters all three tabs (BOOKINGS, CANCELLATION, EXTENSION) based on relevant booking details.

## Changes Made

### File: `frontend/src/pages/admin/AdminBookingPage.jsx`

#### 1. Imports Added

```javascript
import { useState, useEffect, useMemo } from "react"; // Added useMemo
import { Box, Typography, Button, CircularProgress } from "@mui/material"; // Added CircularProgress
import SearchBar from "../../ui/components/SearchBar"; // Added SearchBar import
```

#### 2. State Management

```javascript
const [searchQuery, setSearchQuery] = useState("");
```

#### 3. Filter Logic

Added `filteredRows` useMemo hook that:

- Filters rows based on search query across multiple fields
- Applies tab-specific filtering after search filtering
- Updates automatically when `rows`, `searchQuery`, or `activeTab` changes

**Searchable Fields:**

- **Booking ID** (`actualBookingId`)
- **Customer Name** (`customer_name`)
- **Car Model** (`car_model`)
- **Start Date** (`start_date`)
- **End Date** (`end_date`)
- **Booking Status** (`booking_status`)
- **Purpose** (`purpose`) - for CANCELLATION tab
- **New End Date** (`new_end_date`) - for EXTENSION tab
- **Balance** (`balance`)

#### 4. UI Components Added

##### SearchBar Component

- Positioned below the title/manage fees button section
- Right-aligned with responsive width (100% on mobile, 350px on larger screens)
- Dynamic placeholder based on active tab
- Clear button functionality included

##### Result Count Display

- Shows count when searching (e.g., "5 results found")
- Shows "No results found" when search yields no matches
- Hidden when not searching

##### Loading Indicator

- CircularProgress positioned above the table
- Consistent with customer pages implementation
- Only shown when `loading` state is true
- ManageBookingsTable `loading` prop set to `false` to prevent double loading indicators

## Tab-Specific Behavior

### BOOKINGS Tab

- Searches across all confirmed, pending, and in-progress bookings
- Filters by: ID, customer name, car model, dates, status, balance

### CANCELLATION Tab

- Searches only within cancelled bookings (`isCancel === 'TRUE'`)
- Additional filter by: purpose (cancellation reason)

### EXTENSION Tab

- Searches only within extended bookings (`isExtend === 'TRUE'`)
- Additional filter by: new_end_date

## UI Layout

```
┌─────────────────────────────────────────────────┐
│  BOOKINGS [Title]          [Manage Fees Button] │
├─────────────────────────────────────────────────┤
│  "5 results found"         [SearchBar ────────] │
├─────────────────────────────────────────────────┤
│           [CircularProgress] (if loading)       │
├─────────────────────────────────────────────────┤
│  [ManageBookingsTable]                          │
│  - Booking rows displayed here                  │
└─────────────────────────────────────────────────┘
```

## Search Examples

### Search by Customer Name

Input: `"john"`

- Finds: All bookings for customers with "john" in their name
- Works across all three tabs

### Search by Booking ID

Input: `"1234"`

- Finds: Booking with ID containing "1234"
- Exact or partial match supported

### Search by Car Model

Input: `"toyota"`

- Finds: All bookings with "toyota" in the car model name
- Case-insensitive

### Search by Date

Input: `"2025-01"`

- Finds: All bookings with dates in January 2025
- Searches both start_date and end_date

### Search by Status

Input: `"confirmed"`

- Finds: All confirmed bookings
- Useful for filtering by booking state

## Performance Optimization

- Uses `useMemo` hook to prevent unnecessary recalculations
- Only recalculates when `rows`, `searchQuery`, or `activeTab` changes
- Efficient string matching with `toLowerCase()` and `includes()`

## Consistency with Customer Pages

This implementation follows the same pattern as:

- `CustomerBookingHistory.jsx`
- `CustomerBookings.jsx`
- `CustomerSchedule.jsx`

Maintains consistent:

- SearchBar positioning (right-aligned, below headers)
- Loading indicator style (CircularProgress above table)
- Result count display format
- Search functionality (multi-field filtering)

## Testing Checklist

- [x] SearchBar appears on all three tabs
- [x] Search filters correctly for each tab
- [x] Result count displays accurately
- [x] Clear button clears search query
- [x] Loading indicator shows during data fetch
- [x] No double loading indicators
- [x] No console errors
- [x] Responsive on mobile devices

## Future Enhancements

Consider adding:

1. Advanced filters (date range picker, status dropdown)
2. Export filtered results functionality
3. Save search filters as presets
4. Search history/recent searches
5. Highlight matching text in results
