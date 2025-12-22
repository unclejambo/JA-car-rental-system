# Multi-Car Booking Modal Enhancements

## Summary
Enhanced the MultiCarBookingModal to provide feature parity with the single BookingModal, including unavailable date checking, delivery/pickup service options, date conflict detection, and driver availability warnings.

## Features Added

### 1. Unavailable Periods Tracking
- **State Added**: `unavailablePeriods` - stores unavailable periods for each car
- **Function**: `fetchAllUnavailablePeriods()` - fetches unavailable dates for all cars from the API
- **Function**: `checkDateConflict(carId, startDate, endDate)` - checks if selected dates conflict with bookings or maintenance
- **Display**: Shows unavailable periods for each car in the Individual Cars accordion with reason (booking/maintenance)

### 2. Delivery/Pickup Service Options
- **Common Data Fields Added**:
  - `deliveryType`: 'pickup' or 'delivery'
  - `pickupLocation`: Location for pickup service (default: 'JA Car Rental Office')
  - `dropoffLocation`: Location for dropoff
  - `deliveryLocation`: Address for delivery service

- **Individual Car Fields**: Each car can override common delivery settings
- **UI**: Radio buttons to select between "Pick-up at Office" or "Delivery Service"
- **Validation**: Requires delivery location when delivery service is selected

### 3. Date Conflict Detection & Handling
- **Per-Car Conflict Tracking**:
  - `hasConflict`: Boolean flag for each car booking
  - `conflictMessage`: Detailed message about the conflict
  
- **Conflict Detection Points**:
  - When common dates are set/changed (Step 0)
  - When individual car dates are changed (Step 1)
  - When toggling between common and custom data

- **User Flow**:
  1. User sets common dates in Step 0
  2. If conflicts detected, warning is shown but user can proceed to Step 1
  3. In Step 1, conflicted cars are highlighted with red "Date Conflict" chip
  4. Conflict alert shows within each car's accordion details
  5. User can either:
     - Toggle off "Use Common Data" and set custom dates
     - Adjust dates to avoid conflicts
  6. Cannot proceed past Step 1 until all conflicts are resolved

### 4. Driver Availability Warnings
- **Function**: `checkDriverAvailability()` - checks if enough drivers are available
- **Warning Logic**: 
  - Counts cars requiring drivers (non-self-drive)
  - Compares with available drivers count
  - Shows warning if insufficient drivers
- **Display**: Warning alert in Step 1 (Individual Cars) when driver shortage detected
- **Behavior**: Warning only, does not block progression (admin discretion)

### 5. Customer Data Integration
- **Function**: `fetchCustomerData()` - fetches customer license information
- **Feature**: Disables self-drive option if customer has no driver's license on file
- **UI**: Shows message "Self-drive not available (no driver's license on file)"

### 6. Enhanced Validation

#### Step 0 (Common Details) Validation:
- Start date required
- End date required and must be after start date
- Purpose required
- Delivery location required if delivery service selected
- Detects date conflicts but allows proceeding to fix them

#### Step 1 (Individual Cars) Validation:
- For cars not using common data:
  - Start/end dates required
  - Purpose required
  - Delivery location required if delivery selected
- Driver selection required for non-self-drive cars
- All date conflicts must be resolved
- Driver availability warning (non-blocking)

## UI/UX Improvements

### Step 0: Common Details
- Added conflict warning alert showing which cars have date conflicts
- Added Service Type selection (pickup/delivery)
- Added Delivery Location field for delivery service
- Added Driving Option selection (self-drive/with driver)
- Shows message if self-drive unavailable due to missing license

### Step 1: Individual Cars
- Added driver warning alert at top
- Added date conflict alert listing all conflicted cars
- Each car accordion shows:
  - "Date Conflict" chip if dates unavailable
  - Unavailable periods info box showing maintenance/booking dates
  - Conflict alert with resolution instructions
  - Service Type radio buttons for individual override
  - Delivery Location field when delivery selected
- Visual indicators distinguish conflicted vs normal cars

### Step 2: Car Use Notice
- No changes (terms acceptance)

### Step 3: Review & Confirm
- Properly displays delivery/pickup information
- Shows accurate cost calculations

## Technical Implementation

### State Management
```javascript
const [unavailablePeriods, setUnavailablePeriods] = useState({});
const [dateConflicts, setDateConflicts] = useState([]);
const [driverWarning, setDriverWarning] = useState('');
const [customerData, setCustomerData] = useState(null);
const [hasDriverLicense, setHasDriverLicense] = useState(true);
```

### API Integration
- Fetches unavailable periods: `GET /cars/:carId/unavailable-periods`
- Fetches customer data: `GET /api/customers/me`
- Fetches drivers: `GET /drivers`
- Creates bulk bookings: `POST /bookings/bulk`

### Data Flow
1. Modal opens → Fetch all data (drivers, fees, customer, unavailable periods)
2. User sets common dates → Check conflicts for cars using common data
3. User toggles "Use Common Data" → Copy/clear data and check conflicts
4. User changes individual dates → Check conflicts for that car
5. Validation → Block if required fields missing or conflicts unresolved
6. Submit → Send all bookings with proper delivery/pickup information

## Benefits

1. **Prevents Double Bookings**: Users can't accidentally book unavailable cars
2. **Transparent**: Users see exactly when and why cars are unavailable
3. **Flexible**: Can resolve conflicts per-car or adjust common dates
4. **Driver Management**: Warns when booking more cars than available drivers
5. **Complete Service Options**: Full delivery/pickup configuration per car
6. **Consistent Experience**: Matches single car booking modal functionality

## Testing Recommendations

1. Test with cars having various unavailable periods (bookings, maintenance)
2. Test with insufficient drivers for multiple non-self-drive bookings
3. Test common data → individual data toggle with conflicts
4. Test delivery vs pickup service for both common and individual cars
5. Test validation at each step with various missing data combinations
6. Test with customer having/not having driver's license
7. Test with overlapping unavailable periods across multiple cars
