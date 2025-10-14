# CustomerBookingHistory Page - SearchBar Visual Guide

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
└─────────────────────────────────────────────────────────────┘
┌─────────┬───────────────────────────────────────────────────┐
│         │                                                   │
│ Sidebar │  📋 Booking History                    [Refresh]  │
│         │  View your past bookings and payments            │
│         │                                                   │
│         │  ┌──────────────────────────────────────────────┐│
│         │  │ [Bookings History (5)] [Payments History (8)]││
│         │  └──────────────────────────────────────────────┘│
│         │                                                   │
│         │  ┌──────────────────────────────────────────────┐│
│         │  │ 🔍 Search bookings by ID, car model...      │││
│         │  └──────────────────────────────────────────────┘│
│         │  3 bookings found                                │
│         │                                                   │
│         │  ┌──────────────────────────────────────────────┐│
│         │  │           BOOKING HISTORY TABLE              ││
│         │  │                                              ││
│         │  │ ID    Date      Car      Status     Amount  ││
│         │  │ ─────────────────────────────────────────── ││
│         │  │ 123   Oct 10    Toyota   Paid      ₱5,000  ││
│         │  │ 124   Oct 11    Honda    Unpaid    ₱4,500  ││
│         │  │ 125   Oct 12    Nissan   Paid      ₱6,000  ││
│         │  │                                              ││
│         │  └──────────────────────────────────────────────┘│
│         │                                                   │
└─────────┴───────────────────────────────────────────────────┘
```

## Search Bar Features

### Booking History Tab Search Bar

```
┌────────────────────────────────────────────────────────┐
│ 🔍 Search bookings by ID, car model, status, or...  ✕ │
└────────────────────────────────────────────────────────┘
     ↑                                                  ↑
  Search Icon                                    Clear Button
```

**Searchable Fields:**

- 🔢 Booking ID
- 🚗 Car Model
- ✅ Status (Paid/Unpaid)
- 📅 Start Date
- 📅 End Date

**Example Searches:**

- "123" → Finds booking #123
- "toyota" → Finds all Toyota bookings
- "paid" → Finds all paid bookings
- "2025-10" → Finds October 2025 bookings

### Payment History Tab Search Bar

```
┌────────────────────────────────────────────────────────┐
│ 🔍 Search payments by transaction ID, description... ✕ │
└────────────────────────────────────────────────────────┘
```

**Searchable Fields:**

- 🔢 Transaction ID
- 📝 Description
- 💳 Payment Method (Cash, GCash, etc.)
- 📄 Reference Number
- ✅ Status (Paid/Unpaid)

**Example Searches:**

- "PAY-123" → Finds payment with ID PAY-123
- "gcash" → Finds all GCash payments
- "booking payment" → Finds payments with "booking payment" in description
- "REF-456" → Finds payment with reference REF-456

## Interactive States

### 1. Initial State (No Search)

```
┌──────────────────────────────────────────────┐
│ 🔍 Search bookings by ID, car model...      │
└──────────────────────────────────────────────┘

Showing all 10 bookings
```

### 2. Active Search State

```
┌──────────────────────────────────────────────┐
│ 🔍 toyota                                  ✕ │
└──────────────────────────────────────────────┘
3 bookings found

[Filtered results displayed below]
```

### 3. No Results State

```
┌──────────────────────────────────────────────┐
│ 🔍 mercedes                                ✕ │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│                                              │
│            📋                                │
│      No Matching Bookings                    │
│                                              │
│  No bookings found matching "mercedes".      │
│  Try a different search term.                │
│                                              │
└──────────────────────────────────────────────┘
```

### 4. Empty State (No Data)

```
┌──────────────────────────────────────────────┐
│ 🔍 Search bookings by ID, car model...      │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│                                              │
│            📋                                │
│         No Bookings Found                    │
│                                              │
│  You haven't made any bookings yet.          │
│                                              │
└──────────────────────────────────────────────┘
```

## Responsive Design

### Desktop View (> 768px)

```
┌────────────────────────────────────────────────────┐
│ 🔍 Search bookings...                          ✕   │
└────────────────────────────────────────────────────┘
                    (Max width: 600px)
```

### Mobile View (< 768px)

```
┌──────────────────────────────────────────────┐
│ 🔍 Search...                               ✕ │
└──────────────────────────────────────────────┘
              (Full width)
```

## Tab Switching Behavior

### Scenario: User switches between tabs

**Step 1: Search in Booking History**

```
Tab: [Bookings History] Payments History
Search: "toyota"
Result: 3 bookings found
```

**Step 2: Switch to Payment History**

```
Tab: Bookings History [Payments History]
Search: "" (empty - separate search state)
Result: All payments shown
```

**Step 3: Search in Payment History**

```
Tab: Bookings History [Payments History]
Search: "gcash"
Result: 5 payments found
```

**Step 4: Switch back to Booking History**

```
Tab: [Bookings History] Payments History
Search: "toyota" (preserved!)
Result: 3 bookings found
```

**Key Feature:** Each tab maintains its own search state!

## Search Examples

### Example 1: Find Unpaid Bookings

```
User types: "unpaid"
System filters: Shows only unpaid bookings
Result: Booking ID 124, 126, 130
```

### Example 2: Find Specific Car

```
User types: "toyota fortuner"
System filters: Car model contains "toyota fortuner"
Result: Booking ID 125, 128
```

### Example 3: Find by Date

```
User types: "2025-10-13"
System filters: Start or end date contains "2025-10-13"
Result: Bookings on October 13, 2025
```

### Example 4: Find by Payment Method

```
Tab: Payment History
User types: "gcash"
System filters: Payment method contains "gcash"
Result: All GCash payments
```

## Keyboard Shortcuts

- **Tab**: Focus search bar
- **Escape**: Clear search (when focused)
- **Enter**: Maintain focus (search updates in real-time)
- **Ctrl + A**: Select all text in search bar

## Accessibility Features

- ✅ Screen reader compatible
- ✅ ARIA labels on buttons
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ High contrast support

## Performance

- ⚡ **Instant filtering** - No API calls needed
- ⚡ **Client-side search** - Works offline
- ⚡ **Minimal re-renders** - Optimized React updates
- ⚡ **Handles 100+ items** - Smooth performance

## Color Scheme

- Primary Color: `#c10007` (Red)
- Text Color: `rgba(0, 0, 0, 0.87)`
- Secondary Text: `rgba(0, 0, 0, 0.6)`
- Border: `rgba(0, 0, 0, 0.23)`
- Hover: `#a50006`
- Background: `#ffffff`

## Mobile Optimization

### Touch Targets

- Search bar: 48px min height
- Clear button: 44x44px touch area
- Tab buttons: 48px min height

### Typography

- Placeholder: 14px
- Input text: 16px (prevents zoom on iOS)
- Result count: 12px

### Spacing

- Search bar margin: 16px
- Result count margin-top: 8px
- Tablet padding: 24px
- Mobile padding: 16px
