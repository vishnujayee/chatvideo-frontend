import React from 'react';
import { Alert } from '@mui/material';
import { useSocket } from './SocketContext';

const GlobalSocketAlerts = () => {
  // useSocket returns { socket, connectionStatus, connectionError }
  const { connectionStatus, connectionError } = useSocket() || {};
  if (connectionStatus === 'connecting') {
    return <Alert severity="info" sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>Connecting to real-time server...</Alert>;
  }
  if (connectionStatus === 'disconnected') {
    return <Alert severity="warning" sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>Disconnected from real-time server. Some features may not work.</Alert>;
  }
  if (connectionStatus === 'error' && connectionError) {
    return <Alert severity="error" sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>{connectionError}</Alert>;
  }
  // Do not show any alert if connected and no error
  return null;
};

export default GlobalSocketAlerts; 