// API utility with automatic token validation and logout on invalid tokens
export const createAuthenticatedFetch = (logout) => {
  return async (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    console.log('🔑 Token exists:', !!token);
    console.log('📞 Making request to:', url);

    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };

      // Decode token to see what role we have (for debugging)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('👤 Token payload:', payload);
      } catch {
        console.log('❌ Invalid token format');
      }
    } else {
      console.log('❌ No token found in localStorage');
    }

    try {
      const response = await fetch(url, options);
      console.log('📡 Response status:', response.status);

      // If token is invalid or expired (401/403), logout automatically
      if (response.status === 401 || response.status === 403) {
        const data = await response.json().catch(() => ({}));
        console.log('❌ Error response:', data);

        // Check if it's a token-related error
        if (
          data.message?.includes('token') ||
          data.message?.includes('Token') ||
          data.message?.includes('Unauthorized') ||
          data.message?.includes('expired')
        ) {
          console.log('🚪 Auto-logout triggered');
          logout();
          return response;
        }
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };
};

// API base URL helper
export const getApiBase = () => {
  return (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_LOCAL ||
    'http://localhost:3001'
  );
};

// Return API functions
export const returnAPI = {
  // Get return data for a booking
  getReturnData: async (bookingId, logout) => {
    const fetch = createAuthenticatedFetch(logout);
    const response = await fetch(`${getApiBase()}/returns/${bookingId}`);
    return await response.json();
  },
  
  // Calculate return fees
  calculateFees: async (bookingId, formData, logout) => {
    const fetch = createAuthenticatedFetch(logout);
    const response = await fetch(`${getApiBase()}/returns/${bookingId}/calculate-fees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    return await response.json();
  },
  
  // Upload damage image
  uploadDamageImage: async (bookingId, formData, logout) => {
    const fetch = createAuthenticatedFetch(logout);
    const response = await fetch(`${getApiBase()}/returns/${bookingId}/upload-damage-image`, {
      method: 'POST',
      body: formData // FormData object
    });
    return await response.json();
  },
  
  // Submit return
  submitReturn: async (bookingId, data, logout) => {
    const fetch = createAuthenticatedFetch(logout);
    const response = await fetch(`${getApiBase()}/returns/${bookingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  }
};

// Booking API functions
export const bookingAPI = {
  // Confirm booking and update isPay
  confirmBooking: async (bookingId, logout) => {
    const fetch = createAuthenticatedFetch(logout);
    const response = await fetch(`${getApiBase()}/bookings/${bookingId}/confirm`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to confirm booking' }));
      console.error('Confirm booking error response:', error);
      throw new Error(error.message || error.error || 'Failed to confirm booking');
    }
    return await response.json();
  },

  // Update isPay status
  updateIsPay: async (bookingId, isPay, logout) => {
    const fetch = createAuthenticatedFetch(logout);
    const response = await fetch(`${getApiBase()}/bookings/${bookingId}/is-pay`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPay })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update isPay status' }));
      throw new Error(error.message || error.error || 'Failed to update isPay status');
    }
    return await response.json();
  },

  // Admin cancel booking
  adminCancelBooking: async (bookingId, logout) => {
    const fetch = createAuthenticatedFetch(logout);
    const response = await fetch(`${getApiBase()}/bookings/${bookingId}/admin-cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to cancel booking' }));
      throw new Error(error.message || error.error || 'Failed to cancel booking');
    }
    return await response.json();
  }
};

// Payment API functions
export const paymentAPI = {
  // Delete payment by booking ID
  deletePaymentByBookingId: async (bookingId, logout, keepStatus = false) => {
    const fetch = createAuthenticatedFetch(logout);
    const queryParam = keepStatus ? '?keepStatus=true' : '';
    const response = await fetch(`${getApiBase()}/payments/booking/${bookingId}${queryParam}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete payment' }));
      throw new Error(error.message || error.error || 'Failed to delete payment');
    }
    return await response.json();
  }
};
