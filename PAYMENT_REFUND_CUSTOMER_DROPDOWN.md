# Payment & Refund Modals - Customer Name Dropdown

## Update Summary

Changed customer name input from text field to dropdown select in both Add Payment and Add Refund modals.

## Changes Made

### 1. AddPaymentModal.jsx

**Before:**

```jsx
<TextField
  label="Customer Name"
  name="customerName"
  value={formData.customerName}
  onChange={handleInputChange}
  placeholder="e.g., Juan Dela Cruz"
  helperText="Type exact full name (First Last)"
/>
```

**After:**

```jsx
<TextField
  select
  label="Customer Name"
  name="customerName"
  value={formData.customerName}
  onChange={handleInputChange}
  helperText="Select a customer from the list"
>
  {customers.map((customer) => (
    <MenuItem
      key={customer.customer_id}
      value={`${customer.first_name} ${customer.last_name}`}
    >
      {customer.first_name} {customer.last_name}
    </MenuItem>
  ))}
</TextField>
```

### 2. AddRefundModal.jsx

**Before:**

```jsx
<TextField
  label="Customer Name"
  name="customerName"
  value={formData.customerName}
  onChange={handleInputChange}
  placeholder="e.g., Juan Dela Cruz"
  helperText="Type exact full name (First Last)"
/>
```

**After:**

```jsx
<TextField
  select
  label="Customer Name"
  name="customerName"
  value={formData.customerName}
  onChange={handleInputChange}
  helperText="Select a customer from the list"
>
  {customers.map((customer) => (
    <MenuItem
      key={customer.customer_id}
      value={`${customer.first_name} ${customer.last_name}`}
    >
      {customer.first_name} {customer.last_name}
    </MenuItem>
  ))}
</TextField>
```

## Features

### Loading States

Shows appropriate messages while loading:

```jsx
{
  customers.length === 0 && loadingData && (
    <MenuItem value="" disabled>
      Loading customers...
    </MenuItem>
  );
}
```

### Empty State

Shows message when no customers are available:

```jsx
{
  customers.length === 0 && !loadingData && (
    <MenuItem value="" disabled>
      No customers found
    </MenuItem>
  );
}
```

### Customer List

All customers loaded from the API are displayed in alphabetical order by first name:

```jsx
{
  customers.map((customer) => (
    <MenuItem
      key={customer.customer_id}
      value={`${customer.first_name} ${customer.last_name}`}
    >
      {customer.first_name} {customer.last_name}
    </MenuItem>
  ));
}
```

## Benefits

### 1. **Improved User Experience**

✅ No typing errors
✅ No need to remember exact spelling
✅ Faster selection
✅ See all available customers at once

### 2. **Better Data Accuracy**

✅ Exact name matching guaranteed
✅ No case sensitivity issues
✅ No extra spaces issues
✅ Always resolves to valid customer

### 3. **Easier for Admins**

✅ Can browse customer list
✅ No need to check spelling
✅ Immediate visual feedback
✅ Works on mobile/tablet

## User Flow

### Add Payment Modal

1. Open Add Payment modal
2. Click on "Customer Name" dropdown
3. See list of all customers loading
4. Select customer from list
5. Booking dropdown automatically filters for selected customer
6. Continue with payment details

### Add Refund Modal

1. Open Add Refund modal
2. Click on "Customer Name" dropdown
3. See list of all customers loading
4. Select customer from list
5. Booking dropdown automatically filters for selected customer
6. Continue with refund details

## Technical Details

### Data Structure

Each MenuItem displays the customer's full name but stores it in the same format as before:

```javascript
value={`${customer.first_name} ${customer.last_name}`}
```

### Customer Resolution

The existing `findCustomerByName` function still works:

```javascript
const findCustomerByName = (full) => {
  const t = full.trim().toLowerCase();
  return customers.find(
    (c) => `${c.first_name} ${c.last_name}`.toLowerCase() === t
  );
};
```

When a customer is selected from the dropdown, the `onChange` handler:

1. Sets the customer name
2. Finds the customer by name
3. Sets the customer ID
4. Updates booking options for that customer

### Validation

Schema validation remains unchanged - still requires:

- Customer name to be non-empty
- Customer ID to be resolved (positive number)
- Booking to be selected

## Testing Checklist

- [ ] Open Add Payment modal
- [ ] Verify customer dropdown loads
- [ ] Select a customer from dropdown
- [ ] Verify bookings filter for that customer
- [ ] Complete payment creation
- [ ] Open Add Refund modal
- [ ] Verify customer dropdown loads
- [ ] Select a customer from dropdown
- [ ] Verify bookings filter for that customer
- [ ] Complete refund creation
- [ ] Test with no customers (empty state)
- [ ] Test while loading (loading state)

## Notes

- The dropdown is disabled while customer data is loading
- Helper text updated from "Type exact full name" to "Select a customer from the list"
- All existing validation and error handling remains intact
- No changes to backend API required
- No changes to form submission logic required
