// API utility with automatic token validation and logout on invalid tokens
export const createAuthenticatedFetch = (logout) => {
  return async (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    console.log('🔑 Token exists:', !!token);
    console.log('📞 Making request to:', url);
    
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
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
        if (data.message?.includes('token') || data.message?.includes('Token') || 
            data.message?.includes('Unauthorized') || data.message?.includes('expired')) {
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
  return import.meta.env.VITE_API_URL || import.meta.env.VITE_LOCAL || 'http://localhost:3001';
};