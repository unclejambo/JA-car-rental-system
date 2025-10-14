# GPS Tracking Testing Guide - Car ID 4

## ✅ Configuration Complete

Your environment is configured with:

```env
VITE_FLESPI_TOKEN=FlespiToken tfff4uBX5HMofADE3JSlZuNVMrCfTgAAmrFfhiajzxMmKUOX93V0dK8pyJ6gm8pC
VITE_FLESPI_DEVICE_ID=7026204040
```

**Car with GPS:** Car ID 4

## 📋 Testing Steps

### 1. Install Required Packages (if not done)

```bash
cd frontend
npm install leaflet react-leaflet
```

### 2. Restart Frontend Server

**IMPORTANT:** Environment variables only load when the server starts.

```bash
# Stop the current server (Ctrl+C)
npm start
```

### 3. Create/Find Test Booking

You need a booking with:
- **Car ID:** 4
- **Status:** "In Progress" (exactly this, case-sensitive)

#### Option A: Update Existing Booking
```sql
-- In your database, update a booking to use Car 4
UPDATE "Booking" 
SET car_id = 4, booking_status = 'In Progress' 
WHERE booking_id = [your_booking_id];
```

#### Option B: Create New Booking
Create a new booking through the admin panel:
- Select Car ID 4
- Set status to "In Progress"

### 4. Open Admin Schedule Page

1. Login as Admin
2. Navigate to **Schedule** page
3. Find the booking with Car ID 4 and "In Progress" status
4. You should see a **green globe icon** 🌍 next to it

### 5. Test GPS Tracking

#### Open the GPS Modal
1. Click the **globe icon**
2. GPS Tracking Modal should open

#### Check Browser Console (F12)

You should see detailed debug output:

```
🔍 GPS Tracking Configuration:
  Token exists: true
  Token preview: FlespiToken tfff4uBX5HMofADE...
  Device ID: 7026204040
  Base URL: https://flespi.io/gw

🚗 GPS Modal Opened for Car ID: 4
  Booking data: {car_id: 4, ...}
  Has GPS: true

📡 Fetching telemetry data...
  URL: https://flespi.io/gw/devices/7026204040/telemetry
  Response status: 200 OK
✅ Telemetry data received: {result: [...]}
📍 GPS Position: {lat: 14.xxxx, lon: 120.xxxx}

📜 Fetching message history...
  URL: https://flespi.io/gw/devices/7026204040/messages?data=...
  Response status: 200 OK
✅ Message history received: {result: [...]}
  Total messages: 50
🗺️ Route points: 50
```

### 6. Verify Each Tab

#### Live Tracking Tab (Default)
- ✅ Interactive map loads
- ✅ Red car marker shows at current GPS position
- ✅ Click marker to see popup with details
- ✅ Stats show below map:
  - Speed (km/h)
  - Direction (degrees)
  - Altitude (meters)
  - Last Update timestamp

#### Route History Tab
- ✅ Click second tab
- ✅ Blue route line appears on map
- ✅ Green marker at start point
- ✅ Red car marker at current location
- ✅ Route summary displays:
  - Total Points
  - Time Range
  - Status chip

#### Vehicle Data Tab
- ✅ Click third tab
- ✅ Grid of telemetry parameters displays
- ✅ Each card shows:
  - Parameter name
  - Current value
  - Last update timestamp

### 7. Test Auto-Refresh

1. Keep modal open for 30+ seconds
2. Watch console for:
   ```
   🔄 Auto-refreshing GPS data...
   📡 Fetching telemetry data...
   ```
3. Verify data updates on screen

### 8. Test Manual Refresh

1. Click **"Refresh"** button at bottom
2. Should see in console:
   ```
   📡 Fetching telemetry data...
   📜 Fetching message history...
   ```
3. Data should update immediately

### 9. Close Modal

1. Click **"Close"** button
2. Console should show:
   ```
   🛑 GPS Modal Closed - Stopping auto-refresh
   ```
3. Wait 30+ seconds
4. Verify no more refresh attempts in console

## 🐛 Troubleshooting

### Issue: Globe icon doesn't appear

**Check:**
1. Booking status is exactly "In Progress" (not "in progress" or "Ongoing")
   ```sql
   SELECT booking_id, car_id, booking_status 
   FROM "Booking" 
   WHERE car_id = 4;
   ```
2. Car ID is 4
3. Refresh the schedule page

**Fix:**
```sql
UPDATE "Booking" 
SET booking_status = 'In Progress' 
WHERE booking_id = [your_id];
```

### Issue: "GPS Not Yet Installed" warning shows

**Check:**
1. Car ID in booking is 4
2. Console shows:
   ```
   ⚠️ GPS Modal opened but car does not have GPS
     Car ID: [shows different number]
     Cars with GPS: [4]
   ```

**Fix:** Verify the booking uses Car ID 4, not another car.

### Issue: No GPS data / "No GPS data available"

**Check Console for Error Messages:**

#### Error: "HTTP error! status: 401"
- **Cause:** Invalid Flespi token
- **Fix:** Verify token in `.env` is correct, restart server

#### Error: "HTTP error! status: 404"
- **Cause:** Invalid device ID
- **Fix:** Verify device ID in `.env` is correct (7026204040)

#### Error: "HTTP error! status: 403"
- **Cause:** Token lacks permissions
- **Fix:** In Flespi Panel, update token permissions to include:
  - `gw/devices/{selector}/telemetry` - READ
  - `gw/devices/{selector}/messages` - READ

#### Warning: "⚠️ No position data in telemetry"
- **Cause:** Device hasn't sent GPS data recently
- **Fix:** Check in Flespi Panel if device is online and sending data

#### Warning: "⚠️ No telemetry results returned"
- **Cause:** Device exists but has no data
- **Fix:** Verify device is connected and transmitting in Flespi Panel

### Issue: Map doesn't load

**Check:**
1. Browser console for Leaflet errors
2. Network tab for failed CSS/JS requests
3. Verify packages are installed:
   ```bash
   npm list leaflet react-leaflet
   ```

**Fix:**
```bash
cd frontend
npm install leaflet react-leaflet
npm start
```

### Issue: Environment variables not loading

**Symptoms in console:**
```
🔍 GPS Tracking Configuration:
  Token exists: false
  Token preview: YOUR_FLESPI_TOKEN_HERE...
  Device ID: null
```

**Fix:**
1. Verify `.env` file is in `frontend/` folder (not root)
2. Variables start with `VITE_` prefix
3. **Restart the dev server** (most common issue!)
4. Check file is named exactly `.env` (not `.env.txt`)

### Issue: CORS errors

**Error in console:**
```
Access to fetch at 'https://flespi.io/...' has been blocked by CORS policy
```

**Cause:** Flespi supports CORS, so this usually means:
1. Token is invalid/malformed
2. Browser extension is blocking requests

**Fix:**
1. Verify token format: `FlespiToken ` + token (with space)
2. Disable browser extensions temporarily
3. Test in incognito/private window

## ✅ Expected Results

### Console Output (Successful Test)
```
🔍 GPS Tracking Configuration:
  Token exists: true
  Token preview: FlespiToken tfff4uBX5HMofADE...
  Device ID: 7026204040
  Base URL: https://flespi.io/gw

🚗 GPS Modal Opened for Car ID: 4
  Booking data: {car_id: 4, car: {...}, ...}
  Has GPS: true

📡 Fetching telemetry data...
  URL: https://flespi.io/gw/devices/7026204040/telemetry
  Response status: 200 OK
✅ Telemetry data received: {result: [1]}
📍 GPS Position: {lat: 14.5995, lon: 120.9842}

📜 Fetching message history...
  URL: https://flespi.io/gw/devices/7026204040/messages?data={"count":50,"reverse":true}
  Response status: 200 OK
✅ Message history received: {result: [50]}
  Total messages: 50
🗺️ Route points: 50
```

### Visual Verification
- ✅ Modal opens with title showing car details
- ✅ Map displays with car marker at GPS position
- ✅ Speed, direction, altitude stats show real values
- ✅ Route history shows blue line path
- ✅ Vehicle data tab shows all telemetry parameters
- ✅ Refresh button works
- ✅ No errors in console

## 📊 Test Checklist

- [ ] Frontend server restarted after adding `.env`
- [ ] Packages installed (`leaflet`, `react-leaflet`)
- [ ] Booking exists with Car ID 4
- [ ] Booking status is "In Progress"
- [ ] Globe icon appears on schedule page
- [ ] Globe icon opens GPS modal
- [ ] Console shows configuration loaded successfully
- [ ] Console shows successful API calls (200 OK)
- [ ] Live Tracking tab shows map and marker
- [ ] Speed/direction/altitude display correctly
- [ ] Route History tab shows blue route line
- [ ] Vehicle Data tab shows telemetry grid
- [ ] Manual refresh button works
- [ ] Auto-refresh works after 30 seconds
- [ ] Closing modal stops auto-refresh
- [ ] No console errors

## 🎯 Quick Test (1 Minute)

If everything is set up correctly:

1. **Start server:** `npm start` in frontend folder
2. **Open browser:** Go to Admin Schedule page
3. **Click globe icon** on Car 4 booking (In Progress status)
4. **Press F12** to open console
5. **Look for:** Green checkmarks (✅) in console logs
6. **Verify:** Map loads with car marker
7. **Success!** 🎉

## 🆘 Still Having Issues?

1. **Check Flespi Panel:** https://flespi.io/
   - Is device online?
   - Has it sent data recently?
   - Go to device → Toolbox → Messages/Telemetry

2. **Check Console Output:**
   - Copy all console logs
   - Look for red error messages (❌)
   - Share error details

3. **Verify Network Tab:**
   - Open Network tab in DevTools
   - Filter by "flespi"
   - Check status codes (should be 200)
   - Click request to see response

4. **Common Fixes:**
   - Restart server
   - Clear browser cache (Ctrl+Shift+R)
   - Try different browser
   - Check `.env` file syntax

## 📝 Notes

- Device ID 7026204040 is your GPS tracker
- Car ID 4 is configured to use this tracker
- Token is valid and has correct permissions
- Data auto-refreshes every 30 seconds
- Close modal to stop auto-refresh

---

**Date:** October 14, 2025  
**Configuration:** Car ID 4 → Flespi Device 7026204040  
**Status:** Ready for Testing ✅
