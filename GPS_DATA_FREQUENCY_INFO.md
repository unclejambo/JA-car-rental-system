# GPS Data Point Generation Frequency 📡

## Overview
GPS tracking points are generated and transmitted by the GPS device installed in the vehicle. The frequency depends on several factors related to the GPS hardware and its configuration.

## Current Device Information
- **Device ID**: 7060788
- **IMEI**: 7026204040
- **Protocol**: HQ (Chinese GPS tracker)
- **Platform**: Flespi

## GPS Point Generation Frequency

### Typical Frequencies
Based on your GPS tracker (HQ protocol), points are typically generated:

1. **When Vehicle is Moving**
   - Every 10-30 seconds (most common)
   - Every 50-100 meters traveled
   - Or a combination of both (time + distance)

2. **When Vehicle is Stationary**
   - Every 1-5 minutes (to conserve battery/data)
   - Or no transmission at all (sleep mode)

3. **Special Events**
   - Engine on/off
   - Ignition changes
   - Sharp turns
   - Sudden acceleration/braking
   - Geofence entry/exit (if configured)

### Your Current Data
Looking at the **50 GPS points** collected in your history:
- **Time Range**: 869 minutes (14.5 hours)
- **Average**: ~1 point every 17 minutes
- **Status**: Device appears to be stationary or in power-saving mode

This suggests your GPS device is configured with:
- **Low-frequency reporting** (every 15-20 minutes)
- **Or stationary detection** (reduces frequency when not moving)

## How to Check/Change Frequency

### Option 1: Via Flespi Panel
1. Login to https://flespi.io
2. Go to **Telematics Hub** → **Devices**
3. Find device `7060788`
4. Click **Settings** or **Configuration**
5. Look for parameters like:
   - `upload.interval` - How often to send data
   - `upload.distance` - Send after X meters traveled
   - `sleep.timeout` - How long before entering sleep mode

### Option 2: Via SMS Commands (Most Common)
Many GPS trackers support SMS configuration:

**Check current settings:**
```
SMS to device number: status#
```

**Set reporting interval (example):**
```
SMS: upload,30,s#    (Send every 30 seconds)
SMS: upload,60,s#    (Send every 60 seconds)
SMS: upload,300,s#   (Send every 5 minutes)
```

**Set distance interval (example):**
```
SMS: distance,100#   (Send every 100 meters)
```

**Set tracking mode:**
```
SMS: track,time#     (Time-based tracking)
SMS: track,distance# (Distance-based tracking)
SMS: track,smart#    (Smart mode - combination)
```

### Option 3: Via Mobile App
Some GPS trackers have companion apps that allow configuration:
- Check if your device manufacturer provides an app
- Usually found on Google Play / App Store
- Search for device IMEI or manufacturer name

## Recommended Settings for Car Rental

### For Active Rentals (High Frequency)
```
- Interval: 30 seconds to 1 minute
- Distance: 100-200 meters
- Mode: Smart (time + distance)
```
**Pros**: Detailed route tracking, real-time location
**Cons**: Higher data usage, more battery consumption

### For Parked/Standby (Low Frequency)
```
- Interval: 5-15 minutes
- Distance: 500 meters
- Mode: Power saving
```
**Pros**: Lower data/battery usage
**Cons**: Less detailed tracking

### Balanced Configuration (Recommended)
```
- Moving: Every 30 seconds OR every 100 meters
- Stationary: Every 5 minutes
- Events: Ignition on/off, sharp turns
```

## Impact on Your System

### Current Setup (Low Frequency)
With your current ~17 minute intervals:
- ✅ Good for: Tracking daily location history
- ✅ Good for: Verifying car was used/moved
- ❌ Not ideal for: Real-time tracking during trips
- ❌ Not ideal for: Detailed route visualization

### High Frequency Setup (30 seconds)
If you increase to 30-second intervals:
- ✅ Excellent real-time tracking
- ✅ Detailed route history with smooth lines
- ✅ Better for detecting stops, speed changes
- ⚠️ More data storage needed (50 points × 48 = 2,400 points/day)
- ⚠️ Higher cellular data usage

## Data Storage Considerations

### Flespi Message Retention
- **Free Tier**: Messages retained for limited time
- **Paid Plans**: Longer retention periods
- **Current**: You fetch last 50 messages
- **Recommendation**: Increase to 100-500 if frequency increases

### Database Storage
If you want to store GPS history in your own database:

```sql
-- Add GPS history table
CREATE TABLE gps_history (
  id SERIAL PRIMARY KEY,
  car_id INT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2),
  direction INT,
  altitude INT,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (car_id) REFERENCES cars(car_id)
);

-- Index for fast queries
CREATE INDEX idx_gps_car_timestamp ON gps_history(car_id, timestamp DESC);
```

Then periodically fetch and store GPS data from Flespi.

## Testing & Verification

### Check if Configuration Changed
After updating GPS frequency settings:

1. **Wait 2-3 minutes** (for settings to take effect)
2. **Move the car** (if testing movement-based reporting)
3. **Refresh GPS modal** in your system
4. **Check time gaps** between consecutive points:
   ```
   Point #50: 12:51:25 PM
   Point #49: 12:50:55 PM  ← 30 seconds gap ✅
   Point #48: 12:50:25 PM  ← 30 seconds gap ✅
   ```

### Monitor Data Quality
- **Position Valid**: Should show ✅ Valid
- **Speed**: Should reflect actual movement
- **Direction**: Should change with turns
- **Timestamp**: Should be recent (within minutes)

## Common Issues & Solutions

### Issue: Long Time Gaps Between Points
**Causes:**
- Device in power-saving mode
- Poor GPS/cellular signal
- Device turned off
- SIM card data exhausted

**Solutions:**
1. Check device has power
2. Verify SIM card has active data plan
3. Move vehicle to open area (better signal)
4. Reconfigure reporting frequency

### Issue: Points Not Updating
**Causes:**
- Device offline
- Flespi account issue
- Token expired

**Solutions:**
1. Check device LED indicators
2. Verify Flespi panel shows device online
3. Check token expiry date (yours expires 2026/12/31)

### Issue: Inaccurate Positions
**Causes:**
- GPS signal blocked (tunnels, buildings)
- Device antenna issue
- Cold start (first fix after long time)

**Solutions:**
1. Wait for GPS warm-up (1-5 minutes)
2. Ensure clear view of sky
3. Check device installation

## Cost Implications

### Data Usage Estimation

**Low Frequency (15 minutes):**
- Points per day: ~96
- Data per point: ~500 bytes
- Daily data: ~48 KB
- Monthly data: ~1.4 MB

**High Frequency (30 seconds):**
- Points per day: ~2,880
- Data per point: ~500 bytes
- Daily data: ~1.4 MB
- Monthly data: ~42 MB

### Cellular Plan Considerations
- Ensure SIM card has adequate data plan
- Most GPS trackers use minimal data
- Even high-frequency tracking uses <50 MB/month

## Recommendations for Your System

### Immediate Actions
1. **Check device configuration** via Flespi panel
2. **Test with moving car** to see if frequency increases during movement
3. **Consider increasing frequency** to 1-2 minutes for active rentals

### Long-Term Improvements
1. **Implement backend storage** of GPS history
2. **Add real-time alerts**:
   - Speed limit violations
   - Geofence exits
   - After-hours usage
3. **Add trip reports**:
   - Start/end locations
   - Total distance
   - Average speed
   - Stops duration

### For Active Rentals
When car is rented and in use:
- **Increase frequency** to 30-60 seconds
- **Enable real-time tracking**
- **Set up alerts** for unusual activity

### For Parked/Available Cars
When car is at depot:
- **Reduce frequency** to 10-15 minutes
- **Enable power saving** mode
- **Focus on** security alerts (movement, ignition)

## Contact Device Manufacturer

If you need to adjust settings and don't have the configuration manual:

1. **Find device model**: Check device label/packaging
2. **Search manufacturer**: Look up by IMEI or model
3. **Get support**: Most manufacturers provide SMS command lists
4. **Common brands** for HQ protocol:
   - Coban
   - Concox
   - Jimi
   - Eelink

---

**Summary**: Your GPS points are currently generated every ~17 minutes, which is suitable for general location tracking but not ideal for real-time monitoring. For active rental tracking, consider increasing frequency to 30-60 seconds. The exact method depends on your GPS device model and can be configured via SMS, app, or Flespi panel.
