import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { HiBars3 } from 'react-icons/hi2';
import { useAuth } from '../../hooks/useAuth.js';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api.js';
import {
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Divider,
  Chip,
} from '@mui/material';
import {
  HiBell,
  HiBookOpen,
  HiXCircle,
  HiArrowsExpand,
  HiTruck,
  HiExclamationCircle,
} from 'react-icons/hi';
import '../../styles/components/header.css';

function Header({ onMenuClick = null, isMenuOpen = false }) {
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const { isAuthenticated, user, userRole, logout } = useAuth();
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);

  const authenticatedFetch = useMemo(
    () => createAuthenticatedFetch(logout),
    [logout]
  );
  const API_BASE = getApiBase();

  const getUserDisplayName = () => {
    if (userRole === 'admin') {
      return 'ADMIN';
    }

    // Try multiple possible property names for the first name
    const firstName =
      user?.firstName ||
      user?.first_name ||
      user?.name?.split(' ')[0] ||
      user?.fullName?.split(' ')[0];

    return firstName;
  };

  // Load profile image from cache or fetch once
  useEffect(() => {
    if (!isAuthenticated || !userRole) {
      // Clear cached data when not authenticated
      setProfileImageUrl(null);
      setHasLoadedProfile(false);
      sessionStorage.removeItem('profileImageUrl');
      sessionStorage.removeItem('profileImageCacheKey');
      return;
    }

    // Create a cache key based on user info and role
    const cacheKey = `${userRole}_${user?.id || user?.customer_id || user?.admin_id || user?.drivers_id}`;
    const cachedImageUrl = sessionStorage.getItem('profileImageUrl');
    const cachedKey = sessionStorage.getItem('profileImageCacheKey');

    // If we have cached data for the same user, use it
    if (cachedImageUrl && cachedKey === cacheKey && !hasLoadedProfile) {
      setProfileImageUrl(cachedImageUrl);
      setHasLoadedProfile(true);
      return;
    }

    // Only fetch if we haven't loaded for this session
    if (hasLoadedProfile) return;

    const fetchProfileImage = async () => {
      setIsLoadingImage(true);
      try {
        let endpoint = '';

        // Determine API endpoint based on user role
        if (userRole === 'admin' || userRole === 'staff') {
          endpoint = `${API_BASE}/api/admin-profile`;
        } else if (userRole === 'customer') {
          endpoint = `${API_BASE}/api/customer-profile`;
        } else if (userRole === 'driver') {
          endpoint = `${API_BASE}/api/driver-profile`;
        }

        if (!endpoint) return;

        const response = await authenticatedFetch(endpoint);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Handle different response structures
            const imageUrl =
              result.data.profile_img_url ||
              result.data.profileImageUrl ||
              result.data.profile_image_url ||
              null;

            if (imageUrl && imageUrl.trim() !== '') {
              setProfileImageUrl(imageUrl);
              // Cache the image URL and cache key
              sessionStorage.setItem('profileImageUrl', imageUrl);
              sessionStorage.setItem('profileImageCacheKey', cacheKey);
            }
          }
        }
      } catch (error) {
      } finally {
        setIsLoadingImage(false);
        setHasLoadedProfile(true);
      }
    };

    fetchProfileImage();
  }, [
    isAuthenticated,
    userRole,
    user,
    authenticatedFetch,
    API_BASE,
    hasLoadedProfile,
  ]);

  // Listen for profile image update events
  useEffect(() => {
    const handleProfileImageUpdate = (event) => {
      const { imageUrl } = event.detail;
      if (imageUrl) {
        setProfileImageUrl(imageUrl);
        // Update cache
        const cacheKey = `${userRole}_${user?.id || user?.customer_id || user?.admin_id || user?.drivers_id}`;
        sessionStorage.setItem('profileImageUrl', imageUrl);
        sessionStorage.setItem('profileImageCacheKey', cacheKey);
      }
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);

    return () => {
      window.removeEventListener(
        'profileImageUpdated',
        handleProfileImageUpdate
      );
    };
  }, [userRole, user]);

  // Admin notification fetching logic
  const fetchAdminNotifications = async () => {
    if (!isAuthenticated || (userRole !== 'admin' && userRole !== 'staff')) {
      setNotifications([]);
      setNotificationCount(0);
      return;
    }

    try {
      const [schedules, allBookings] = await Promise.all([
        authenticatedFetch(`${API_BASE}/schedules`).then(async (r) => {
          if (!r.ok) return [];
          const data = await r.json();
          return Array.isArray(data) ? data : data.data || [];
        }),
        authenticatedFetch(`${API_BASE}/bookings`).then(async (r) => {
          if (!r.ok) return [];
          const data = await r.json();
          return Array.isArray(data) ? data : data.data || [];
        }),
      ]);

      const notificationsList = [];
      const now = new Date();

      // Helper to check if booking is release candidate
      const isReleaseCandidate = (row) => {
        try {
          const status = (row.status || row.booking_status || '')
            .toString()
            .toLowerCase();
          // Only show for confirmed bookings (not yet released)
          if (status !== 'confirmed') return false;
          const pickup = row.pickup_time || row.start_date || row.startDate;
          if (!pickup) return false;
          const pickupTime = new Date(pickup);
          const diff = pickupTime - now;
          return diff <= 60 * 60 * 1000 && diff >= -60 * 60 * 1000;
        } catch (e) {
          return false;
        }
      };

      // Helper to check if booking is return candidate
      const isReturnCandidate = (row) => {
        try {
          const status = (row.status || row.booking_status || '')
            .toString()
            .toLowerCase();
          if (status === 'completed') return true;
          if (
            status === 'in progress' ||
            status === 'in_progress' ||
            status === 'ongoing'
          ) {
            const end = row.end_date || row.endDate || row.dropoff_time;
            if (!end) return false;
            const endTime = new Date(end);
            return endTime <= now;
          }
          return false;
        } catch (e) {
          return false;
        }
      };

      // Booking requests (pending)
      const bookingRequests = allBookings.filter(
        (booking) =>
          booking.booking_status === 'Pending' ||
          booking.booking_status === 'pending'
      );
      bookingRequests.forEach((booking) => {
        notificationsList.push({
          id: `booking-${booking.booking_id}`,
          type: 'booking',
          title: 'New Booking Request',
          message: `${booking.customer_name || 'Customer'} - ${booking.car_model || 'Car'}`,
          timestamp: new Date(booking.booking_date),
          link: '/manage-booking?tab=BOOKINGS',
        });
      });

      // Cancellation requests (sort by most recent updated_at)
      const cancellationRequests = allBookings.filter(
        (booking) => booking.isCancel
      );
      cancellationRequests.forEach((booking) => {
        notificationsList.push({
          id: `cancel-${booking.booking_id}`,
          type: 'cancellation',
          title: 'Cancellation Request',
          message: `${booking.customer_name || 'Customer'} - ${booking.car_model || 'Car'}`,
          timestamp: new Date(
            booking.updated_at || booking.booking_date || Date.now()
          ),
          link: '/manage-booking?tab=CANCELLATION',
        });
      });

      // Extension requests (sort by most recent updated_at)
      const extensionRequests = allBookings.filter(
        (booking) => booking.isExtend
      );
      extensionRequests.forEach((booking) => {
        notificationsList.push({
          id: `extend-${booking.booking_id}`,
          type: 'extension',
          title: 'Extension Request',
          message: `${booking.customer_name || 'Customer'} - ${booking.car_model || 'Car'}`,
          timestamp: new Date(
            booking.updated_at || booking.booking_date || Date.now()
          ),
          link: '/manage-booking?tab=EXTENSION',
        });
      });

      // For Release (within 1 hour of pickup)
      const forRelease = schedules.filter((schedule) =>
        isReleaseCandidate(schedule)
      );
      forRelease.forEach((schedule) => {
        const pickupTime = new Date(
          schedule.pickup_time || schedule.start_date
        );
        const isOverdue = pickupTime < now;
        notificationsList.push({
          id: `release-${schedule.booking_id}`,
          type: isOverdue ? 'overdue-release' : 'release',
          title: isOverdue ? 'Overdue Release' : 'Ready for Release',
          message: `${schedule.customer_name || 'Customer'} - ${schedule.car_model || 'Car'}`,
          timestamp: pickupTime,
          link: '/schedule?tab=RELEASE',
        });
      });

      // For Return (completed or past end time)
      const forReturn = schedules.filter((schedule) =>
        isReturnCandidate(schedule)
      );
      forReturn.forEach((schedule) => {
        const returnTime = new Date(schedule.dropoff_time || schedule.end_date);
        const isOverdue =
          returnTime < now &&
          schedule.booking_status?.toLowerCase() !== 'completed';
        notificationsList.push({
          id: `return-${schedule.booking_id}`,
          type: isOverdue ? 'overdue-return' : 'return',
          title: isOverdue ? 'Overdue Return' : 'Ready for Return',
          message: `${schedule.customer_name || 'Customer'} - ${schedule.car_model || 'Car'}`,
          timestamp: returnTime,
          link: '/schedule?tab=RETURN',
        });
      });

      // Sort by timestamp (newest first)
      notificationsList.sort((a, b) => b.timestamp - a.timestamp);

      // Filter out dismissed notifications
      const dismissedKey = `dismissedNotifications_admin_${user?.id || user?.admin_id}`;
      const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
      const filteredNotifications = notificationsList.filter(
        (n) => !dismissed.includes(n.id)
      );

      setNotifications(filteredNotifications);
      setNotificationCount(filteredNotifications.length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Customer notification fetching logic
  const fetchCustomerNotifications = async () => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/bookings/my-bookings/list`
      );
      if (!response.ok) return;

      const bookings = await response.json();
      const bookingsList = Array.isArray(bookings)
        ? bookings
        : bookings.data || [];

      const notificationsList = [];
      const now = Date.now();
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

      bookingsList.forEach((booking) => {
        const carName = booking.car_details?.display_name || 'car';

        // 1. Booking Approved (Confirmed) - redirect to Schedule Page
        if (booking.booking_status === 'Confirmed' && booking.updated_at) {
          const updatedTime = new Date(booking.updated_at);
          const timeSinceUpdate = now - updatedTime.getTime();
          if (timeSinceUpdate < SEVEN_DAYS) {
            notificationsList.push({
              id: `booking-approved-${booking.booking_id}`,
              type: 'booking-approved',
              title: 'Booking Approved ✓',
              message: `Admin approved your booking for ${carName}`,
              timestamp: updatedTime,
              link: '/customer-schedule',
            });
          }
        }

        // 2. Booking Rejected - redirect to Booking History, bookings tab
        if (booking.booking_status === 'Rejected' && booking.updated_at) {
          const updatedTime = new Date(booking.updated_at);
          const timeSinceUpdate = now - updatedTime.getTime();
          if (timeSinceUpdate < SEVEN_DAYS) {
            notificationsList.push({
              id: `booking-rejected-${booking.booking_id}`,
              type: 'booking-rejected',
              title: 'Booking Rejected ✗',
              message: `Your booking request for ${carName} was rejected`,
              timestamp: updatedTime,
              link: '/customer-bookings?tab=bookings',
            });
          }
        }

        // 3. Extension Approved - redirect to Schedule
        if (
          booking.extension_info?.extension_status === 'approved' &&
          booking.extension_info?.approve_time
        ) {
          const approveTime = new Date(booking.extension_info.approve_time);
          const timeSinceApproval = now - approveTime.getTime();
          if (timeSinceApproval < SEVEN_DAYS) {
            notificationsList.push({
              id: `extension-approved-${booking.booking_id}`,
              type: 'extension-approved',
              title: 'Extension Approved ✓',
              message: `Admin approved your extension request for ${carName}`,
              timestamp: approveTime,
              link: '/customer-schedule',
            });
          }
        }

        // 4. Extension Rejected - redirect to Schedule
        if (
          booking.extension_info?.extension_status === 'Rejected' &&
          booking.updated_at
        ) {
          const updatedTime = new Date(booking.updated_at);
          const timeSinceUpdate = now - updatedTime.getTime();
          if (timeSinceUpdate < SEVEN_DAYS) {
            notificationsList.push({
              id: `extension-rejected-${booking.booking_id}`,
              type: 'extension-rejected',
              title: 'Extension Rejected ✗',
              message: `Your extension request for ${carName} was rejected`,
              timestamp: updatedTime,
              link: '/customer-schedule',
            });
          }
        }

        // 5. Cancellation Approved - redirect to Booking History, bookings tab
        if (
          booking.booking_status === 'Cancelled' &&
          booking.isCancel &&
          booking.updated_at
        ) {
          const updatedTime = new Date(booking.updated_at);
          const timeSinceUpdate = now - updatedTime.getTime();
          if (timeSinceUpdate < SEVEN_DAYS) {
            notificationsList.push({
              id: `cancellation-approved-${booking.booking_id}`,
              type: 'cancellation-approved',
              title: 'Cancellation Approved ✓',
              message: `Admin approved your cancellation for ${carName}`,
              timestamp: updatedTime,
              link: '/customer-bookings?tab=bookings',
            });
          }
        }

        // 6. Payment Received/Confirmed - redirect to BookingHistory Payments tab
        if (booking.payment_info && booking.payment_info.length > 0) {
          booking.payment_info.forEach((payment) => {
            if (payment.paid_date) {
              const paidDate = new Date(payment.paid_date);
              const timeSincePayment = now - paidDate.getTime();
              if (timeSincePayment < SEVEN_DAYS) {
                notificationsList.push({
                  id: `payment-received-${payment.payment_id}`,
                  type: 'payment-received',
                  title: 'Payment Received ✓',
                  message: `Admin confirmed your ₱${payment.amount?.toLocaleString()} payment for ${carName}`,
                  timestamp: paidDate,
                  link: '/customer-bookings?tab=settlement',
                });
              }
            }
          });
        }
      });

      // Sort by timestamp (newest first)
      notificationsList.sort((a, b) => b.timestamp - a.timestamp);

      // Filter out dismissed notifications
      const dismissedKey = `dismissedNotifications_customer_${user?.id || user?.customer_id}`;
      const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
      const filteredNotifications = notificationsList.filter(
        (n) => !dismissed.includes(n.id)
      );

      setNotifications(filteredNotifications);
      setNotificationCount(filteredNotifications.length);
    } catch (error) {
      console.error('Failed to fetch customer notifications:', error);
    }
  };

  // Driver notification fetching logic
  const fetchDriverNotifications = async () => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/schedules/driver/me`
      );
      if (!response.ok) return;

      const schedules = await response.json();
      const schedulesList = Array.isArray(schedules)
        ? schedules
        : schedules.data || [];

      const notificationsList = [];
      const now = Date.now();
      const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
      const ONE_DAY = 24 * 60 * 60 * 1000;

      schedulesList.forEach((schedule) => {
        const carName = schedule.car_model || 'a vehicle';
        const customerName = schedule.customer_name || 'Customer';

        // 1. New Assignment - Recently assigned bookings
        if (schedule.booking_status === 'Confirmed' && schedule.updated_at) {
          const assignedTime = new Date(schedule.updated_at);
          const timeSinceAssignment = now - assignedTime.getTime();
          // Show if assigned within last 3 days
          if (timeSinceAssignment < THREE_DAYS) {
            notificationsList.push({
              id: `assigned-${schedule.booking_id}`,
              type: 'driver-assigned',
              title: 'New Assignment 🚗',
              message: `You've been assigned to drive ${carName} for ${customerName}`,
              timestamp: assignedTime,
              link: '/driver-schedule',
            });
          }
        }

        // 2. Upcoming Bookings - Bookings starting within next 24 hours
        if (
          (schedule.booking_status === 'Confirmed' ||
            schedule.booking_status === 'In Progress') &&
          schedule.start_date
        ) {
          const startDate = new Date(schedule.start_date);
          const timeUntilStart = startDate.getTime() - now;
          // Show if starting within next 24 hours and hasn't started yet
          if (timeUntilStart > 0 && timeUntilStart < ONE_DAY) {
            const hoursUntil = Math.floor(timeUntilStart / (1000 * 60 * 60));
            notificationsList.push({
              id: `upcoming-${schedule.booking_id}`,
              type: 'driver-upcoming',
              title: 'Upcoming Booking ⏰',
              message: `${carName} pickup in ${hoursUntil} hours - ${customerName}`,
              timestamp: startDate,
              link: '/driver-schedule',
            });
          }
        }

        // 3. Cancelled Assignment
        if (schedule.booking_status === 'Cancelled' && schedule.updated_at) {
          const cancelledTime = new Date(schedule.updated_at);
          const timeSinceCancellation = now - cancelledTime.getTime();
          if (timeSinceCancellation < THREE_DAYS) {
            notificationsList.push({
              id: `cancelled-${schedule.booking_id}`,
              type: 'driver-cancelled',
              title: 'Assignment Cancelled ✗',
              message: `Booking for ${carName} has been cancelled`,
              timestamp: cancelledTime,
              link: '/driver-schedule',
            });
          }
        }
      });

      // Sort by timestamp (newest first)
      notificationsList.sort((a, b) => b.timestamp - a.timestamp);

      // Filter out dismissed notifications
      const dismissedKey = `dismissedNotifications_driver_${user?.id || user?.drivers_id}`;
      const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
      const filteredNotifications = notificationsList.filter(
        (n) => !dismissed.includes(n.id)
      );

      setNotifications(filteredNotifications);
      setNotificationCount(filteredNotifications.length);
    } catch (error) {
      console.error('Failed to fetch driver notifications:', error);
    }
  };

  // Fetch notifications for admin, customer, and driver
  useEffect(() => {
    if (!isAuthenticated || !userRole) {
      setNotifications([]);
      setNotificationCount(0);
      return;
    }

    // Admin/Staff notifications
    if (userRole === 'admin' || userRole === 'staff') {
      fetchAdminNotifications();
      const interval = setInterval(fetchAdminNotifications, 60000);
      window.addEventListener('refreshNotifications', fetchAdminNotifications);
      return () => {
        clearInterval(interval);
        window.removeEventListener(
          'refreshNotifications',
          fetchAdminNotifications
        );
      };
    }

    // Customer notifications
    if (userRole === 'customer') {
      fetchCustomerNotifications();
      const interval = setInterval(fetchCustomerNotifications, 60000);
      window.addEventListener(
        'refreshNotifications',
        fetchCustomerNotifications
      );
      return () => {
        clearInterval(interval);
        window.removeEventListener(
          'refreshNotifications',
          fetchCustomerNotifications
        );
      };
    }

    // Driver notifications
    if (userRole === 'driver') {
      fetchDriverNotifications();
      const interval = setInterval(fetchDriverNotifications, 60000);
      window.addEventListener('refreshNotifications', fetchDriverNotifications);
      return () => {
        clearInterval(interval);
        window.removeEventListener(
          'refreshNotifications',
          fetchDriverNotifications
        );
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userRole]);

  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationItemClick = (notificationId) => {
    // Store dismissed notification ID in localStorage
    const dismissedKey = `dismissedNotifications_${userRole}_${user?.id || user?.customer_id || user?.admin_id || user?.drivers_id}`;
    const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');

    if (!dismissed.includes(notificationId)) {
      dismissed.push(notificationId);
      localStorage.setItem(dismissedKey, JSON.stringify(dismissed));
    }

    // Remove the clicked notification from the list
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    setNotificationCount((prev) => Math.max(0, prev - 1));
    handleNotificationClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      // Admin notifications
      case 'booking':
        return <HiBookOpen size={20} color="#c10007" />;
      case 'cancellation':
        return <HiXCircle size={20} color="#f44336" />;
      case 'extension':
        return <HiArrowsExpand size={20} color="#ff9800" />;
      case 'release':
        return <HiTruck size={20} color="#4caf50" />;
      case 'return':
        return <HiTruck size={20} color="#2196f3" />;
      case 'overdue-release':
      case 'overdue-return':
        return <HiExclamationCircle size={20} color="#f44336" />;

      // Customer notifications
      case 'booking-approved':
        return <HiBookOpen size={20} color="#4caf50" />;
      case 'booking-rejected':
        return <HiXCircle size={20} color="#f44336" />;
      case 'extension-approved':
        return <HiArrowsExpand size={20} color="#4caf50" />;
      case 'extension-rejected':
        return <HiArrowsExpand size={20} color="#f44336" />;
      case 'cancellation-approved':
        return <HiXCircle size={20} color="#4caf50" />;
      case 'payment-received':
        return <HiBookOpen size={20} color="#4caf50" />;

      // Driver notifications
      case 'driver-assigned':
        return <HiTruck size={20} color="#4caf50" />;
      case 'driver-upcoming':
        return <HiExclamationCircle size={20} color="#ff9800" />;
      case 'driver-cancelled':
        return <HiXCircle size={20} color="#f44336" />;

      default:
        return <HiBell size={20} />;
    }
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const open = Boolean(anchorEl);

  return (
    <header className="app-header">
      <div className="header-content">
        {isMobile && isAuthenticated && (
          <button
            className="menu-button"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            onClick={onMenuClick}
            disabled={!onMenuClick}
          >
            <HiBars3 size={28} />
          </button>
        )}
        <Link
          to={isAuthenticated ? '/' : '/home'}
          className="logo-link"
          aria-label="J&A Car Rental - Home"
        >
          <span className="logo-main-text">J&A</span>
          <span className="logo-sub-text">CAR RENTAL</span>
        </Link>

        {isAuthenticated && (
          <Link
            to={
              userRole === 'admin' || userRole === 'staff'
                ? '/settings'
                : userRole === 'driver'
                  ? '/driver-settings'
                  : '/customer-account'
            }
            className="user-profile-panel"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="profile-avatar">
              {isLoadingImage && (
                <div className="loading-avatar">
                  <div className="loading-spinner"></div>
                </div>
              )}
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className="avatar-image"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
            </div>
            {!isMobile && (
              <span
                className="profile-name"
                style={{
                  fontFamily: 'Pathway Gothic One, sans-serif',
                  fontSize: '1rem',
                }}
              >
                {getUserDisplayName()}
              </span>
            )}
          </Link>
        )}

        {/* Notification Bell - For Admin/Staff, Customer, and Driver */}
        {isAuthenticated && (
          <>
            <IconButton
              onClick={handleNotificationClick}
              sx={{
                color: '#fff',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                ml: 1,
              }}
            >
              <Badge badgeContent={notificationCount} color="error">
                <HiBell size={24} />
              </Badge>
            </IconButton>

            <Popover
              open={open}
              anchorEl={anchorEl}
              onClose={handleNotificationClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  width: 380,
                  maxHeight: 500,
                  mt: 1,
                  boxShadow: 3,
                },
              }}
            >
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Notifications
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {notificationCount} pending items
                </Typography>
              </Box>

              {notifications.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No new notifications
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
                  {notifications.map((notification, index) => (
                    <Box key={notification.id}>
                      <ListItem
                        component={Link}
                        to={notification.link}
                        onClick={() =>
                          handleNotificationItemClick(notification.id)
                        }
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: '#f5f5f5' },
                          py: 1.5,
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                      >
                        <Box
                          sx={{
                            mr: 2,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {getNotificationIcon(notification.type)}
                        </Box>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, flex: 1 }}
                              >
                                {notification.title}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ ml: 1, whiteSpace: 'nowrap' }}
                              >
                                {getRelativeTime(notification.timestamp)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: 'block',
                                mt: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {notification.message}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < notifications.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </Popover>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
