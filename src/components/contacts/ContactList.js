import { useEffect, useRef, useState, useCallback } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Badge,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Tooltip,
  Button,
  Snackbar
} from '@mui/material';
import {
  Chat,
  VideoCall,
  Call,
  CheckCircle,
  Cancel,
  Person,
  PersonAdd,
  Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContacts, fetchPendingRequests, handleContactRequest } from '../../store/slices/contactSlice';
import AddContactDialog from '../dialogs/AddContactDialog';

const ContactList = ({ contacts, requests, loading, error, onRefresh }) => {
  const navigate = useNavigate();
  const initialLoadDone = useRef(false);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'success' });
  const [showAddContact, setShowAddContact] = useState(false);
  const activeCall = useSelector(state => state.call.activeCall);
  
  // Use props.contacts, props.requests, props.loading, props.error
  // For refresh button: onClick={onRefresh}
  const { 
    incomingRequests = [], 
    outgoingRequestIds = new Set(), 
    lastUpdated 
  } = requests;

  // Handle initial load and periodic refresh
  useEffect(() => {
    let intervalId;
    
    const loadInitialData = async () => {
      if (!initialLoadDone.current) {
        onRefresh(true); // Force initial load
        initialLoadDone.current = true;
      }
      // Start periodic refresh only after initial load
      // intervalId = setInterval(() => onRefresh(), 100000);
    };

    loadInitialData();
    
    return () => {
      // if (intervalId) {
      //   clearInterval(intervalId);
      // }
    };
  }, [onRefresh]);

  // Update the handleRequest function
  const handleRequest = async (requestId, action) => {
    try {
      // await dispatch(handleContactRequest({ requestId, action })).unwrap(); // Removed Redux dispatch
      // Force refresh immediately after action
      onRefresh(true);
      
      setNotification({
        open: true,
        message: `Request ${action === 'accept' ? 'accepted' : 'rejected'} successfully`,
        type: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: error?.message || 'Failed to process request',
        type: 'error'
      });
    }
  };

  // Update the handleRefresh function
  const handleRefresh = () => {
    onRefresh(true); // Force refresh when manually triggered
  };

  const startChat = (contactId) => navigate(`/chat/single/${contactId}`);
  const startVideoCall = (contactId) => {
    if (activeCall) return; // Prevent repeated calls
    navigate(`/video/single/${contactId}`);
  };
  const startVoiceCall = (contactId) => {
    if (activeCall) return; // Prevent repeated calls
    navigate(`/call/single/${contactId}`);
  };

  const handleAddContact = () => {
    setShowAddContact(true);
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Show loading state only on initial load
  if ((loading.contacts || loading.requests) && contacts.length === 0 && incomingRequests.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  const getDisplayName = (user) => {
    if (!user) return 'Unknown User';
    return user.name || user.username || user.email?.split('@')[0] || 'Unknown User';
  };

  const getSecondaryText = (user) => {
    if (!user) return '';
    const texts = [];
    if (user.status) texts.push(user.status);
    if (user.email) texts.push(user.email);
    return texts.join(' • ') || 'No additional info';
  };

  return (
    <Box>
      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              <Refresh />
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Last Updated Info */}
      {lastUpdated && (
        <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
          Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          <IconButton 
            size="small" 
            onClick={handleRefresh} 
            disabled={loading.contacts || loading.requests}
          >
            <Refresh />
          </IconButton>
        </Typography>
      )}

      {/* Pending Requests Section */}
      {incomingRequests.length > 0 && (
        <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="h6" gutterBottom={false}>
              Pending Requests ({incomingRequests.length})
              {loading.requests && <CircularProgress size={20} sx={{ ml: 1 }} color="inherit" />}
            </Typography>
          </Box>
          <List disablePadding>
            {incomingRequests.map((request, index) => {
              if (!request || !request._id) return null;
              const sender = request.sender || {};
              const isLastItem = index === incomingRequests.length - 1;
              
              return (
                <Box key={request._id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color={sender.isOnline ? "success" : "error"}
                      >
                        <Avatar src={sender.avatar} alt={getDisplayName(sender)}>
                          {sender.username ? getDisplayName(sender)[0].toUpperCase() : <Person />}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={getDisplayName(sender)}
                      secondary={getSecondaryText(sender)}
                      primaryTypographyProps={{
                        variant: 'subtitle1',
                        fontWeight: 'medium'
                      }}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Accept Request">
                        <IconButton
                          color="success"
                          onClick={() => handleRequest(request._id, 'accept')}
                          disabled={loading.action}
                          size="small"
                        >
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject Request">
                        <IconButton
                          color="error"
                          onClick={() => handleRequest(request._id, 'reject')}
                          disabled={loading.action}
                          size="small"
                          sx={{ ml: 1 }}
                        >
                          <Cancel />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {!isLastItem && <Divider component="li" />}
                </Box>
              );
            })}
          </List>
        </Paper>
      )}

      {/* Sent Requests Section */}
      {outgoingRequestIds.size > 0 && (
        <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden', bgcolor: 'grey.100' }}>
          <Box sx={{ px: 2, py: 1, bgcolor: 'grey.300' }}>
            <Typography variant="subtitle1" gutterBottom={false}>
              Sent Requests ({outgoingRequestIds.size})
              <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                Waiting for response
              </Typography>
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Contacts Section */}
      <Paper elevation={2} sx={{ overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" gutterBottom={false}>
            Contacts ({contacts.length})
          </Typography>
          {loading.contacts && <CircularProgress size={20} sx={{ ml: 1 }} color="inherit" />}
        </Box>
        {contacts.length > 0 ? (
          <List disablePadding>
            {contacts.map((contact, index) => {
              if (!contact || !contact._id) return null;
              const isLastItem = index === contacts.length - 1;
              
              return (
                <Box key={contact._id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color={contact.isOnline ? "success" : "error"}
                      >
                        <Avatar src={contact.avatar} alt={getDisplayName(contact)}>
                          {contact.username ? getDisplayName(contact)[0].toUpperCase() : <Person />}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={getDisplayName(contact)}
                      secondary={getSecondaryText(contact)}
                      primaryTypographyProps={{
                        variant: 'subtitle1',
                        fontWeight: 'medium'
                      }}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Start Chat">
                        <IconButton onClick={() => startChat(contact._id)} disabled={loading.action} size="small">
                          <Chat />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Video Call">
                        <IconButton onClick={() => startVideoCall(contact._id)} disabled={loading.action || !!activeCall} size="small" sx={{ ml: 1 }}>
                          <VideoCall />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Voice Call">
                        <IconButton onClick={() => startVoiceCall(contact._id)} disabled={loading.action || !!activeCall} size="small" sx={{ ml: 1 }}>
                          <Call />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {!isLastItem && <Divider component="li" />}
                </Box>
              );
            })}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary" paragraph>
              No contacts found
            </Typography>
            <Button
              variant="outlined"
              startIcon={<PersonAdd />}
              onClick={handleAddContact}
            >
              Add New Contact
            </Button>
          </Box>
        )}
      </Paper>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification}
          severity={notification.type}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      <AddContactDialog open={showAddContact} onClose={() => setShowAddContact(false)} />
    </Box>
  );
};

export default ContactList;