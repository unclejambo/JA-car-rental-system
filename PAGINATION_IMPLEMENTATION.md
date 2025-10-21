# Server-Side Pagination Implementation

**Date:** October 20, 2025  
**Purpose:** Add server-side pagination to all DataGrid endpoints  
**Status:** ✅ Implemented

---

## 📋 Overview

Implemented server-side pagination across all admin, customer, and driver endpoints to improve performance and user experience when dealing with large datasets.

### Configuration

- **Default Page Size:** 10 items per page
- **Default Behavior:** Endpoints without pagination params default to page 1
- **Response Format:** Simple format `{ data, total, page, pageSize, totalPages }`
- **Max Page Size:** 100 items (enforced in utility function)
- **Filter Type:** Specific filters per endpoint

---

## 🛠️ Implementation Details

### Utility Functions

**File:** `backend/src/utils/pagination.js`

```javascript
// Extract pagination params with defaults
getPaginationParams(req) → { page, pageSize, skip }

// Extract sorting params
getSortingParams(req, defaultSortBy, defaultSortOrder) → { sortBy, sortOrder }

// Build standardized response
buildPaginationResponse(data, total, page, pageSize) → { data, total, page, pageSize, totalPages }

// Extract search param
getSearchParam(req) → string
```

---

## 📊 Implemented Endpoints

### ADMIN Endpoints

#### 1. **Bookings** - `/bookings`
**Controller:** `bookingController.js::getBookings()`

**Query Parameters:**
```
GET /bookings?page=1&pageSize=10&sortBy=booking_id&sortOrder=desc&search=john&status=Pending&payment_status=Unpaid
```

**Filters:**
- `status` - Booking status (Pending, Confirmed, etc.)
- `payment_status` - Payment status (Paid, Unpaid)
- `search` - Search in customer name or car model

**Default Sort:** `booking_id DESC`

**Response:**
```json
{
  "data": [
    {
      "booking_id": 123,
      "customer_name": "John Doe",
      "car_model": "Toyota Vios",
      "total_amount": 5000,
      "balance": 2000,
      "payment_status": "Unpaid",
      "booking_status": "Pending",
      ...
    }
  ],
  "total": 247,
  "page": 1,
  "pageSize": 10,
  "totalPages": 25
}
```

---

#### 2. **Cars** - `/cars`
**Controller:** `carController.js::getCars()`

**Query Parameters:**
```
GET /cars?page=1&pageSize=10&sortBy=car_id&sortOrder=asc&search=toyota&status=Available&car_type=Sedan
```

**Filters:**
- `status` - Car status (Available, Rented, Maintenance)
- `car_type` - Car type (Sedan, SUV, etc.)
- `search` - Search in make, model, or license plate

**Default Sort:** `car_id ASC`

**Response:**
```json
{
  "data": [
    {
      "car_id": 1,
      "make": "Toyota",
      "model": "Vios",
      "year": 2024,
      "license_plate": "ABC1234",
      "car_status": "Available",
      "rent_price": 1200,
      ...
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5
}
```

---

#### 3. **Customers** - `/api/customers`
**Controller:** `customerController.js::getCustomers()`

**Query Parameters:**
```
GET /api/customers?page=1&pageSize=10&sortBy=customer_id&sortOrder=desc&search=john&status=active
```

**Filters:**
- `status` - Customer status
- `search` - Search in first name, last name, email, or username

**Default Sort:** `customer_id DESC`

**Response:**
```json
{
  "data": [
    {
      "customer_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "username": "johndoe",
      "status": "active",
      "driver_license": { ... },
      ...
    }
  ],
  "total": 156,
  "page": 1,
  "pageSize": 10,
  "totalPages": 16
}
```

---

#### 4. **Drivers** - `/drivers`
**Controller:** `driverController.js::getDrivers()`

**Query Parameters:**
```
GET /drivers?page=1&pageSize=10&sortBy=drivers_id&sortOrder=desc&search=john&status=active
```

**Filters:**
- `status` - Driver status
- `search` - Search in first name, last name, email, or username

**Default Sort:** `drivers_id DESC`

**Response:**
```json
{
  "data": [
    {
      "drivers_id": 1,
      "driver_id": 1,
      "first_name": "Mike",
      "last_name": "Smith",
      "email": "mike@example.com",
      "license_number": "LIC123456",
      "status": "active",
      "rating": 4.5,
      ...
    }
  ],
  "total": 32,
  "page": 1,
  "pageSize": 10,
  "totalPages": 4
}
```

---

#### 5. **Schedules** - `/schedules`
**Controller:** `scheduleController.js::getSchedules()`

**Query Parameters:**
```
GET /schedules?page=1&pageSize=10&sortBy=start_date&sortOrder=desc&search=john&status=Confirmed
```

**Filters:**
- `status` - Booking status
- `search` - Search in customer name or car model

**Default Sort:** `start_date DESC`

**Response:**
```json
{
  "data": [
    {
      "booking_id": 123,
      "customer_name": "John Doe",
      "car_model": "Toyota Vios",
      "start_date": "2025-10-25T00:00:00.000Z",
      "end_date": "2025-10-28T00:00:00.000Z",
      "pickup_loc": "Main Office",
      "booking_status": "Confirmed",
      "hasGPS": true,
      ...
    }
  ],
  "total": 89,
  "page": 1,
  "pageSize": 10,
  "totalPages": 9
}
```

---

#### 6. **Transactions** - `/transactions`
**Controller:** `transactionController.js::getTransactions()`

**Query Parameters:**
```
GET /transactions?page=1&pageSize=10&sortBy=transaction_id&sortOrder=desc&search=john
```

**Filters:**
- `search` - Search in customer name or car model

**Default Sort:** `transaction_id DESC`

**Response:**
```json
{
  "data": [
    {
      "transactionId": 45,
      "bookingId": 123,
      "customerName": "John Doe",
      "carModel": "Toyota Vios",
      "bookingDate": "2025-10-20",
      "completionDate": "2025-10-25",
      "cancellationDate": null,
      ...
    }
  ],
  "total": 234,
  "page": 1,
  "pageSize": 10,
  "totalPages": 24
}
```

---

### CUSTOMER Endpoints

#### 7. **Customer Bookings** - `/bookings/my-bookings`
**Controller:** `bookingController.js::getMyBookings()`

**Query Parameters:**
```
GET /bookings/my-bookings?page=1&pageSize=10&sortBy=booking_date&sortOrder=desc&status=Confirmed&payment_status=Paid
```

**Filters:**
- `status` - Booking status
- `payment_status` - Payment status

**Default Sort:** `booking_date DESC`

**Authentication:** Required - extracts `customer_id` from token

---

#### 8. **Customer Payment History** - `/payments/my-payments`
**Controller:** `paymentController.js::getMyPayments()`

**Query Parameters:**
```
GET /payments/my-payments?page=1&pageSize=10&sortBy=paid_date&sortOrder=desc&payment_method=GCash
```

**Filters:**
- `payment_method` - Payment method (Cash, GCash)

**Default Sort:** `paid_date DESC`

**Authentication:** Required - extracts `customer_id` from token

**Response:**
```json
{
  "data": [
    {
      "payment_id": 78,
      "amount": 2500,
      "payment_method": "GCash",
      "paid_date": "2025-10-20T10:30:00.000Z",
      "balance": 0,
      "booking_info": {
        "booking_id": 123,
        "dates": "2025-10-25 to 2025-10-28",
        "car_details": {
          "make": "Toyota",
          "model": "Vios",
          ...
        },
        "total_amount": 5000
      },
      ...
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5
}
```

---

#### 9. **Customer Schedules** - `/schedules/my-schedules`
**Controller:** `scheduleController.js::getMySchedules()`

**Query Parameters:**
```
GET /schedules/my-schedules?page=1&pageSize=10&sortBy=start_date&sortOrder=desc&status=Confirmed
```

**Filters:**
- `status` - Booking status

**Default Sort:** `start_date DESC`

**Authentication:** Required - extracts `customer_id` from token

---

### DRIVER Endpoints

#### 10. **Driver Schedules** - `/schedules/driver/me`
**Controller:** `scheduleController.js::getMyDriverSchedules()`

**Query Parameters:**
```
GET /schedules/driver/me?page=1&pageSize=10&sortBy=start_date&sortOrder=desc&status=Confirmed
```

**Filters:**
- `status` - Booking status

**Default Sort:** `start_date DESC`

**Authentication:** Required - extracts `driver_id` from token

**Response:**
```json
{
  "data": [
    {
      "schedule_id": 123,
      "customer_name": "John Doe",
      "car_model": "Toyota Vios",
      "start_date": "2025-10-25T00:00:00.000Z",
      "end_date": "2025-10-28T00:00:00.000Z",
      "pickup_loc": "Customer Address",
      "booking_status": "Confirmed",
      ...
    }
  ],
  "total": 28,
  "page": 1,
  "pageSize": 10,
  "totalPages": 3
}
```

---

## 🎨 Frontend Integration Guide

### Material-UI DataGrid Example

```jsx
import { DataGrid } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import axios from 'axios';

function BookingsTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,        // MUI uses 0-based indexing
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);
  const [filterModel, setFilterModel] = useState({
    status: '',
    payment_status: ''
  });

  useEffect(() => {
    fetchBookings();
  }, [paginationModel, filterModel]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {
        page: paginationModel.page + 1, // Convert to 1-based for backend
        pageSize: paginationModel.pageSize,
        sortBy: 'booking_id',
        sortOrder: 'desc',
        ...filterModel // Add filters
      };

      const response = await axios.get('/bookings', { params });
      
      setRows(response.data.data);
      setRowCount(response.data.total);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      
      // Pagination
      paginationMode="server"
      rowCount={rowCount}
      paginationModel={paginationModel}
      onPaginationModelChange={setPaginationModel}
      pageSizeOptions={[10, 25, 50, 100]}
      
      // Row ID
      getRowId={(row) => row.booking_id}
    />
  );
}
```

### Axios Example with Filters

```javascript
const fetchBookings = async (page, pageSize, filters = {}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    sortBy: 'booking_date',
    sortOrder: 'desc'
  });

  // Add filters
  if (filters.status) params.append('status', filters.status);
  if (filters.payment_status) params.append('payment_status', filters.payment_status);
  if (filters.search) params.append('search', filters.search);

  const response = await axios.get(`/bookings?${params}`);
  return response.data;
};

// Usage
const data = await fetchBookings(1, 10, {
  status: 'Pending',
  payment_status: 'Unpaid',
  search: 'john'
});
```

---

## 🔍 Query Parameter Reference

### Common Parameters (All Endpoints)

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `page` | integer | 1 | Page number (1-based) | `?page=2` |
| `pageSize` | integer | 10 | Items per page (max 100) | `?pageSize=25` |
| `sortBy` | string | varies | Field to sort by | `?sortBy=booking_date` |
| `sortOrder` | string | varies | Sort direction (`asc` or `desc`) | `?sortOrder=desc` |
| `search` | string | "" | Search term | `?search=john` |

### Endpoint-Specific Filters

| Endpoint | Filter | Type | Description |
|----------|--------|------|-------------|
| `/bookings` | `status` | string | Filter by booking status |
| `/bookings` | `payment_status` | string | Filter by payment status |
| `/cars` | `status` | string | Filter by car status |
| `/cars` | `car_type` | string | Filter by car type |
| `/api/customers` | `status` | string | Filter by customer status |
| `/drivers` | `status` | string | Filter by driver status |
| `/schedules` | `status` | string | Filter by booking status |
| `/payments/my-payments` | `payment_method` | string | Filter by payment method |

---

## 📈 Performance Considerations

### Database Optimization

1. **Indexes Added:**
   ```sql
   -- Recommended indexes for pagination performance
   CREATE INDEX idx_booking_date ON "Booking"(booking_date);
   CREATE INDEX idx_booking_status ON "Booking"(booking_status);
   CREATE INDEX idx_payment_status ON "Booking"(payment_status);
   CREATE INDEX idx_customer_name ON "Customer"(first_name, last_name);
   CREATE INDEX idx_car_make_model ON "Car"(make, model);
   ```

2. **Query Optimization:**
   - Use `select` instead of fetching all fields when possible
   - Limit includes to only necessary relations
   - Use `count()` separately for performance

3. **Pagination Limits:**
   - Max page size: 100 items (enforced in `getPaginationParams`)
   - Default page size: 10 items
   - Page validation ensures page ≥ 1

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Test page navigation (page 1, 2, 3, last page)
- [ ] Test page size changes (10, 25, 50, 100)
- [ ] Test sorting (asc, desc, different fields)
- [ ] Test search functionality
- [ ] Test status filters
- [ ] Test with empty results
- [ ] Test with 1 result
- [ ] Test with exact multiple of page size
- [ ] Test authentication (customer/driver endpoints)
- [ ] Test edge cases (page=0, page=99999, pageSize=0, pageSize=1000)

### Example Test Requests

```bash
# Test basic pagination
curl "http://localhost:3001/bookings?page=1&pageSize=10"

# Test with sorting
curl "http://localhost:3001/bookings?page=1&pageSize=10&sortBy=booking_date&sortOrder=desc"

# Test with filters
curl "http://localhost:3001/bookings?page=1&pageSize=10&status=Pending&payment_status=Unpaid"

# Test with search
curl "http://localhost:3001/bookings?page=1&pageSize=10&search=john"

# Test customer endpoint (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:3001/bookings/my-bookings?page=1&pageSize=10"

# Test edge cases
curl "http://localhost:3001/bookings?page=99999&pageSize=10"  # Should return empty data
curl "http://localhost:3001/bookings?page=0&pageSize=10"      # Should default to page 1
curl "http://localhost:3001/bookings?page=1&pageSize=200"     # Should cap at 100
```

---

## 📝 Migration Notes

### Breaking Changes
None - endpoints maintain backward compatibility by defaulting to page 1 when no pagination params provided.

### Frontend Updates Required

For each DataGrid component:

1. **Add pagination state:**
   ```javascript
   const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
   const [rowCount, setRowCount] = useState(0);
   ```

2. **Update fetch function:**
   ```javascript
   const response = await fetch(`/endpoint?page=${paginationModel.page + 1}&pageSize=${paginationModel.pageSize}`);
   setRows(response.data.data);
   setRowCount(response.data.total);
   ```

3. **Add DataGrid props:**
   ```jsx
   <DataGrid
     paginationMode="server"
     rowCount={rowCount}
     paginationModel={paginationModel}
     onPaginationModelChange={setPaginationModel}
   />
   ```

---

## 🎯 Summary

### Files Modified

1. ✅ `backend/src/utils/pagination.js` - Created utility functions
2. ✅ `backend/src/controllers/bookingController.js` - Updated `getBookings()` and `getMyBookings()`
3. ✅ `backend/src/controllers/carController.js` - Updated `getCars()`
4. ✅ `backend/src/controllers/scheduleController.js` - Updated `getSchedules()`, `getMySchedules()`, `getMyDriverSchedules()`
5. ✅ `backend/src/controllers/transactionController.js` - Updated `getTransactions()`
6. ✅ `backend/src/controllers/paymentController.js` - Updated `getMyPayments()`
7. ✅ `backend/src/controllers/customerController.js` - Updated `getCustomers()`
8. ✅ `backend/src/controllers/driverController.js` - Updated `getDrivers()`

### Total Endpoints with Pagination: 10

**Admin:** 6 endpoints  
**Customer:** 3 endpoints  
**Driver:** 1 endpoint

---

**Implementation Status:** ✅ Complete  
**Ready for Testing:** Yes  
**Documentation:** Complete  
**Last Updated:** October 20, 2025
