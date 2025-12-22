# Multi-Booking Feature Documentation

## Overview
The multi-booking feature allows customers to select and book multiple cars simultaneously through an intuitive multi-select interface.

## Features

### 1. Multi-Select Mode
- **Toggle Button**: Customers can activate multi-select mode from the car browsing page
- **Visual Indicators**: 
  - Selected cars show with a blue border and light blue background
  - Checkbox overlay appears on each car card
  - Selection count displayed in the toggle button
- **Easy Deselection**: Click on a selected car again to deselect it

### 2. Multi-Car Booking Modal
The modal provides a 3-step wizard for booking multiple cars:

#### **Step 1: Common Details**
- Set dates, times, and purpose that apply to all selected cars
- Start Date & End Date
- Pickup & Drop-off Times
- Purpose of Rental
- These settings serve as defaults for all cars

#### **Step 2: Individual Cars**
- Review each car in an accordion layout
- **Use Common Data Toggle**: 
  - ON: Car uses settings from Step 1
  - OFF: Customize individual settings for this car
- Customize per car:
  - Dates and times (if not using common data)
  - Driver selection (Self-Drive vs. With Driver)
  - Delivery/Pickup options
- Remove individual cars from booking if needed
- See real-time cost calculation for each car

#### **Step 3: Review & Confirm**
- Review all bookings before submission
- See detailed breakdown for each car:
  - Car details (make, model, year, plate)
  - Booking duration
  - Service type (Self-Drive or With Driver)
  - Cost breakdown (base rental + fees)
- Grand total displayed prominently
- Single confirmation creates all bookings

### 3. Backend Bulk Booking
- **Atomic Transaction**: All bookings created together or none at all
- **Comprehensive Validation**:
  - Date conflict checking for each car
  - Driver availability verification
  - Car existence validation
  - Customer authentication
- **Conflict Prevention**:
  - Prevents overlapping bookings on same car
  - Ensures driver isn't double-booked
  - Validates dates against maintenance periods
- **Notifications**: Automatic notifications sent for:
  - Customer booking confirmations (for each car)
  - Admin new booking alerts
  - Driver assignment notifications (if applicable)

## User Flow

1. **Browse Cars** → Customer views available cars
2. **Enable Multi-Select** → Click "☑️ Multi" button
3. **Select Cars** → Click on desired cars (checkboxes appear)
4. **Book Selected** → Click "Book X Cars" button (X = number selected)
5. **Set Common Details** → Define dates, times, purpose
6. **Customize Individual** → Override settings for specific cars if needed
7. **Review** → Check all bookings and total cost
8. **Confirm** → Submit all bookings at once
9. **Success** → Receive confirmation for all bookings

## API Endpoints

### POST `/api/bookings/bulk`
Creates multiple bookings in a single transaction.

**Request Body:**
```json
{
  "bookings": [
    {
      "car_id": 1,
      "startDate": "2025-12-25",
      "endDate": "2025-12-27",
      "pickupTime": "09:00",
      "dropoffTime": "17:00",
      "purpose": "Travel",
      "isSelfDrive": true,
      "selectedDriver": null,
      "totalCost": 5000,
      "deliveryType": "pickup",
      "pickupLocation": "JA Car Rental Office",
      "dropoffLocation": "JA Car Rental Office"
    },
    {
      "car_id": 2,
      "startDate": "2025-12-25",
      "endDate": "2025-12-27",
      "pickupTime": "09:00",
      "dropoffTime": "17:00",
      "purpose": "Travel",
      "isSelfDrive": false,
      "selectedDriver": "3",
      "totalCost": 7000,
      "deliveryType": "delivery",
      "deliveryLocation": "123 Customer Street",
      "dropoffLocation": "JA Car Rental Office"
    }
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Successfully created 2 booking(s)",
  "bookings": [...],
  "count": 2
}
```

**Response (Validation Error):**
```json
{
  "error": "Validation failed for one or more bookings",
  "validationErrors": [
    {
      "index": 0,
      "errors": ["Date conflict: Car is already booked for this period"]
    }
  ]
}
```

## File Structure

### Frontend
- **`/frontend/src/pages/customer/CustomerCars.jsx`**
  - Multi-select mode state management
  - Selection handling logic
  - Multi-select toggle button and "Book X Cars" button
  - Checkbox overlay on car cards

- **`/frontend/src/ui/components/modal/MultiCarBookingModal.jsx`**
  - 3-step booking wizard
  - Common data management
  - Individual car customization
  - Cost calculations
  - Bulk booking submission

### Backend
- **`/backend/src/routes/bookingRoute.js`**
  - Route: `POST /bookings/bulk`
  - Middleware: verifyToken, requireCustomer

- **`/backend/src/controllers/bookingController.js`**
  - Function: `createBulkBookings`
  - Validation logic for all bookings
  - Transaction-based creation
  - Notification sending

## Benefits

1. **Time-Saving**: Book multiple cars in one session instead of repeating the process
2. **Consistency**: Apply same dates/times to all cars easily
3. **Flexibility**: Customize individual cars when needed
4. **Safety**: Atomic transactions ensure all bookings succeed or fail together
5. **Visibility**: Clear overview of all selections before confirmation
6. **Cost Transparency**: See total cost before committing

## Technical Highlights

- **React State Management**: Efficient handling of multiple car bookings
- **Material-UI Components**: Professional accordion and stepper UI
- **Validation**: Multi-layered validation (frontend + backend)
- **Database Transactions**: Prisma transactions ensure data consistency
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Error Handling**: Comprehensive error messages for validation failures

## Future Enhancements

Potential improvements for future versions:
- Bulk discount logic (e.g., 10% off when booking 3+ cars)
- Save booking templates for repeat customers
- Group booking management dashboard
- Advanced date range selection (different dates per car)
- Calendar view for availability across multiple cars
- Export booking summary as PDF

## Testing Checklist

- [ ] Multi-select mode toggles correctly
- [ ] Car selection/deselection works
- [ ] Selected count displays accurately
- [ ] Multi-booking modal opens with correct cars
- [ ] Common data applies to all cars
- [ ] Individual customization works independently
- [ ] Cost calculations are accurate
- [ ] Backend validates date conflicts
- [ ] Backend validates driver availability
- [ ] Notifications sent for all bookings
- [ ] Transaction rollback on any error
- [ ] Success message displays booking count
- [ ] Cars list refreshes after booking

---

**Implementation Date**: December 20, 2025  
**Feature Version**: 1.0  
**Implementation Approach**: Option 2 - Quick Multi-Select
