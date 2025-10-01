// API utility with automatic token validation and logout on invalid tokens
export const createAuthenticatedFetch = (logout) => {
  return async (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    console.log('Making authenticated request to:', url);
    console.log('Token exists:', !!token);
    
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, options);
      console.log('Response status:', response.status);
      
      // If token is invalid or expired (401/403), logout automatically
      if (response.status === 401 || response.status === 403) {
        const data = await response.json().catch(() => ({}));
        console.log('Auth error response:', data);
        
        // Check if it's a token-related error
        if (data.message?.includes('token') || data.message?.includes('Token') || 
            data.message?.includes('Unauthorized') || data.message?.includes('expired')) {
          console.warn('Token expired or invalid, logging out...');
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
  return import.meta.env.VITE_API_URL || import.meta.env.VITE_LOCAL;
};