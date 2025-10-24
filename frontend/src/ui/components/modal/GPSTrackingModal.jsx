import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Chip,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  HiLocationMarker,
  HiClock,
  HiInformationCircle,
  HiArrowNarrowRight,
} from 'react-icons/hi';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom car icon
const carIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to auto-center map on new data
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Flespi configuration (move to environment variables in production)
const FLESPI_CONFIG = {
  token: import.meta.env.VITE_FLESPI_TOKEN || 'YOUR_FLESPI_TOKEN_HERE',
  baseUrl: 'https://flespi.io/gw',
  deviceId: import.meta.env.VITE_FLESPI_DEVICE_ID || null, // Device ID for the car with GPS
};

// Debug: Log configuration on load

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`gps-tabpanel-${index}`}
      aria-labelledby={`gps-tab-${index}`}
      {...other}
    >
      {value === index && <>{children}</>}
    </div>
  );
}

const GPSTrackingModal = ({ open, onClose, booking }) => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  const [messageHistory, setMessageHistory] = useState([]);
  const [mapCenter, setMapCenter] = useState([14.5995, 120.9842]); // Manila default
  const [mapZoom, setMapZoom] = useState(13);
  const [route, setRoute] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null); // For showing map of selected point

  // Extract car ID and GPS status from booking data
  const carId = booking?.car_id || booking?.carId || booking?.car?.car_id || null;
  const hasGPSFromDB = booking?.car?.hasGPS || booking?.hasGPS || false;
  
  // Debug: Log booking data to see what's available
  
  // Only allow GPS tracking if car ID exists and car has GPS enabled
  const hasGPS = carId && hasGPSFromDB;
  
  // If no car ID, show error
  if (!carId) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>GPS Tracking Error</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            Unable to identify car for GPS tracking. Car ID is missing from booking data.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
  
  // If car doesn't have GPS, show error
  if (!hasGPSFromDB) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>GPS Not Available</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Car ID {carId} does not have GPS tracking enabled. Please contact administrator to enable GPS for this vehicle.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Fetch latest GPS position from messages (using messages endpoint instead of telemetry due to CORS)
  const fetchLivePosition = async () => {
    if (!hasGPS || !FLESPI_CONFIG.deviceId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch just the latest message for live tracking
      const url = `${FLESPI_CONFIG.baseUrl}/devices/${FLESPI_CONFIG.deviceId}/messages?data=${JSON.stringify({ count: 1, reverse: true })}`;
      
      const authHeader = FLESPI_CONFIG.token.startsWith('FlespiToken') 
        ? FLESPI_CONFIG.token 
        : `FlespiToken ${FLESPI_CONFIG.token}`;
      
      
      const response = await fetch(url, {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
        },
      });


      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.result && data.result.length > 0) {
        const latestMsg = data.result[0];
        
        // Store as telemetry data for compatibility
        setTelemetryData(latestMsg);

        // Update map center if we have position data
        if (latestMsg['position.latitude'] && latestMsg['position.longitude']) {
          const lat = latestMsg['position.latitude'];
          const lon = latestMsg['position.longitude'];
          setMapCenter([lat, lon]);
          setMapZoom(15);
        } else {
        }
      } else {
        setError('Device is not transmitting GPS data');
      }
    } catch (err) {
      setError(`Failed to fetch GPS data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch message history (GPS tracking history)
  const fetchMessageHistory = async () => {
    if (!hasGPS || !FLESPI_CONFIG.deviceId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `${FLESPI_CONFIG.baseUrl}/devices/${FLESPI_CONFIG.deviceId}/messages?data=${JSON.stringify({ count: 50, reverse: true })}`;
      
      // Token already includes "FlespiToken" prefix from .env
      const authHeader = FLESPI_CONFIG.token.startsWith('FlespiToken') 
        ? FLESPI_CONFIG.token 
        : `FlespiToken ${FLESPI_CONFIG.token}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
        },
      });


      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.result && data.result.length > 0) {
        setMessageHistory(data.result);

        // Build route from message history
        const routePoints = data.result
          .filter(msg => msg['position.latitude'] && msg['position.longitude'])
          .map(msg => [msg['position.latitude'], msg['position.longitude']]);
        
        setRoute(routePoints);
      } else {
      }
    } catch (err) {
      setError(`Failed to fetch GPS history: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (open && hasGPS) {
      
      fetchLivePosition();
      fetchMessageHistory();

      // Set up auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchLivePosition();
      }, 30000);

      return () => {
        clearInterval(interval);
      };
    } else if (open && !hasGPS) {
    }
  }, [open, hasGPS]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    fetchLivePosition();
    fetchMessageHistory();
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Format speed
  const formatSpeed = (speed) => {
    if (speed === null || speed === undefined) return 'N/A';
    return `${Math.round(speed)} km/h`;
  };

  // Get direction label from degrees
  const getDirectionLabel = (degrees) => {
    if (degrees === null || degrees === undefined) return '';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  // Get current location from latest GPS message
  const getCurrentLocation = () => {
    if (!telemetryData) return null;
    
    // Handle both message format (direct values) and telemetry format (value objects)
    const lat = telemetryData['position.latitude']?.value || telemetryData['position.latitude'];
    const lon = telemetryData['position.longitude']?.value || telemetryData['position.longitude'];
    
    if (lat && lon) {
      return { lat, lon };
    }
    return null;
  };

  const currentLocation = getCurrentLocation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '900px',
        },
      }}
    >
      <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <HiLocationMarker size={24} />
        <Typography variant="h6" component="span">
          GPS Tracking - {booking?.car?.make || 'Car'} {booking?.car?.model || ''} {booking?.car?.license_plate ? `(${booking.car.license_plate})` : `(Car ID ${carId})`}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* GPS Not Installed Warning */}
        {!hasGPS && (
          <Box sx={{ p: 3 }}>
            <Alert severity="warning" icon={<HiInformationCircle size={24} />}>
              <Typography variant="h6" gutterBottom>
                GPS Not Yet Installed
              </Typography>
              <Typography>
                This vehicle does not have GPS tracking installed. Please contact the administrator to install GPS tracking for this vehicle.
              </Typography>
            </Alert>
          </Box>
        )}

        {/* GPS Installed - Show Tracking Data */}
        {hasGPS && (
          <>
            {/* Error Alert */}
            {error && (
              <Box sx={{ p: 2 }}>
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              </Box>
            )}

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="GPS tracking tabs">
                <Tab label="Live Tracking" icon={<HiLocationMarker />} iconPosition="start" />
                <Tab label="Route History" icon={<HiClock />} iconPosition="start" />
              </Tabs>
            </Box>

            {/* Live Tracking Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ height: '500px', position: 'relative' }}>
                {loading && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(255, 255, 255, 0.8)',
                      zIndex: 1000,
                    }}
                  >
                    <CircularProgress />
                  </Box>
                )}

                {currentLocation ? (
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapUpdater center={mapCenter} zoom={mapZoom} />
                    <Marker position={[currentLocation.lat, currentLocation.lon]} icon={carIcon}>
                      <Popup>
                        <Box sx={{ minWidth: 200 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            Current Location
                          </Typography>
                          <Typography variant="body2">
                            Speed: {formatSpeed(telemetryData?.['position.speed']?.value || telemetryData?.['position.speed'])}
                          </Typography>
                          <Typography variant="body2">
                            Last Update: {formatTimestamp(telemetryData?.timestamp?.value || telemetryData?.timestamp)}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                            Lat: {currentLocation.lat.toFixed(6)}, Lon: {currentLocation.lon.toFixed(6)}
                          </Typography>
                        </Box>
                      </Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography color="text.secondary">
                      {loading ? 'Loading GPS data...' : 'No GPS data available'}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Live Stats */}
              {telemetryData && (
                <Paper sx={{ p: 2, mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Speed
                      </Typography>
                      <Typography variant="h6">
                        {formatSpeed(telemetryData['position.speed']?.value || telemetryData['position.speed'])}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Direction
                      </Typography>
                      <Typography variant="h6">
                        {(telemetryData['position.direction']?.value || telemetryData['position.direction'])
                          ? `${Math.round(telemetryData['position.direction']?.value || telemetryData['position.direction'])}°`
                          : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Altitude
                      </Typography>
                      <Typography variant="h6">
                        {(telemetryData['position.altitude']?.value || telemetryData['position.altitude'])
                          ? `${Math.round(telemetryData['position.altitude']?.value || telemetryData['position.altitude'])} m`
                          : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Last Update
                      </Typography>
                      <Typography variant="body2">
                        {formatTimestamp(telemetryData.timestamp?.value || telemetryData.timestamp)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </TabPanel>

            {/* Route History Tab */}
            <TabPanel value={tabValue} index={1}>
              {loading && (
                <Box
                  sx={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                  }}
                >
                  <CircularProgress />
                </Box>
              )}

              {messageHistory.length > 0 ? (
                <Box sx={{ maxHeight: '600px', overflow: 'auto', overflowX: 'hidden' }}>
                  {/* GPS History List - Full Width */}
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="h6" fontWeight="bold">
                        GPS Route History
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Showing {messageHistory.length} GPS positions • Click to view on map
                      </Typography>
                    </Box>
                    
                    <List 
                      sx={{ 
                        px: 0,
                        py: 1,
                      }}
                    >
                          {messageHistory.map((msg, index) => {
                            const lat = msg['position.latitude'];
                            const lon = msg['position.longitude'];
                            const speed = msg['position.speed'];
                            const direction = msg['position.direction'];
                            const altitude = msg['position.altitude'];
                            const timestamp = msg.timestamp;
                            const isLatest = index === 0;
                            const isSelected = selectedPoint?.index === index;

                            return (
                              <React.Fragment key={index}>
                                <ListItem
                                  onClick={() => setSelectedPoint({ index, lat, lon, msg })}
                                  sx={{
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    bgcolor: isSelected 
                                      ? 'rgba(25, 118, 210, 0.15)' 
                                      : isLatest 
                                        ? 'rgba(25, 118, 210, 0.08)' 
                                        : 'transparent',
                                    borderLeft: isSelected ? 4 : isLatest ? 4 : 0,
                                    borderColor: isSelected ? 'success.main' : 'primary.main',
                                    py: 2,
                                    px: 3,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    overflow: 'hidden',
                                    '&:hover': {
                                      bgcolor: isSelected 
                                        ? 'rgba(25, 118, 210, 0.2)' 
                                        : 'rgba(0, 0, 0, 0.04)',
                                      transform: 'translateX(4px)',
                                    },
                                  }}
                                >
                                  {/* Header Row */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                                    <HiLocationMarker 
                                      size={20} 
                                      color={isSelected ? '#2e7d32' : isLatest ? '#1976d2' : '#666'}
                                    />
                                    <Typography 
                                      variant="subtitle1" 
                                      fontWeight={isLatest || isSelected ? 'bold' : 'medium'}
                                      sx={{ ml: 1, flex: 1 }}
                                    >
                                      {isLatest && (
                                        <Chip 
                                          label="CURRENT POSITION" 
                                          size="small" 
                                          color="primary" 
                                          sx={{ mr: 1, height: '22px', fontSize: '0.7rem', fontWeight: 'bold' }} 
                                        />
                                      )}
                                      {isSelected && !isLatest && (
                                        <Chip 
                                          label="VIEWING" 
                                          size="small" 
                                          color="success" 
                                          sx={{ mr: 1, height: '22px', fontSize: '0.7rem', fontWeight: 'bold' }} 
                                        />
                                      )}
                                      Point #{messageHistory.length - index}
                                    </Typography>
                                    <Chip 
                                      label={formatSpeed(speed)} 
                                      size="small"
                                      color={speed > 0 ? 'success' : 'default'}
                                      sx={{ fontWeight: 'bold' }}
                                    />
                                  </Box>
                                  
                                  {/* Timestamp */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 3, mb: 1 }}>
                                    <HiClock size={16} style={{ marginRight: '8px', color: '#666' }} />
                                    <Typography variant="body2" color="text.secondary">
                                      {formatTimestamp(timestamp)}
                                    </Typography>
                                  </Box>
                                  
                                  {/* GPS Coordinates */}
                                  <Box sx={{ ml: 3, mb: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                                      📍 <strong>{lat?.toFixed(6)}, {lon?.toFixed(6)}</strong>
                                    </Typography>
                                  </Box>

                                  {/* Additional Info - Inline Display */}
                                  <Box sx={{ ml: 3, mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    {direction !== undefined && direction !== null && (
                                      <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                          Direction
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                          {Math.round(direction)}° {getDirectionLabel(direction)}
                                        </Typography>
                                      </Box>
                                    )}
                                    
                                    {altitude !== undefined && altitude !== null && (
                                      <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                          Altitude
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                          {Math.round(altitude)} m
                                        </Typography>
                                      </Box>
                                    )}

                                    <Box>
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Status
                                      </Typography>
                                      <Typography variant="body2" fontWeight="medium">
                                        {msg['position.valid'] ? '✅ Valid' : '⚠️ Invalid'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </ListItem>
                                
                                {/* Show map right after the selected item */}
                                {isSelected && (
                                  <Box sx={{ px: 3, py: 2, bgcolor: '#f0f0f0' }}>
                                    <Paper 
                                      elevation={3} 
                                      sx={{ 
                                        height: '400px', 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        border: 2,
                                        borderColor: 'success.main',
                                      }}
                                    >
                                      {/* Map Header */}
                                      <Box 
                                        sx={{ 
                                          p: 2, 
                                          bgcolor: 'success.main', 
                                          color: 'white',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                        }}
                                      >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <HiLocationMarker size={20} />
                                          <Typography variant="subtitle1" fontWeight="bold">
                                            Map View - Point #{messageHistory.length - index}
                                          </Typography>
                                        </Box>
                                        <Button 
                                          size="small" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedPoint(null);
                                          }}
                                          sx={{ 
                                            color: 'white', 
                                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' } 
                                          }}
                                        >
                                          ✕ Close Map
                                        </Button>
                                      </Box>

                                      {/* Map */}
                                      <Box sx={{ flexGrow: 1, position: 'relative' }}>
                                        <MapContainer
                                          center={[lat, lon]}
                                          zoom={16}
                                          style={{ height: '100%', width: '100%' }}
                                          key={`map-${index}`}
                                        >
                                          <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                          />
                                          <Marker position={[lat, lon]} icon={carIcon}>
                                            <Popup>
                                              <Box sx={{ minWidth: 200 }}>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                  Point #{messageHistory.length - index}
                                                </Typography>
                                                <Divider sx={{ my: 1 }} />
                                                <Typography variant="body2">
                                                  Speed: {formatSpeed(speed)}
                                                </Typography>
                                                <Typography variant="body2">
                                                  Direction: {direction 
                                                    ? `${Math.round(direction)}° ${getDirectionLabel(direction)}`
                                                    : 'N/A'}
                                                </Typography>
                                                {altitude && (
                                                  <Typography variant="body2">
                                                    Altitude: {Math.round(altitude)} m
                                                  </Typography>
                                                )}
                                                <Typography variant="body2">
                                                  Time: {formatTimestamp(timestamp)}
                                                </Typography>
                                                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                                  {lat.toFixed(6)}, {lon.toFixed(6)}
                                                </Typography>
                                              </Box>
                                            </Popup>
                                          </Marker>
                                        </MapContainer>
                                      </Box>

                                      {/* Map Footer Info */}
                                      <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderTop: 1, borderColor: 'divider' }}>
                                        <Grid container spacing={1}>
                                          <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                              Speed
                                            </Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                              {formatSpeed(speed)}
                                            </Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                              Time
                                            </Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                              {new Date(timestamp * 1000).toLocaleTimeString('en-PH')}
                                            </Typography>
                                          </Grid>
                                        </Grid>
                                      </Box>
                                    </Paper>
                                  </Box>
                                )}
                                
                                {index < messageHistory.length - 1 && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', pl: 3, py: 0.5, bgcolor: '#fafafa' }}>
                                    <HiArrowNarrowRight size={16} color="#1976d2" />
                                    <Divider sx={{ flex: 1, ml: 1, borderStyle: 'dashed', borderColor: '#1976d2' }} />
                                  </Box>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </List>
                      </Paper>
                    </Box>
              ) : (
                <Box
                  sx={{
                    height: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3,
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <HiLocationMarker size={48} color="#ccc" style={{ marginBottom: '16px' }} />
                    <Typography variant="h6" color="text.secondary">
                      {loading ? 'Loading route history...' : 'No route history available'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {!loading && 'GPS device may not have transmitted any data yet'}
                    </Typography>
                  </Box>
                </Box>
              )}
            </TabPanel>
          </>
        )}
      </DialogContent>      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f5f5f5' }}>
        {hasGPS && (
          <Button onClick={handleRefresh} disabled={loading} startIcon={loading && <CircularProgress size={16} />}>
            Refresh
          </Button>
        )}
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GPSTrackingModal;
