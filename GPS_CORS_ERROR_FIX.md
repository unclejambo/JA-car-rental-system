# GPS Modal - CORS Error Fix

## Issue: CORS Error

```
Access to fetch at 'https://flespi.io/gw/devices/7026204040/telemetry' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
It does not have HTTP ok status.
```

## Root Cause

The Authorization header was being constructed incorrectly. Your `.env` file already includes the "FlespiToken" prefix:

```env
VITE_FLESPI_TOKEN=FlespiToken tfff4uBX5HMofADE3JSlZuNVMrCfTgAAmrFfhiajzxMmKUOX93V0dK8pyJ6gm8pC
```

But the code was adding it again:

```javascript
// ❌ WRONG - Double "FlespiToken"
Authorization: `FlespiToken ${FLESPI_CONFIG.token}`
// Results in: "FlespiToken FlespiToken tfff4uBX..."
```

## Fix Applied

Now the code checks if the token already starts with "FlespiToken":

```javascript
// ✅ CORRECT - Only use "FlespiToken" once
const authHeader = FLESPI_CONFIG.token.startsWith('FlespiToken') 
  ? FLESPI_CONFIG.token 
  : `FlespiToken ${FLESPI_CONFIG.token}`;

// Results in: "FlespiToken tfff4uBX5HMofADE3JSlZuNVMrCfTgAAmrFfhiajzxMmKUOX93V0dK8pyJ6gm8pC"
```

## Additional Fix: Car ID Extraction

Also added better debugging for the car object:

```javascript
console.log('📦 Car object:', booking?.car);
```

This will help us see if the car object contains the car_id we need.

## What to Do Now

1. **Refresh your browser** (clear cache: Ctrl+Shift+R)
2. **Click the globe icon** again
3. **Check the console** - should now show:
   ```
   📡 Fetching telemetry data...
     URL: https://flespi.io/gw/devices/7026204040/telemetry
     Auth header: FlespiToken tfff4uBX5HMofADE...
     Response status: 200 OK
   ✅ Telemetry data received
   ```

## Expected Console Output (Fixed)

```
🔍 GPS Tracking Configuration:
  Token exists: true
  Token preview: FlespiToken tfff4uBX5HMofADE...
  Device ID: 7026204040

🌍 Globe icon clicked!
  Car ID: null

📦 GPS Modal - Booking data received: {...}
🚗 Extracted car ID: null
📦 Car object: {car_id: 4, make: '...', model: '...'}  ← This will tell us the real car_id
🧪 Effective car ID (with fallback): 4

🚗 GPS Modal Opened for Car ID: 4

📡 Fetching telemetry data...
  URL: https://flespi.io/gw/devices/7026204040/telemetry
  Auth header: FlespiToken tfff4uBX5HMofADE...
  Response status: 200 OK  ← Should be 200, not CORS error!
✅ Telemetry data received: {result: [...]}
📍 GPS Position: {lat: 14.xxxx, lon: 120.xxxx}

📜 Fetching message history...
  Response status: 200 OK
✅ Message history received
```

## If Still Getting CORS Error

### Option 1: Verify Token in Flespi Panel
1. Go to https://flespi.io/
2. Login
3. Go to "Tokens" section
4. Check if your token is active
5. Verify it has these permissions:
   - ✅ `gw/devices/{selector}/telemetry` - READ
   - ✅ `gw/devices/{selector}/messages` - READ

### Option 2: Try Without "FlespiToken" Prefix in .env

If the issue persists, try removing "FlespiToken" from your `.env`:

**Change from:**
```env
VITE_FLESPI_TOKEN=FlespiToken tfff4uBX5HMofADE3JSlZuNVMrCfTgAAmrFfhiajzxMmKUOX93V0dK8pyJ6gm8pC
```

**To:**
```env
VITE_FLESPI_TOKEN=tfff4uBX5HMofADE3JSlZuNVMrCfTgAAmrFfhiajzxMmKUOX93V0dK8pyJ6gm8pC
```

Then restart the server. The code will automatically add "FlespiToken " prefix.

### Option 3: Test Token Directly

Open a new browser tab and try this in the console:

```javascript
fetch('https://flespi.io/gw/devices/7026204040/telemetry', {
  headers: {
    'Authorization': 'FlespiToken tfff4uBX5HMofADE3JSlZuNVMrCfTgAAmrFfhiajzxMmKUOX93V0dK8pyJ6gm8pC',
    'Accept': 'application/json'
  }
})
.then(r => r.json())
.then(d => console.log('Success:', d))
.catch(e => console.error('Error:', e));
```

If this works, the issue is in our code. If this also gives CORS error, the issue is with Flespi token/permissions.

## Quick Test

**Just refresh the browser and try again!** The CORS error should be gone now. 🎉

---

**Date:** October 14, 2025  
**Fix:** Authorization header now uses token correctly  
**Status:** Ready to test
