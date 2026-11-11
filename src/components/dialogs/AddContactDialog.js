import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import { Search, PersonAdd } from '@mui/icons-material';
import api from '../../services/api';

const AddContactDialog = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSearch = async () => {
    if (!email.trim()) {
      setError('Please enter an email');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setRequestSent(false);
      const response = await api.get(`/api/users/search?email=${email}`);
      // Handle both single user and array of users
      const users = Array.isArray(response.data) ? response.data : [response.data];
      setSearchResult(users.length > 0 ? users[0] : null);
      if (!users.length) {
        setError('No user found with this email');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error searching for user');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userId) {
        throw new Error('User ID is required');
      }

      console.log('Sending contact request:', userId);
      const response = await api.post('/api/contacts/requests/send', {
        recipientId: userId
      });

      console.log('Request sent:', response.data);
      setRequestSent(true);
      setMessage({ type: 'success', text: 'Contact request sent successfully!' });
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error('Send request failed:', error);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Failed to send contact request'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSearchResult(null);
    setError('');
    setRequestSent(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Contact</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Search by Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            disabled={loading}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {requestSent && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Contact request sent successfully!
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {searchResult && (
          <List>
            <ListItem>
              <ListItemAvatar>
                <Avatar src={searchResult.avatar}>
                  {searchResult.username?.[0]?.toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={searchResult.username}
                secondary={searchResult.email}
              />
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => handleSendRequest(searchResult._id)}
                disabled={loading || requestSent}
              >
                {requestSent ? 'Request Sent' : 'Send Request'}
              </Button>
            </ListItem>
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleSearch}
          startIcon={<Search />}
          disabled={loading || !email.trim()}
        >
          Search
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddContactDialog; 