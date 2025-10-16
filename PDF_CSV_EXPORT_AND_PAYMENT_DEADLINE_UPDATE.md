# PDF & CSV Export Enhancement + Payment Deadline Update

## Overview
This update fixes PDF export data issues, adds CSV export functionality, and implements dynamic payment deadlines based on booking proximity.

## Changes Made

### 1. PDF Export Data Fixes
**File:** `frontend/src/utils/pdfExport.js`

**Problem:** PDF columns showed "N/A" for most data because field names didn't match the API response format.

**Solution:** Updated field mappings to handle both camelCase (frontend) and snake_case (backend) naming conventions.

#### Transaction Reports
- **Fixed Columns:**
  - Added Transaction ID column
  - Removed non-existent fields (startDate, endDate, totalAmount, status)
  - Added actual fields: completionDate, cancellationDate
  - Maps both `bookingDate` and `booking_date` formats

#### Payment Reports
- **Fixed Columns:**
  - Correctly maps `totalAmount` OR `amount` fields
  - Maps `paidDate` OR `paid_date` fields
  - Handles `paymentMethod` OR `payment_method`

#### Refund Reports
- **Fixed Columns:**
  - Maps `refundAmount` OR `refund_amount` fields
  - Maps `refundDate` OR `refund_date` fields

### 2. CSV Export Feature (NEW)
**File:** `frontend/src/utils/csvExport.js` (NEW)

**Features:**
- Generates CSV files for all transaction and analytics reports
- Properly escapes special characters (commas, quotes, newlines)
- Includes headers and formatted data
- Currency formatting with Philippine Peso (₱)
- Date formatting

**Functions:**
- `generateTransactionCSV(activeTab, rows)` - For Transaction Logs
- `generateAnalyticsCSV(params)` - For Reports & Analytics

**File Naming:**
- Transactions: `TRANSACTIONS_Report_YYYY-MM-DD.csv`
- Payment: `PAYMENT_Report_YYYY-MM-DD.csv`
- Refund: `REFUND_Report_YYYY-MM-DD.csv`
- Analytics: `Analytics_Report_[period]_[year]_YYYY-MM-DD.csv`

### 3. CSV Download Buttons
#### Transaction Logs Page
**File:** `frontend/src/pages/admin/AdminTransactionPage.jsx`

**Changes:**
- Added CSV download button next to PDF button
- Green color theme (#2e7d32) for CSV button
- Mobile-friendly responsive design
- Icon: FaFileCsv from react-icons
- Handles TRANSACTIONS, PAYMENT, and REFUND tabs

#### Reports & Analytics Page
**File:** `frontend/src/pages/admin/AdminReportAnalytics.jsx`

**Changes:**
- Added CSV download button next to PDF button
- Green color theme (#2e7d32) for CSV button
- Mobile-friendly responsive design
- Works with all views: Income, Expenses, Top Cars, Top Customers
- Supports all periods: Monthly, Quarterly, Yearly

### 4. Dynamic Payment Deadline Logic
**File:** `backend/src/utils/autoCancel.js`

**Previous Behavior:**
- All bookings had a fixed 72-hour (3-day) payment deadline

**New Behavior:**
Payment deadline is now dynamic based on booking proximity:

| Booking Start Date | Payment Deadline | Use Case |
|-------------------|------------------|----------|
| **Today** | **1 hour** from booking time | Same-day urgent bookings |
| **Within 3 days** (but not today) | **24 hours** from booking time | Near-future bookings |
| **More than 3 days away** | **72 hours** (3 days) from booking time | Standard advance bookings |

**Logic Implementation:**
```javascript
const daysUntilStart = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));

if (daysUntilStart === 0) {
  // Today: 1 hour deadline
  deadline = bookingDate + 1 hour;
} else if (daysUntilStart > 0 && daysUntilStart <= 3) {
  // Within 3 days: 24 hour deadline
  deadline = bookingDate + 24 hours;
} else {
  // More than 3 days: 72 hour deadline
  deadline = bookingDate + 72 hours;
}
```

**Benefits:**
- Encourages faster payment for urgent same-day bookings
- Gives customers reasonable time for advance bookings
- Automatically cancels unpaid bookings based on urgency
- Frees up car availability sooner for last-minute bookings

## UI Changes

### Button Styling

#### PDF Download Button
- **Color:** Blue (#1976d2)
- **Icon:** DownloadIcon (MUI)
- **Position:** Left of CSV button
- **Mobile:** Height 32px, font-size 0.7-0.75rem

#### CSV Download Button (NEW)
- **Color:** Green (#2e7d32)
- **Icon:** FaFileCsv (react-icons)
- **Position:** Right of PDF button
- **Mobile:** Height 32px, font-size 0.7-0.75rem

### Mobile Responsiveness
Both buttons adapt to mobile screens (< 600px):
- Smaller height (32px vs 36px)
- Reduced font size
- Smaller icons (14-16px)
- Buttons wrap to new line if needed
- Proper spacing maintained

## Testing Checklist

### PDF Export
- [ ] Transaction Logs - TRANSACTIONS tab
  - [ ] Verify all columns have data
  - [ ] Check Transaction ID, Booking ID visible
  - [ ] Verify dates formatted correctly
- [ ] Transaction Logs - PAYMENT tab
  - [ ] Verify amounts show correctly
  - [ ] Check payment method visible
  - [ ] Verify paid date formatted correctly
- [ ] Transaction Logs - REFUND tab
  - [ ] Verify refund amounts show correctly
  - [ ] Check refund date formatted correctly
- [ ] Reports & Analytics
  - [ ] Test Income view (Monthly, Quarterly, Yearly)
  - [ ] Test Expenses view
  - [ ] Test Top Cars view
  - [ ] Test Top Customers view

### CSV Export
- [ ] Transaction Logs CSV downloads
  - [ ] Open in Excel/Google Sheets
  - [ ] Verify all data present
  - [ ] Check special characters escaped properly
- [ ] Analytics CSV downloads
  - [ ] Verify summary section present
  - [ ] Check data matches charts
  - [ ] Test all view types

### Payment Deadline Logic
- [ ] **Same-day booking test:**
  1. Create booking for today
  2. Wait 1 hour without payment
  3. Verify auto-cancellation occurs
  4. Verify car status returns to "Available"

- [ ] **Near-future booking test:**
  1. Create booking for 2 days from now
  2. Wait 24 hours without payment
  3. Verify auto-cancellation occurs

- [ ] **Advance booking test:**
  1. Create booking for 1 week from now
  2. Verify 72-hour deadline applies
  3. Test cancellation after 3 days

### Mobile Responsiveness
- [ ] Test on mobile device (< 600px width)
  - [ ] Verify buttons don't overflow
  - [ ] Check buttons wrap properly
  - [ ] Test both PDF and CSV downloads
  - [ ] Verify all text readable

## Files Modified

### Frontend
1. `frontend/src/utils/pdfExport.js` - Fixed field mappings
2. `frontend/src/utils/csvExport.js` - NEW FILE (220 lines)
3. `frontend/src/pages/admin/AdminTransactionPage.jsx` - Added CSV button
4. `frontend/src/pages/admin/AdminReportAnalytics.jsx` - Added CSV button

### Backend
1. `backend/src/utils/autoCancel.js` - Updated payment deadline logic

## Dependencies
No new dependencies required. Uses existing libraries:
- `jspdf` and `jspdf-autotable` (already installed)
- `react-icons/fa` (already installed)

## Notes

### CSV Format
- Uses UTF-8 encoding
- Comma-separated values
- Properly escapes commas, quotes, and newlines
- Compatible with Excel, Google Sheets, and other spreadsheet software

### Payment Deadline Behavior
- Auto-cancel job should run frequently (every 15-30 minutes) for timely cancellations
- Deadline calculated from `booking_date`, not current time
- Only affects bookings in "Pending" status with unpaid payment_status
- Cancelled bookings free up car inventory immediately

### Error Handling
- PDF/CSV download buttons disabled when no data available
- Both export functions handle missing/null values gracefully
- Falls back to "N/A" for missing fields

## Future Enhancements
- [ ] Add date range filters before export
- [ ] Include chart images in PDF
- [ ] Add email delivery option for reports
- [ ] Schedule automatic report generation
- [ ] Add Excel (.xlsx) export format
- [ ] Send payment deadline reminders to customers
- [ ] Display payment deadline on customer booking page
