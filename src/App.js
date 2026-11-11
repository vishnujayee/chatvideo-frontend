import { useEffect, useRef } from 'react';
import { useNavigate, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyAuth } from './store/slices/authSlice';
import { CircularProgress, Box, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, Avatar, Typography } from '@mui/material';

// Import components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/common/PrivateRoute';
import Chat from './pages/Chat';
import GroupChat from './pages/GroupChat';
import VideoCall from './pages/VideoCall';
import VoiceCall from './pages/VoiceCall';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { SocketProvider } from './components/common/SocketContext';
import GlobalSocketAlerts from './components/common/GlobalSocketAlerts';
import NotificationHandler from './components/notifications/NotificationHandler';
import { endCall } from './store/slices/callSlice';

const App = ({ setDarkMode, darkMode }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const initialCheckDone = useRef(false);
  const { isAuthenticated, loading, token, verificationAttempted, error } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const activeCall = useSelector(state => state.call?.activeCall);
  const socket = useSelector(state => state.socket?.socket); // adjust if needed

  useEffect(() => {
    // Only perform initial auth check once
    if (!initialCheckDone.current && token && !verificationAttempted) {
      initialCheckDone.current = true;
      dispatch(verifyAuth());
    }
  }, [dispatch, token, verificationAttempted]);

  // Show loading spinner only during initial auth check
  if (!verificationAttempted && loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Helper to determine if the current route matches the call type
  const isVoiceCallRoute = location.pathname.startsWith('/call');
  const isVideoCallRoute = location.pathname.startsWith('/video');

  // Only show modal if not already in a call of the same type
  const shouldShowCallModal = activeCall && (
    (activeCall.callType === 'voice' && !isVoiceCallRoute) ||
    (activeCall.callType === 'video' && !isVideoCallRoute)
  );

  const handleAcceptCall = () => {
    if (!activeCall) return;
    if (activeCall.groupId) {
      if (activeCall.callType === 'voice') {
        navigate(`/call/group/${activeCall.groupId}?callee=1`);
      } else {
        navigate(`/video/group/${activeCall.groupId}?callee=1`);
      }
    } else if (activeCall.callerId) {
      if (activeCall.callType === 'voice') {
        navigate(`/call/single/${activeCall.callerId}?callee=1`);
      } else {
        navigate(`/video/single/${activeCall.callerId}?callee=1`);
      }
    }
    // Do NOT clear activeCall here; let the call page handle it
  };
  const handleRejectCall = () => {
    if (socket && activeCall && activeCall.callerId) {
      socket.emit('reject_call', { callerId: activeCall.callerId });
    }
    dispatch(endCall());
  };

  console.log('activeCall', activeCall);
  return (
    <SocketProvider>
      {error && !loading && (
        <Alert severity="error" sx={{ position: 'fixed', top: 40, left: 0, right: 0, zIndex: 9999 }}>
          {error}
        </Alert>
      )}
      <GlobalSocketAlerts />
      <NotificationHandler />
      {shouldShowCallModal && (
        <Dialog open onClose={handleRejectCall}>
          <DialogTitle>Incoming Call</DialogTitle>
          <DialogContent>
            <Avatar sx={{ width: 72, height: 72, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 36 }}>
              {activeCall.callerName?.[0]?.toUpperCase() || '?'}
            </Avatar>
            <Typography variant="h6" sx={{ mb: 1 }}>{activeCall.callerName || 'Unknown'}</Typography>
            <Typography color="text.secondary">is calling you...</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAcceptCall} color="primary" variant="contained">Accept</Button>
            <Button onClick={handleRejectCall} color="error" variant="outlined">Reject</Button>
          </DialogActions>
        </Dialog>
      )}
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
              <Navigate to="/dashboard" state={{ from: location }} replace /> : 
              <Login />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? 
              <Navigate to="/dashboard" state={{ from: location }} replace /> : 
              <Register />
          } 
        />
        <Route 
          path="/dashboard/*" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/login" state={{ from: location }} replace />
          } 
        />
        {/* Single Chat */}
        <Route 
          path="/chat/single/:contactId" 
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
        {/* Group Chat */}
        <Route 
          path="/chat/group/:groupId" 
          element={
            <PrivateRoute>
              <GroupChat />
            </PrivateRoute>
          }
        />
        {/* Video Calls */}
        <Route 
          path="/video/single/:id" 
          element={
            <PrivateRoute>
              <VideoCall isGroup={false} />
            </PrivateRoute>
          }
        />
        <Route 
          path="/video/group/:id" 
          element={
            <PrivateRoute>
              <VideoCall isGroup={true} groupId={undefined} />
            </PrivateRoute>
          }
        />
        {/* Voice Calls */}
        <Route 
          path="/call/single/:id" 
          element={
            <PrivateRoute>
              <VoiceCall />
            </PrivateRoute>
          }
        />
        <Route 
          path="/call/group/:id" 
          element={
            <PrivateRoute>
              <VoiceCall />
            </PrivateRoute>
          }
        />
        {/* Profile & Settings */}
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <PrivateRoute>
              <Settings setDarkMode={setDarkMode} darkMode={darkMode} />
            </PrivateRoute>
          }
        />
        {/* NotFound fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SocketProvider>
  );
};

export default App;
