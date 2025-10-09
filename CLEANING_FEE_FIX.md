# Cleaning Fee and Stain Removal Fee - Issue Analysis and Fix

## Problem Identified

The cleaning fee and stain removal fee were not showing up in the total fees calculation due to several issues:

### 1. **Frontend Boolean Handling Issue**

- The RadioGroup for the "Clean" field was using boolean values (`true`/`false`) as value attributes
- When these values are processed by the form, they come as strings (`"true"`/`"false"`) instead of actual booleans
- The backend logic was checking for actual boolean `false`, but receiving the string `"false"`

### 2. **Backend Boolean Comparison Issue**

- The backend was only checking `if (!isClean)` which fails when `isClean` is the string `"false"`
- Need to handle both boolean and string representations

## Fixes Implemented

### 1. **Frontend Fix - Enhanced `handleInputChange`**

```javascript
const handleInputChange = (e) => {
  const { name, value, type, checked } = e.target;

  let processedValue = value;

  // Handle different input types
  if (type === "checkbox") {
    processedValue = checked;
  } else if (name === "isClean") {
    // Convert string boolean to actual boolean for isClean
    processedValue = value === "true";
  } else {
    processedValue = value;
  }

  setFormData((prev) => ({
    ...prev,
    [name]: processedValue,
  }));
};
```

### 2. **Backend Fix - Robust Boolean Handling**

```javascript
// Cleaning fee calculation
// Handle both boolean and string values for isClean
const isNotClean = isClean === false || isClean === "false";
const hasStainValue = hasStain === true || hasStain === "true";

if (isNotClean) {
  calculatedFees.cleaningFee = feesObject.cleaning_fee || 0;
  if (hasStainValue) {
    calculatedFees.cleaningFee += feesObject.stain_removal_fee || 0;
  }
}
```

### 3. **Added Comprehensive Debug Logging**

```javascript
// Debug: Log the received values
console.log("Calculate fees - Received values:", {
  gasLevel,
  damageStatus,
  equipmentStatus,
  equip_others,
  isClean: isClean,
  isCleanType: typeof isClean,
  hasStain: hasStain,
  hasStainType: typeof hasStain,
});

// Debug: Log available fees
console.log("Available fees:", feesObject);

// Debug: Log cleaning fee calculation
console.log("Cleaning fee calculation:", {
  isClean,
  isNotClean,
  hasStain,
  hasStainValue,
  cleaning_fee: feesObject.cleaning_fee,
  stain_removal_fee: feesObject.stain_removal_fee,
});

// Debug: Log final calculated fees
console.log("Final calculated fees:", calculatedFees);
```

### 4. **Added Test Endpoint**

Created `/returns/test-cleaning` endpoint to test the cleaning fee calculation logic independently.

## Required Database Setup

Ensure the following entries exist in the ManageFees table:

- `cleaning_fee` (default: 200)
- `stain_removal_fee` (default: 500)

Use the initialization endpoint if needed:

```bash
POST /manage-fees/initialize
```

## Testing the Fix

### 1. **Frontend Testing**

- Select "No" for Clean status
- Check if "Stain" checkbox appears
- Verify that cleaning fees appear in the right panel
- Test both with and without stain selected

### 2. **Backend Testing**

Use the test endpoint:

```bash
POST /returns/test-cleaning
Content-Type: application/json

{
  "isClean": false,
  "hasStain": true
}
```

Expected response should show calculated cleaning fee = cleaning_fee + stain_removal_fee.

### 3. **Debug Information**

Check the backend console logs for:

- Received values and their types
- Available fees from database
- Cleaning fee calculation steps
- Final calculated fees

## Expected Behavior After Fix

### When "Clean: Yes" is selected:

- `isClean = true`
- No cleaning fee applied
- Cleaning fee shows as 0 in total

### When "Clean: No" is selected (without stain):

- `isClean = false`, `hasStain = false`
- Cleaning fee = `cleaning_fee` from database (default: 200)
- Shows in fee breakdown and adds to total

### When "Clean: No" is selected (with stain checked):

- `isClean = false`, `hasStain = true`
- Cleaning fee = `cleaning_fee + stain_removal_fee` (default: 200 + 500 = 700)
- Shows in fee breakdown and adds to total

## Files Modified

### Backend

- `backend/src/controllers/returnController.js` - Enhanced boolean handling and debug logging
- `backend/src/routes/returnRoutes.js` - Added test endpoint

### Frontend

- `frontend/src/ui/components/modal/ReturnModal.jsx` - Fixed handleInputChange for proper boolean conversion

The cleaning fee and stain removal fee should now properly calculate and display in the total amount.
