# Return Modal Implementation

## Overview

The Return Modal has been fully implemented and wired to the database with all the requested functionality.

## Features Implemented

### 1. Gas Level Comparison

- Values: High=3, Mid=2, Low=1
- Compares gas level to release gas level
- Calculates difference and multiplies by `gas_level_fee` from ManageFees table
- Reflects fee in total on the right side of modal

### 2. Odometer

- Input field for odometer reading
- When return button is clicked, this replaces the car's mileage in database

### 3. Equipment Check

- Displays `equip_others` from release for comparison
- Comparison triggers when equipment status is 'No' and there's input in return modal
- Matches word by word (separated by comma)
- If equipment doesn't match, counts missing items and multiplies by `equipment_loss_fee`
- Reflects fee in total

### 4. Damage Check

- Displays front, back, right, left images from release table
- Images are clickable and zoom in (close button returns to normal)
- When major/minor radio button is selected, file input appears for damage image
- Images stored in `/uploads/licenses/return_images/`
- File format: `{date}_booking_id_customer_name_(major/minor).jpg`
- Minor damage: adds `damage_fee` from ManageFees
- Major damage: adds `damage_fee * 3` from ManageFees

### 5. Clean Check

- Radio buttons: Yes and No
- If 'Yes': no cleaning fee
- If 'No': shows Stain checkbox
  - Without stain: adds `cleaning_fee`
  - With stain: adds `cleaning_fee + stain_removal_fee`

### 6. Total Amount Calculation

- Sums all applicable fees
- Adds to booking total_amount
- If not paid directly, adds to balance and sets payment_status to 'Unpaid'
- If paid directly, shows payment form with same structure as booking details

### 7. Return Submission

- Sets `isReturned` to TRUE
- Sets `booking_status` to 'Completed'
- Updates car mileage with odometer reading

## API Endpoints

### Backend Routes (`/returns`)

- `GET /:bookingId` - Get return data for booking
- `POST /:bookingId/calculate-fees` - Calculate return fees dynamically
- `POST /:bookingId/upload-damage-image` - Upload damage images
- `POST /:bookingId` - Submit return form

## Database Changes

### ManageFees Table Required Entries

Make sure the following fee types exist in the ManageFees table:

- `gas_level_fee`
- `equipment_loss_fee`
- `damage_fee`
- `cleaning_fee`
- `stain_removal_fee`

### Return Table

Uses existing Return table with proper mappings for:

- `damage_check` (damage status)
- `damage_img` (damage image path)
- `equipment` (equipment status)
- `gas_level` (return gas level)
- `odometer` (final odometer reading)
- `total_fee` (calculated fees)
- `damage` (enum: No_Damage, Minor, Major)

## Usage

### Frontend Integration

```jsx
import ReturnModal from "../../ui/components/modal/ReturnModal.jsx";

// In component
const [showReturnModal, setShowReturnModal] = useState(false);
const [selectedBookingId, setSelectedBookingId] = useState(null);

// Open modal
const handleReturnClick = (booking) => {
  setSelectedBookingId(booking.booking_id);
  setShowReturnModal(true);
};

// Render modal
{
  showReturnModal && (
    <ReturnModal
      show={showReturnModal}
      onClose={() => setShowReturnModal(false)}
      bookingId={selectedBookingId}
    />
  );
}
```

## Files Modified/Created

### Backend

- `backend/src/controllers/returnController.js` - Main return logic
- `backend/src/routes/returnRoutes.js` - Return API routes
- `backend/src/index.js` - Added return routes

### Frontend

- `frontend/src/ui/components/modal/ReturnModal.jsx` - Complete modal implementation
- `frontend/src/utils/api.js` - Added return API functions
- `frontend/src/pages/admin/AdminSchedulePage.jsx` - Updated to pass bookingId

## Testing

1. Ensure database has required ManageFees entries
2. Test with a booking that has release data
3. Try different combinations of gas level, equipment, damage, and cleaning status
4. Verify fee calculations are correct
5. Test payment flow for both direct payment and unpaid scenarios
6. Confirm booking status updates correctly after submission

## Notes

- Modal includes responsive design for mobile devices
- Error handling and loading states implemented
- Image upload supports standard image formats
- Payment form matches existing booking payment structure
- All fee calculations are done server-side for security
