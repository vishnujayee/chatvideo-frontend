import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CircularProgress, Box, Alert } from '@mui/material';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loading, error, verificationAttempted } = useSelector(state => state.auth);

  // Only show loading on initial auth check
  if (loading && !verificationAttempted) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Show error if auth check failed
  if (error && !isAuthenticated) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Navigate to="/login" state={{ from: location }} replace />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated && verificationAttempted) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute; 