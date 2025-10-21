# Customer Cancel Extension - Visual Guide

**Quick visual reference for the new feature**

---

## 📱 Mobile View

```
┌─────────────────────────────────────┐
│  📷 [Car Image]                     │
│                                     │
│  🏷️ In Progress  ⏳ Pending Extension
├─────────────────────────────────────┤
│  🚗 Toyota Vios 2023                │
│  📅 Dec 1 - Dec 5, 2025             │
│  📍 Pickup: JA Office               │
│  📍 Drop-off: JA Office             │
│  💰 Total: ₱10,000                  │
├─────────────────────────────────────┤
│  ⚠️ Extension Request Pending       │
│  New End Date: Dec 8, 2025          │
│  💰 Payment Due: Dec 5, 6:00 PM     │
├─────────────────────────────────────┤
│  [❌ Cancel Extension]              │
└─────────────────────────────────────┘
```

---

## 💻 Desktop View

```
┌───────────────────────────────────────────────────────────────────┐
│  📷                  │  🚗 Toyota Vios 2023                       │
│  [Car Image]         │  🏷️ In Progress  ⏳ Pending Extension      │
│  200x120px           │                                           │
│                      │  📅 Start: Dec 1, 2025 10:00 AM           │
│                      │  📅 End: Dec 5, 2025 10:00 AM             │
│                      │  📍 Pickup: JA Car Rental Office          │
│                      │  📍 Drop-off: JA Car Rental Office        │
│                      │  💰 Total: ₱10,000                        │
│                      │  ─────────────────────────────────────    │
│                      │  ⚠️ Extension Request Pending             │
│                      │  New End Date: Dec 8, 2025                │
│                      │  💰 Payment Due: Dec 5, 2025 6:00 PM      │
│                      │  ─────────────────────────────────────    │
│                      │  [❌ Cancel Extension]                    │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Button States

### **Normal State:**
```
┌─────────────────────────┐
│  ❌ Cancel Extension    │  ← Orange border (#ff9800)
└─────────────────────────┘
```

### **Hover State:**
```
┌─────────────────────────┐
│  ❌ Cancel Extension    │  ← Light orange background (#fff3e0)
└─────────────────────────┘
```

### **Disabled State (Loading):**
```
┌─────────────────────────┐
│  ⏳ Cancel Extension    │  ← Grayed out, not clickable
└─────────────────────────┘
```

---

## 💬 Dialog Flow

### **Step 1: Click Button**
```
┌─────────────────────────────────────────┐
│  ⚠️ Confirm Cancellation                │
├─────────────────────────────────────────┤
│  Are you sure you want to cancel your   │
│  extension request? Your booking will   │
│  continue with the original end date.   │
│                                         │
│         [Cancel]  [Confirm]             │
└─────────────────────────────────────────┘
```

### **Step 2: After Confirmation**
```
┌─────────────────────────────────────────┐
│  ✅ Success!                            │
├─────────────────────────────────────────┤
│  Extension request cancelled            │
│  successfully!                          │
│                                         │
│  📅 Your booking continues until:       │
│  December 5, 2025                       │
│                                         │
│         [OK]                            │
└─────────────────────────────────────────┘
```

---

## 🔄 Before & After

### **BEFORE Cancellation:**
```
Booking Card:
├─ Status Badges:
│  ├─ 🏷️ "In Progress" (Green)
│  └─ ⏳ "Pending Extension" (Orange)
│
├─ Alert Box:
│  ├─ ⚠️ Extension Request Pending
│  ├─ New End Date: Dec 8, 2025
│  └─ 💰 Payment Due: Dec 5, 6:00 PM
│
└─ Action Buttons:
   └─ [❌ Cancel Extension]  ← Visible
```

### **AFTER Cancellation:**
```
Booking Card:
├─ Status Badges:
│  └─ 🏷️ "In Progress" (Green)  ← Extension badge removed
│
├─ Alert Box:
│  └─ (Hidden - no alert)  ← Alert removed
│
└─ Action Buttons:
   └─ [➕ Extend]  ← Now shows "Extend" button again
```

---

## 📋 Alert Box Variations

### **With Payment Deadline:**
```
┌─────────────────────────────────────────┐
│  ⚠️ Extension Request Pending           │
│                                         │
│  New End Date: December 8, 2025         │
│  💰 Payment Due: Dec 5, 2025 6:00 PM    │
└─────────────────────────────────────────┘
```

### **Without Payment Deadline:**
```
┌─────────────────────────────────────────┐
│  ⚠️ Extension Request Pending           │
│                                         │
│  New End Date: December 8, 2025         │
└─────────────────────────────────────────┘
```

---

## 🎯 Button Placement Examples

### **Example 1: Pending Booking (No Extension)**
```
Action Buttons:
[✏️ Edit]  [❌ Cancel]
```

### **Example 2: In Progress (No Extension)**
```
Action Buttons:
[➕ Extend]
```

### **Example 3: In Progress (Extension Pending)** ← NEW
```
Action Buttons:
[❌ Cancel Extension]
```

### **Example 4: Confirmed (Cancellation Pending)**
```
Action Buttons:
(No buttons - cancellation pending)
```

---

## 📱 Responsive Breakpoints

### **Mobile (xs - below 600px):**
- Font size: `0.75rem` (12px)
- Alert text: `0.7rem` - `0.75rem` (11-12px)
- Buttons stack vertically if needed
- Full-width card layout

### **Tablet (sm - 600px+):**
- Font size: `0.875rem` (14px)
- Alert text: `0.8rem` - `0.875rem` (13-14px)
- Horizontal card layout (image left, content right)
- Buttons in single row

### **Desktop (md+ - 900px+):**
- Font size: `0.875rem` (14px)
- Comfortable spacing
- Wider cards
- Clear button separation

---

## 🎨 Color Reference

| Element | Color Code | Visual |
|---------|------------|--------|
| Button Border | `#ff9800` | 🟠 Orange |
| Button Text | `#ff9800` | 🟠 Orange |
| Button Hover BG | `#fff3e0` | 🟡 Light Orange |
| Alert Background | Material Warning | 🟡 Yellow |
| Payment Due Text | `#d32f2f` | 🔴 Red |
| Icon Color | `#ff9800` | 🟠 Orange |

---

## ✅ What Customer Sees

### **Scenario: Extension Request Pending**

1. **Badge:** Orange "Pending Extension" badge on top-right corner
2. **Alert:** Yellow alert box with:
   - Extension pending message
   - New end date
   - Payment deadline (if set)
3. **Button:** Orange "Cancel Extension" button
4. **Action:** Click → Confirm → Success → Refresh → Extension removed

### **Result:**
- ✅ Extension cancelled
- ✅ Booking continues with original end date
- ✅ Can request new extension if needed
- ✅ Clear feedback at every step

---

**Visual Guide Complete!** 🎨✅
