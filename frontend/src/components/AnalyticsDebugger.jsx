import { useState } from 'react';
import { Button, Typography, Box, Alert } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { createAuthenticatedFetch, getApiBase } from '../utils/api';

const AnalyticsDebugger = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { logout, userRole, isAuthenticated, user } = useAuth();

  const testAnalytics = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const API_BASE = getApiBase();
      const authenticatedFetch = createAuthenticatedFetch(logout);
      
      console.log('Testing analytics with:', {
        API_BASE,
        userRole,
        isAuthenticated,
        user: user ? JSON.parse(user) : null,
        token: localStorage.getItem('authToken') ? 'Present' : 'Missing'
      });
      
      const response = await authenticatedFetch(`${API_BASE}/analytics/revenue`);
      
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }
      
      setResult({
        status: response.status,
        ok: response.ok,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries())
      });
      
    } catch (error) {
      setResult({
        error: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800 }}>
      <Typography variant="h5" gutterBottom>
        Analytics API Debugger
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Auth Status:</strong> {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
        </Typography>
        <Typography variant="body2">
          <strong>User Role:</strong> {userRole || 'None'}
        </Typography>
        <Typography variant="body2">
          <strong>Token:</strong> {localStorage.getItem('authToken') ? 'Present' : 'Missing'}
        </Typography>
      </Box>
      
      <Button 
        variant="contained" 
        onClick={testAnalytics} 
        disabled={loading}
        sx={{ mb: 3 }}
      >
        {loading ? 'Testing...' : 'Test Analytics API'}
      </Button>
      
      {result && (
        <Alert 
          severity={result.error ? 'error' : result.status >= 400 ? 'warning' : 'success'}
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" gutterBottom>
            API Response
          </Typography>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Alert>
      )}
    </Box>
  );
};

export default AnalyticsDebugger;