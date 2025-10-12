# Philippine Timezone Implementation Guide

## Overview
This project handles all date and time operations in **Philippine Standard Time (PST) / UTC+8**.

## Database Configuration
- All `timestamp` fields have been changed to `timestamptz` (timestamp with timezone)
- PostgreSQL stores dates in UTC internally
- The application converts between UTC and Philippine time at the application layer

## Frontend Implementation

### Utility Functions (`frontend/src/utils/dateTime.js`)
The following utility functions are available for consistent timezone handling:

#### Display Functions
- `formatPhilippineDate(date, options)` - Format date in Philippine locale
- `formatPhilippineTime(date)` - Format time in 12-hour format (e.g., "2:30 PM")
- `formatPhilippineDateTime(date)` - Format full datetime
- `parseAndFormatTime(timeString)` - Parse and format time strings

#### Conversion Functions
- `toPhilippineTime(date)` - Convert UTC to Philippine time
- `toUTC(date)` - Convert Philippine time to UTC
- `getNowPhilippineTime()` - Get current time in Philippine timezone

#### Helper Functions
- `formatDateForInput(date)` - Format date for HTML date inputs (YYYY-MM-DD)
- `calculateDaysDifference(startDate, endDate)` - Calculate days between dates

### Usage Examples

#### Displaying Dates
```javascript
import { formatPhilippineDate, formatPhilippineTime, parseAndFormatTime } from '../../utils/dateTime.js';

// Display date
<Typography>
  {formatPhilippineDate(booking.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}
</Typography>

// Display time only (from datetime or time string)
<Typography>
  {parseAndFormatTime(booking.pickup_time)}
</Typography>

// Display full datetime
<Typography>
  {formatPhilippineDateTime(booking.created_at)}
</Typography>
```

#### Date Input Fields
```javascript
import { formatDateForInput } from '../../utils/dateTime.js';

<TextField
  type="date"
  value={formatDateForInput(booking.end_date)}
  onChange={handleChange}
/>
```

## Backend Implementation

### Utility Functions (`backend/src/utils/dateTime.js`)
Server-side timezone utilities for consistent handling:

#### Core Functions
- `toPhilippineTime(date)` - Convert UTC to Philippine time
- `toUTC(date)` - Convert Philippine time to UTC for storage
- `getNowPhilippineTime()` - Current time in Philippine timezone

#### Parsing Functions
- `parsePhilippineDateString(dateString)` - Parse date as Philippine time
- `parsePhilippineDateTimeString(dateTimeString)` - Parse datetime as Philippine time

#### Utility Functions
- `calculateDaysDifference(startDate, endDate)` - Days between dates
- `isDateInPast(date)` - Check if date is in the past
- `isToday(date)` - Check if date is today
- `addDays(date, days)` - Add days to a date
- `startOfDay(date)` - Get start of day (00:00:00)
- `endOfDay(date)` - Get end of day (23:59:59)

### Usage Examples

#### Creating Records
```javascript
const { getNowPhilippineTime, parsePhilippineDateString } = require('../utils/dateTime.js');

// Current timestamp
const booking = await prisma.booking.create({
  data: {
    booking_date: getNowPhilippineTime(),
    start_date: parsePhilippineDateString(req.body.start_date),
    // ...other fields
  }
});
```

#### Querying with Date Ranges
```javascript
const { startOfDay, endOfDay } = require('../utils/dateTime.js');

const bookings = await prisma.booking.findMany({
  where: {
    start_date: {
      gte: startOfDay(selectedDate),
      lte: endOfDay(selectedDate)
    }
  }
});
```

#### Date Calculations
```javascript
const { calculateDaysDifference, isDateInPast } = require('../utils/dateTime.js');

const days = calculateDaysDifference(booking.start_date, booking.end_date);
const isPastBooking = isDateInPast(booking.end_date);
```

## Common Patterns

### 1. Displaying Booking Times
**Problem**: Time showing as full datetime instead of just time
**Solution**:
```javascript
// ❌ Wrong
<Typography>{booking.pickup_time}</Typography>

// ✅ Correct
<Typography>{parseAndFormatTime(booking.pickup_time)}</Typography>
```

### 2. Date Input Fields
**Problem**: Date not displaying correctly in input
**Solution**:
```javascript
// ❌ Wrong
<TextField type="date" value={booking.start_date} />

// ✅ Correct
<TextField type="date" value={formatDateForInput(booking.start_date)} />
```

### 3. Creating Bookings
**Problem**: Dates stored in wrong timezone
**Solution**:
```javascript
// Backend controller
const { parsePhilippineDateString, getNowPhilippineTime } = require('../utils/dateTime.js');

const booking = await prisma.booking.create({
  data: {
    booking_date: getNowPhilippineTime(),
    start_date: parsePhilippineDateString(req.body.start_date),
    end_date: parsePhilippineDateString(req.body.end_date)
  }
});
```

### 4. Comparing Dates
**Problem**: Date comparisons not accounting for timezone
**Solution**:
```javascript
const { isDateInPast, isToday } = require('../utils/dateTime.js');

// ❌ Wrong
const isPast = new Date(booking.end_date) < new Date();

// ✅ Correct
const isPast = isDateInPast(booking.end_date);
const isBookingToday = isToday(booking.start_date);
```

## Testing Timezone Handling

### Verify Correct Display
1. Create a booking for today at 2:00 PM Philippine time
2. Check that it displays as "2:00 PM" not "06:00 AM" (UTC)
3. Verify dates show correct day (not previous day due to UTC conversion)

### Test Date Boundaries
1. Create booking for midnight (00:00) Philippine time
2. Verify it doesn't shift to previous day when displayed
3. Check end-of-day bookings (23:59) don't shift to next day

## Migration Notes

### Existing Data
- All existing `timestamp` fields have been migrated to `timestamptz`
- PostgreSQL automatically converts existing data to UTC
- Application layer handles conversion to Philippine time for display

### Future Development
- Always use the provided utility functions
- Never use `new Date()` directly for display - use `getNowPhilippineTime()`
- Never use `.toLocaleDateString()` without timezone consideration
- Always test date/time features across different days of the week

## Troubleshooting

### Dates Off by One Day
**Cause**: Not accounting for timezone conversion
**Fix**: Use `toPhilippineTime()` before displaying

### Times Showing Wrong Format
**Cause**: Displaying raw datetime instead of time only
**Fix**: Use `parseAndFormatTime()` for time fields

### Date Input Not Working
**Cause**: Wrong date format for input field
**Fix**: Use `formatDateForInput()` for value

## Files Modified

### Frontend
- `frontend/src/utils/dateTime.js` - Created timezone utilities
- `frontend/src/pages/customer/CustomerBookings.jsx` - Updated to show time only in cards

### Backend
- `backend/src/utils/dateTime.js` - Created timezone utilities
- `backend/prisma/schema.prisma` - Changed all timestamp to timestamptz

### To Be Updated (Future)
- All controllers creating/updating bookings
- All date comparison logic
- Analytics and reporting features
- Email notifications with dates/times
