# GPS Device ID Fix - RESOLVED ✅

## Issue Summary
The GPS tracking was failing with 403/404 errors because we were using the **wrong device ID**.

## Root Cause
- **Wrong ID Used**: `7026204040` (IMEI/identifier)
- **Correct ID**: `7060788` (Flespi internal device ID)

### Understanding Flespi IDs
In Flespi, there are **two different identifiers**:

1. **Device ID** (internal): `7060788`
   - This is Flespi's internal database ID
   - Used in ALL API calls: `/gw/devices/{device-id}/messages`
   - Found via: `GET https://flespi.io/gw/devices/all`

2. **Device Ident** (IMEI): `7026204040`
   - This is the tracker's IMEI or hardware identifier
   - Stored in device configuration: `configuration.ident`
   - NOT used in API endpoints

## Token Validation ✅
The Flespi token is **working perfectly**. Validation results:

```json
{
  "access": {"type": 1},  // Master token (full admin)
  "accessed": 1760416212,
  "blocked": 0,
  "cid": 2198394,
  "enabled": true,
  "expire": 1798688933,   // Expires: 2026/12/31
  "id": 82657195,
  "info": "Master",
  "ttl": 31536000
}
```

**No permission issues** - the token is a Master token with full access.

## GPS Data Confirmed ✅
Successfully fetched GPS messages from device `7060788`:

```json
{
  "position.latitude": 10.257683,
  "position.longitude": 123.97075,
  "position.direction": 60,
  "position.speed": 0,
  "position.valid": true,
  "engine.ignition.status": false,
  "timestamp": 1760352142,
  "ident": "7026204040"
}
```

**Location**: Philippines (10.2577°N, 123.9708°E)

## Fix Applied

### Updated `.env` Configuration
Changed from:
```env
VITE_FLESPI_DEVICE_ID=7026204040  ❌ IMEI (wrong)
```

To:
```env
VITE_FLESPI_DEVICE_ID=7060788  ✅ Device ID (correct)
```

### Files Modified
- `frontend/.env` - Updated device ID from `7026204040` to `7060788`

## Testing Steps

1. **Restart the frontend dev server** (environment variables changed):
   ```powershell
   cd frontend
   npm start
   ```

2. **Open the GPS tracking modal**:
   - Navigate to Admin Schedule page
   - Find an "In Progress" booking for Car ID 4
   - Click the globe icon 🌍

3. **Expected Console Output**:
   ```
   ✅ Response status: 200 OK
   📡 Telemetry data: {...}
   📍 GPS Messages received: 10 items
   ```

4. **Expected Map Display**:
   - Map centered on Philippines (10.2577°N, 123.9708°E)
   - Red car marker at current location
   - Route history showing recent positions
   - Vehicle data tab showing ignition status, speed, etc.

## API Endpoints (Correct Usage)

### ✅ Correct - Using Device ID (7060788)
```javascript
// Telemetry (current state)
GET https://flespi.io/gw/devices/7060788/telemetry

// Message history
GET https://flespi.io/gw/devices/7060788/messages?data={"count":50}

// Device info
GET https://flespi.io/gw/devices/7060788
```

### ❌ Incorrect - Using IMEI (7026204040)
```javascript
// These will return 404 Not Found
GET https://flespi.io/gw/devices/7026204040/telemetry  ❌
GET https://flespi.io/gw/devices/7026204040/messages   ❌
```

## How to Find Device ID in Future

If you add more GPS trackers, get the device ID from Flespi:

### Method 1: Flespi Panel (UI)
1. Login to https://flespi.io
2. Go to **Telematics Hub** → **Devices**
3. Find your device by name or IMEI
4. The **ID column** shows the device ID (e.g., `7060788`)

### Method 2: API Call
```bash
curl -H "Authorization: FlespiToken YOUR_TOKEN" \
  https://flespi.io/gw/devices/all
```

Response:
```json
{
  "result": [
    {
      "id": 7060788,                    // ← Device ID (use this)
      "configuration": {
        "ident": "7026204040"            // ← IMEI (display only)
      }
    }
  ]
}
```

## Database Update Recommendation

Update your database to store both IDs:

```sql
-- Add column to cars table
ALTER TABLE cars ADD COLUMN gps_device_id VARCHAR(50);
ALTER TABLE cars ADD COLUMN gps_device_imei VARCHAR(50);

-- Update Car ID 4
UPDATE cars 
SET gps_device_id = '7060788',
    gps_device_imei = '7026204040'
WHERE car_id = 4;
```

Then update `GPSTrackingModal.jsx` to fetch device ID from database:
```javascript
// Instead of hardcoded VITE_FLESPI_DEVICE_ID
const deviceId = car.gps_device_id || import.meta.env.VITE_FLESPI_DEVICE_ID;
```

## Security Note - Master Token in Frontend ⚠️

**Current Setup**: Master token in browser (not recommended for production)

**Flespi's Recommendation**: Create an **ACL token** with read-only access:

```bash
curl -X POST \
  -H "Authorization: FlespiToken tfff4uBX5HMofADE3JSlZuNVMrCfTgAAmrFfhiajzxMmKUOX93V0dK8pyJ6gm8pC" \
  -H "Content-Type: application/json" \
  "https://flespi.io/platform/tokens?fields=id,key,expire,ttl,access" \
  -d '[{
    "info": "Website-readonly",
    "ttl": 2592000,
    "access": {
      "type": 2,
      "acl": [{
        "uri": "gw/devices",
        "methods": ["GET"],
        "ids": "all",
        "submodules": [
          {"name":"messages","methods":["GET"]},
          {"name":"telemetry","methods":["GET"]}
        ]
      }]
    },
    "origins": [{"preset":"flespi"}]
  }]'
```

This creates a read-only token that can:
- ✅ Read device messages
- ✅ Read telemetry data
- ❌ Cannot create/modify/delete devices
- ❌ Cannot access account settings

Replace the Master token with the ACL token in `.env` for production deployment.

## Verification Checklist

- [x] Token validated (`GET /auth/info`) - ✅ Working
- [x] Device ID corrected (`7026204040` → `7060788`)
- [x] GPS messages fetched successfully
- [x] Location data confirmed (Philippines)
- [x] Frontend `.env` updated
- [ ] Frontend dev server restarted (user must do)
- [ ] GPS modal tested in browser
- [ ] Map displays car location
- [ ] Route history renders correctly
- [ ] Auto-refresh working (30 seconds)

## Next Steps

1. **Restart frontend**: `cd frontend; npm start`
2. **Test GPS tracking**: Click globe icon on In Progress booking
3. **Consider ACL token**: Create read-only token for production
4. **Update database**: Add `gps_device_id` column to cars table
5. **Add more GPS devices**: Use device ID (not IMEI) in configuration

---

**Status**: ✅ FIXED - Ready for testing
**Issue**: Wrong device ID (IMEI vs Device ID)
**Solution**: Updated `.env` with correct Flespi device ID (7060788)
