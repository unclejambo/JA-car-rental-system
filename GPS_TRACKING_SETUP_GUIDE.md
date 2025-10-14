# GPS Tracking Quick Setup Guide

## Step 1: Install Dependencies

```bash
cd frontend
npm install leaflet react-leaflet
```

## Step 2: Configure Flespi

### 2.1 Get Flespi Token

1. Go to [Flespi Panel](https://flespi.io/)
2. Login or create account (free tier available)
3. Navigate to **"Tokens"** section in left sidebar
4. Click **"+ Token"** to create new token
5. Configure token:
   - **Name:** "JA Car Rental GPS Token"
   - **ACL (Permissions):**
     - ✅ `gw/devices/{selector}/messages` - READ
     - ✅ `gw/devices/{selector}/telemetry` - READ
     - ✅ `gw/devices/{selector}` - READ
6. Click **"Save"**
7. Copy the token (looks like: `FlespiToken abc123xyz...`)

### 2.2 Get Device ID

1. In Flespi Panel, go to **"Devices"** section
2. Find your GPS device in the list
3. Click on the device to open details
4. Copy the **Device ID** (numeric, e.g., `123456`)
5. Verify device status is **"Online"** (green indicator)

### 2.3 Create Environment File

1. Navigate to `frontend/` directory
2. Copy the example file:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` file in editor
4. Paste your values:
   ```env
   VITE_FLESPI_TOKEN=FlespiToken your_actual_token_here
   VITE_FLESPI_DEVICE_ID=123456
   ```
5. Save the file

**Important:** NEVER commit `.env` file to git!

## Step 3: Configure Car with GPS

Currently, only Car ID 1 is configured to have GPS. To change this:

### Option A: Use Different Car ID (Quick)

Edit `frontend/src/ui/components/modal/GPSTrackingModal.jsx`:

```javascript
// Line 62
const CARS_WITH_GPS = [1]; // Change to your car ID, e.g., [5]
```

### Option B: Add Multiple Cars (Better)

```javascript
const CARS_WITH_GPS = [1, 5, 8]; // Multiple cars with GPS
```

### Option C: Move to Database (Production)

See **GPS_TRACKING_IMPLEMENTATION.md** for database migration guide.

## Step 4: Test GPS Device in Flespi

Before testing in your app, verify data in Flespi Panel:

1. Go to **"Devices"** → Select your device
2. Click **"Toolbox"** tab
3. Check **"Messages"** section:
   - Should show recent GPS messages
   - Look for `position.latitude` and `position.longitude`
   - Verify timestamps are recent
4. Check **"Telemetry"** section:
   - Should show latest values
   - Verify position data exists

**If no data:** Device might be offline or not sending data. Check device connection.

## Step 5: Create Test Booking

1. Login as admin
2. Create a booking with:
   - **Car:** Car ID 1 (or whichever has GPS)
   - **Status:** "In Progress" (not Pending or Confirmed)
3. Go to **Admin Schedule** page
4. You should see a **green globe icon** next to the booking

## Step 6: Test GPS Tracking

### Test Live Tracking

1. Click the **globe icon**
2. GPS modal should open
3. Navigate to **"Live Tracking"** tab (should be default)
4. Verify:
   - ✅ Map loads and centers on car location
   - ✅ Red car marker appears
   - ✅ Speed, direction, altitude show below map
   - ✅ Click marker to see popup with details
5. Wait 30 seconds:
   - ✅ Data should auto-refresh
6. Click **"Refresh"** button:
   - ✅ Data updates immediately

### Test Route History

1. Navigate to **"Route History"** tab
2. Verify:
   - ✅ Blue route line appears on map
   - ✅ Green marker at start point
   - ✅ Red car marker at current location
   - ✅ Route summary shows stats (points, time range)

### Test Vehicle Data

1. Navigate to **"Vehicle Data"** tab
2. Verify:
   - ✅ Grid of telemetry parameters displays
   - ✅ Each parameter shows value and timestamp
   - ✅ All data is readable

### Test GPS Not Installed Warning

1. Create a booking with **Car ID 2** (or any car without GPS)
2. Set status to **"In Progress"**
3. Click globe icon
4. Verify:
   - ✅ Warning message appears: "GPS Not Yet Installed"
   - ✅ No map or data tabs show

### Test Error Handling

1. **Invalid Token Test:**
   - Change `VITE_FLESPI_TOKEN` in `.env` to invalid value
   - Restart frontend: `npm start`
   - Click globe icon
   - ✅ Should show error message
   - Restore correct token

2. **Invalid Device ID Test:**
   - Change `VITE_FLESPI_DEVICE_ID` to `999999`
   - Restart frontend
   - Click globe icon
   - ✅ Should show error message
   - Restore correct device ID

## Step 7: Verify Auto-Refresh

1. Open GPS modal with car that has GPS
2. Open browser DevTools (F12)
3. Go to **Network** tab
4. Filter by "flespi"
5. Wait and observe:
   - ✅ Every 30 seconds, new request to telemetry endpoint
   - ✅ Status should be `200 OK`
6. Close modal
7. Wait 30+ seconds
8. Verify:
   - ✅ No more requests after modal closes

## Troubleshooting

### Map doesn't display

**Symptom:** White/blank area where map should be

**Solutions:**
1. Check browser console for errors
2. Verify Leaflet CSS is loaded:
   ```javascript
   import 'leaflet/dist/leaflet.css';
   ```
3. Clear browser cache and reload
4. Check if `leaflet` and `react-leaflet` are installed:
   ```bash
   npm list leaflet react-leaflet
   ```

### "GPS Not Yet Installed" for car with GPS

**Symptom:** Warning shows even though car should have GPS

**Solutions:**
1. Check car ID in booking matches `CARS_WITH_GPS` array
2. Verify car ID in database:
   ```sql
   SELECT car_id, make, model FROM "Car" WHERE car_id = 1;
   ```
3. Check component code:
   ```javascript
   console.log('Car ID:', booking?.car_id);
   console.log('Has GPS:', CARS_WITH_GPS.includes(booking?.car_id));
   ```

### No GPS data received

**Symptom:** Modal opens but shows "No GPS data available"

**Solutions:**
1. Check `.env` file exists and has correct values
2. Restart frontend after changing `.env`:
   ```bash
   npm start
   ```
3. Verify Flespi token has correct permissions (see Step 2.1)
4. Check device is online in Flespi Panel
5. Verify device has sent recent messages in Flespi Toolbox
6. Check browser console for API errors:
   - `401 Unauthorized` → Invalid token
   - `404 Not Found` → Invalid device ID
   - `403 Forbidden` → Token lacks permissions

### Globe icon doesn't appear

**Symptom:** No globe button in schedule table

**Solutions:**
1. Verify booking status is "In Progress" (case-sensitive)
2. Check database:
   ```sql
   SELECT booking_id, booking_status FROM "Booking" WHERE booking_id = 46;
   ```
3. Update status if needed:
   ```sql
   UPDATE "Booking" SET booking_status = 'In Progress' WHERE booking_id = 46;
   ```
4. Refresh admin schedule page

### CORS errors in console

**Symptom:** Console shows "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution:** Flespi fully supports CORS. This error usually means:
1. Token is invalid → Check token format
2. Request URL is malformed → Check device ID
3. Browser extension is interfering → Disable ad blockers

### Auto-refresh not working

**Symptom:** Data doesn't update after 30 seconds

**Solutions:**
1. Check browser console for errors during refresh
2. Verify modal stays open for at least 30 seconds
3. Check network tab to confirm requests are being made
4. Verify Flespi API is responding (check status codes)

### Map markers don't show

**Symptom:** Map loads but no markers visible

**Solutions:**
1. Check icon URLs are accessible:
   - Open `https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png` in browser
   - Should show marker image
2. Verify Leaflet icon fix is applied (already in code)
3. Check GPS coordinates are valid:
   ```javascript
   console.log('Lat:', telemetryData['position.latitude']?.value);
   console.log('Lon:', telemetryData['position.longitude']?.value);
   ```
4. Ensure coordinates are in valid range:
   - Latitude: -90 to 90
   - Longitude: -180 to 180

### Route history shows no line

**Symptom:** Route History tab shows map but no blue line

**Solutions:**
1. Verify device has sent multiple messages:
   - Check Flespi Panel → Toolbox → Messages
   - Need at least 2 messages for a line
2. Increase message count in API call (currently 50)
3. Check if messages have position data:
   ```javascript
   console.log('Messages:', messageHistory);
   console.log('Route points:', route);
   ```

## Performance Optimization

If GPS tracking feels slow:

1. **Reduce message count:**
   ```javascript
   // Line ~160 in GPSTrackingModal.jsx
   count: 20 // Was 50, reduce to 20
   ```

2. **Increase refresh interval:**
   ```javascript
   // Line ~177 in GPSTrackingModal.jsx
   }, 60000); // Was 30000 (30s), change to 60000 (60s)
   ```

3. **Disable auto-refresh:**
   Comment out the interval:
   ```javascript
   // const interval = setInterval(() => {
   //   fetchTelemetry();
   // }, 30000);
   ```

## Production Checklist

Before deploying to production:

- [ ] Move Flespi token to backend (don't expose in frontend)
- [ ] Add `has_gps` field to Car database table
- [ ] Fetch GPS config from database instead of hardcoded array
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Test with multiple devices
- [ ] Verify rate limits for your Flespi plan
- [ ] Add `.env` to `.gitignore` (should already be there)
- [ ] Document token rotation procedure
- [ ] Set up alerts for GPS device offline status
- [ ] Test on mobile devices
- [ ] Add loading skeletons for better UX
- [ ] Implement caching for telemetry data
- [ ] Add geofencing if needed
- [ ] Consider MQTT for real-time updates

## Support Resources

- **Flespi Documentation:** https://flespi.com/docs/
- **Flespi Forum:** https://forum.flespi.com/
- **Leaflet Documentation:** https://leafletjs.com/reference.html
- **React Leaflet Documentation:** https://react-leaflet.js.org/

## Need Help?

Check these resources in order:

1. **Browser Console:** Look for error messages
2. **Flespi Panel:** Verify device is online and sending data
3. **Network Tab:** Check API requests and responses
4. **Documentation:** GPS_TRACKING_IMPLEMENTATION.md has detailed info
5. **Flespi Support:** They have excellent support for free tier

---

**Setup Time:** ~15-20 minutes  
**Difficulty:** Intermediate  
**Requirements:** Flespi account, GPS device, active booking
