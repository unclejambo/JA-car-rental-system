# Edit Booking Modal - Visual Layout Guide

## 📋 New Layout Structure

```
╔══════════════════════════════════════════════════════════════════╗
║  Edit Booking #123                                          [X]  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ┌────────────── Current Booking Details ──────────────┐       ║
║  │                    (CENTERED)                         │       ║
║  │  Vehicle: Toyota Fortuner 2023 • ABC-1234           │       ║
║  │  Total Amount: ₱15,000                               │       ║
║  │  Status: [Confirmed] Driver: Self-Drive              │       ║
║  │  Service: Delivery Service                           │       ║
║  └──────────────────────────────────────────────────────┘       ║
║                                                                  ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       ║
║                                                                  ║
║            Update Booking Information (CENTERED)                ║
║                                                                  ║
║  ┌──────────── Service Type * (CENTERED) ────────────┐         ║
║  │  ┌──────────────────┐  ┌──────────────────┐      │         ║
║  │  │  🚚 Delivery     │  │  🏢 Office       │      │         ║
║  │  │     Service      │  │     Pickup       │      │         ║
║  │  └──────────────────┘  └──────────────────┘      │         ║
║  └──────────────────────────────────────────────────┘         ║
║                                                                  ║
║  ┌─ Purpose of Rental * ────────────────────────────┐          ║
║  │ [Travel ▼]                                        │          ║
║  └───────────────────────────────────────────────────┘          ║
║                                                                  ║
║  ┌─ Start Date * ──────┐  ┌─ End Date * ───────────┐          ║
║  │ [2025-10-15      ]   │  │ [2025-10-20        ]   │          ║
║  └──────────────────────┘  └────────────────────────┘          ║
║                                                                  ║
║  ┌─ Pickup Time * ─────┐  ┌─ Drop-off Time * ──────┐          ║
║  │ [14:30]              │  │ [16:00]                 │          ║
║  │ Office: 7AM - 7PM    │  │ Office: 7AM - 7PM       │          ║
║  └──────────────────────┘  └────────────────────────┘          ║
║                                                                  ║
║  ┌─ Pickup Location * ─┐  ┌─ Drop-off Location * ──┐          ║
║  │ (Delivery Service)   │  │ (Return Address)        │          ║
║  │ 123 Main Street     │  │ 123 Main Street         │          ║
║  │ Manila, Philippines │  │ Manila, Philippines     │          ║
║  └──────────────────────┘  └────────────────────────┘          ║
║    OR (for Office Pickup)                                       ║
║  ┌──────────────────────┐  ┌────────────────────────┐          ║
║  │ ℹ️ Pickup Location   │  │ ℹ️ Drop-off Location    │          ║
║  │ J&A Car Rental      │  │ J&A Car Rental          │          ║
║  │ Office              │  │ Office                  │          ║
║  └──────────────────────┘  └────────────────────────┘          ║
║                                                                  ║
║  ┌─ Self-Drive Service ─────────────────────────────┐          ║
║  │ [✓] Self-Drive Service                           │          ║
║  │     You will drive the vehicle yourself          │          ║
║  └───────────────────────────────────────────────────┘          ║
║    (When disabled, driver dropdown appears below)               ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                    [Cancel]  [✓ Update Booking]                 ║
╚══════════════════════════════════════════════════════════════════╝
```

## 🎯 Key Layout Features

### 1. Centered Elements
- **Current Booking Details Card** - Max width 800px, centered
- **"Update Booking Information"** title - Centered text
- **Service Type section** - Cards container max width 600px, centered
- **"Service Type *"** label - Centered

### 2. Split Layouts (Side-by-Side)
All use `Grid item xs={12} sm={6}`:

| Left Column | Right Column |
|------------|--------------|
| 🚚 Delivery Service | 🏢 Office Pickup |
| Start Date | End Date |
| Pickup Time | Drop-off Time |
| Pickup Location | Drop-off Location |

### 3. Full Width Elements
- Purpose of Rental dropdown
- Custom purpose text field (when "Others" selected)
- Self-Drive Service toggle
- Driver selection dropdown (when self-drive disabled)

## 📱 Responsive Behavior

### Desktop (≥600px)
```
┌──────────────┐  ┌──────────────┐
│ Start Date   │  │ End Date     │
└──────────────┘  └──────────────┘
```

### Mobile (<600px)
```
┌────────────────────────────────┐
│ Start Date                     │
└────────────────────────────────┘
┌────────────────────────────────┐
│ End Date                       │
└────────────────────────────────┘
```

## 🕐 Timezone Handling

### Display (Database → Form)
```
Database (UTC):        2025-10-15T06:30:00.000Z
↓ Convert to Local
Form Display:          14:30 (in user's timezone)
```

### Submit (Form → Database)
```
Form Input:            14:30 (user's local time)
Combined with Date:    2025-10-15T14:30:00
↓ Convert to UTC
Database (UTC):        2025-10-15T06:30:00.000Z
```

## 🎨 Visual Styling

### Color Scheme
- **Primary Red**: `#c10007` (Buttons, titles, accents)
- **Hover Red**: `#a50006` (Button hover states)
- **Light Gray**: `#f5f5f5` (Card backgrounds, footer)
- **Border Gray**: `#e0e0e0` (Unselected cards)
- **Success Green**: `#4caf50` (Confirmed status)
- **Warning Orange**: `#ff9800` (Pending status)

### Card Selection States
- **Unselected**: 2px solid `#e0e0e0`
- **Selected**: 3px solid `#c10007`
- **Hover**: Border changes to `#c10007`

### Button Styling
- **Cancel**: Outlined, red border, red text
- **Update**: Filled, red background, white text
- **Loading**: Circular progress indicator replaces text

## 📊 Field Order Summary

1. **Current Booking Details** (Read-only, centered)
2. **Update Booking Information** (Section title, centered)
3. **Service Type** (2 cards, centered, split layout)
4. **Purpose** (Full width dropdown)
5. **Dates** (Split: Start | End)
6. **Times** (Split: Pickup | Drop-off)
7. **Locations** (Split: Pickup | Drop-off)
   - Changes based on service type
   - Delivery: Text areas for addresses
   - Office Pickup: Info alerts
8. **Self-Drive** (Full width toggle + conditional driver dropdown)

## ✅ Validation Rules

All original validation preserved:
- ✓ Required fields marked with *
- ✓ Office hours: 7:00 AM - 7:00 PM
- ✓ Same-day booking: 3-hour minimum gap
- ✓ Drop-off time must be after pickup time
- ✓ End date must be after start date
- ✓ Driver required when self-drive disabled
- ✓ Custom purpose required when "Others" selected

## 🔄 Form Flow

1. User opens modal → Current booking details load
2. Times converted from UTC to local timezone automatically
3. User modifies fields in organized order
4. Service type selection shows/hides relevant fields
5. Validation checks on submit
6. Times converted back to UTC before sending to API
7. Success → Modal closes, booking list refreshes

---

**Layout Status**: ✅ Fully Implemented  
**Timezone Handling**: ✅ UTC ↔ Local conversion working  
**Responsive Design**: ✅ Mobile and desktop optimized  
**Validation**: ✅ All rules maintained
