# SearchBar Component Documentation

## Overview

A reusable search bar component built with Material-UI that can be used across admin, customer, and driver pages in the JA Car Rental System.

## Component Location

```
frontend/src/ui/components/SearchBar.jsx
```

## Features

- ✅ Material-UI integration
- ✅ Customizable placeholder text
- ✅ Clear button functionality
- ✅ Responsive design
- ✅ Keyboard accessible
- ✅ Multiple size variants
- ✅ Full width support
- ✅ Custom styling via sx prop
- ✅ Dark mode support

## Props

| Prop              | Type     | Default       | Description                                                      |
| ----------------- | -------- | ------------- | ---------------------------------------------------------------- |
| `value`           | string   | `''`          | Current search value (controlled component)                      |
| `onChange`        | function | **required**  | Callback function when search value changes                      |
| `placeholder`     | string   | `'Search...'` | Placeholder text for the search input                            |
| `variant`         | string   | `'outlined'`  | Material-UI TextField variant ('outlined', 'filled', 'standard') |
| `size`            | string   | `'small'`     | Size of the search bar ('small', 'medium')                       |
| `className`       | string   | `''`          | Additional CSS classes                                           |
| `fullWidth`       | boolean  | `false`       | Whether the search bar should take full width                    |
| `showClearButton` | boolean  | `true`        | Whether to show clear button when input has value                |
| `sx`              | object   | `{}`          | Material-UI sx prop for custom styling                           |
| `disabled`        | boolean  | `false`       | Whether the search bar is disabled                               |
| `autoFocus`       | boolean  | `false`       | Whether to auto-focus the input on mount                         |

## Basic Usage

### 1. Import the Component

```jsx
import SearchBar from "../../ui/components/SearchBar";
```

### 2. Add State Management

```jsx
const [searchQuery, setSearchQuery] = useState("");
```

### 3. Implement Search Handler

```jsx
const handleSearchChange = (event) => {
  setSearchQuery(event.target.value);
};
```

### 4. Use the Component

```jsx
<SearchBar
  value={searchQuery}
  onChange={handleSearchChange}
  placeholder="Search cars..."
/>
```

## Examples

### Example 1: Customer Cars Page - Search by Car Model

```jsx
import { useState, useEffect } from "react";
import SearchBar from "../../ui/components/SearchBar";
import { Box } from "@mui/material";

function CustomerCars() {
  const [cars, setCars] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Filter cars based on search query
  const filteredCars = cars.filter((car) => {
    const query = searchQuery.toLowerCase();
    return (
      car.car_model?.toLowerCase().includes(query) ||
      car.car_brand?.toLowerCase().includes(query) ||
      car.car_plate_no?.toLowerCase().includes(query)
    );
  });

  return (
    <Box>
      <Box sx={{ mb: 3, maxWidth: 400 }}>
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by model, brand, or plate..."
          fullWidth
        />
      </Box>

      {/* Render filtered cars */}
      <div className="cars-grid">
        {filteredCars.map((car) => (
          <CarCard key={car.car_id} car={car} />
        ))}
      </div>
    </Box>
  );
}
```

### Example 2: Admin Booking Page - Search by Customer Name

```jsx
import { useState } from "react";
import SearchBar from "../../ui/components/SearchBar";
import { Box, Typography } from "@mui/material";

function AdminBookingPage() {
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Filter bookings based on search query
  const filteredBookings = bookings.filter((booking) => {
    const query = searchQuery.toLowerCase();
    return (
      booking.customer_name?.toLowerCase().includes(query) ||
      booking.booking_id?.toString().includes(query) ||
      booking.car_model?.toLowerCase().includes(query)
    );
  });

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Manage Bookings
      </Typography>

      <SearchBar
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Search bookings by customer, ID, or car..."
        size="medium"
        sx={{ mb: 3, maxWidth: 500 }}
      />

      {/* Render filtered bookings table */}
      <BookingsTable bookings={filteredBookings} />
    </Box>
  );
}
```

### Example 3: Admin User Management - Search with Debouncing

```jsx
import { useState, useEffect, useCallback } from "react";
import SearchBar from "../../ui/components/SearchBar";
import { Box } from "@mui/material";

function AdminManageUser() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Filter users based on debounced query
  const filteredUsers = users.filter((user) => {
    const query = debouncedQuery.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.contact_no?.includes(query)
    );
  });

  return (
    <Box>
      <SearchBar
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Search users by name, email, or phone..."
        fullWidth
        autoFocus
      />

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found
      </Typography>

      {/* Render filtered users */}
      <UsersTable users={filteredUsers} />
    </Box>
  );
}
```

### Example 4: Customer Booking History - Search with Multiple Filters

```jsx
import { useState } from "react";
import SearchBar from "../../ui/components/SearchBar";
import { Box, Stack, Chip } from "@mui/material";

function CustomerBookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Filter bookings by search query and status
  const filteredBookings = bookings.filter((booking) => {
    // Status filter
    if (statusFilter !== "all" && booking.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        booking.car_model?.toLowerCase().includes(query) ||
        booking.booking_id?.toString().includes(query) ||
        booking.pickup_location?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search your bookings..."
          sx={{ flexGrow: 1, maxWidth: 400 }}
        />

        <Stack direction="row" spacing={1}>
          <Chip
            label="All"
            onClick={() => setStatusFilter("all")}
            color={statusFilter === "all" ? "primary" : "default"}
          />
          <Chip
            label="Active"
            onClick={() => setStatusFilter("active")}
            color={statusFilter === "active" ? "primary" : "default"}
          />
          <Chip
            label="Completed"
            onClick={() => setStatusFilter("completed")}
            color={statusFilter === "completed" ? "primary" : "default"}
          />
        </Stack>
      </Stack>

      {/* Render filtered bookings */}
      <BookingsList bookings={filteredBookings} />
    </Box>
  );
}
```

### Example 5: Custom Styling

```jsx
<SearchBar
  value={searchQuery}
  onChange={handleSearchChange}
  placeholder="Search..."
  variant="outlined"
  size="medium"
  fullWidth
  sx={{
    maxWidth: 600,
    "& .MuiOutlinedInput-root": {
      borderRadius: 3,
      backgroundColor: "#f5f5f5",
    },
  }}
/>
```

### Example 6: Disabled State

```jsx
<SearchBar
  value={searchQuery}
  onChange={handleSearchChange}
  placeholder="Search not available..."
  disabled={isLoading}
/>
```

## Advanced Features

### Real-time API Search

```jsx
const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState([]);
const [isSearching, setIsSearching] = useState(false);

useEffect(() => {
  const searchAPI = async () => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const debounceTimer = setTimeout(searchAPI, 500);
  return () => clearTimeout(debounceTimer);
}, [searchQuery]);

return (
  <SearchBar
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search..."
    disabled={isSearching}
  />
);
```

### Case-Insensitive Multi-Field Search

```jsx
const filterItems = (items, query) => {
  if (!query) return items;

  const lowerQuery = query.toLowerCase();

  return items.filter((item) => {
    // Define searchable fields
    const searchFields = [
      item.name,
      item.email,
      item.phone,
      item.description,
      item.id?.toString(),
    ];

    // Check if any field matches
    return searchFields.some((field) =>
      field?.toLowerCase().includes(lowerQuery)
    );
  });
};

const filteredItems = filterItems(items, searchQuery);
```

## Accessibility Features

- ✅ ARIA labels for screen readers
- ✅ Keyboard navigation support (Tab, Enter, Escape)
- ✅ Clear button with proper aria-label
- ✅ Focus management
- ✅ High contrast support

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## Notes

- The component is a controlled component, so you must manage the state in the parent component
- Use debouncing for performance when searching large datasets
- Consider adding loading indicators for API searches
- The clear button only appears when there is text in the input

## Styling Guidelines

- Use the `sx` prop for custom styling
- Follow Material-UI theming for consistency
- The component respects dark mode settings
- Use `maxWidth` to prevent the search bar from being too wide on large screens

## Best Practices

1. **Always provide a meaningful placeholder** - Help users understand what they can search for
2. **Implement debouncing** - For large datasets or API calls, debounce the search to improve performance
3. **Show search result counts** - Let users know how many results were found
4. **Clear search on navigation** - Reset search state when users navigate to different sections
5. **Handle empty states** - Show appropriate messages when no results are found
6. **Mobile optimization** - Use `fullWidth` prop on mobile devices for better UX

## Troubleshooting

### Search not working?

- Ensure you're passing the correct `onChange` handler
- Check that the value prop is connected to your state
- Verify your filter logic is correct

### Styling issues?

- Check that the CSS file is properly imported
- Use browser DevTools to inspect the element
- Ensure Material-UI theme is properly configured

### Performance issues?

- Implement debouncing for searches
- Consider pagination for large datasets
- Use React.memo() for list items to prevent unnecessary re-renders

## Future Enhancements

- [ ] Add voice search support
- [ ] Add search history/suggestions
- [ ] Add autocomplete functionality
- [ ] Add advanced filter dropdown
- [ ] Add keyboard shortcuts (e.g., Ctrl+K to focus)
