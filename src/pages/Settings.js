import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent
} from '@mui/material';
import {
  Notifications,
  Lock,
  Palette,
  VolumeUp,
  Language,
  DeleteForever
} from '@mui/icons-material';
import api, { settingsAPI, deleteAccount } from '../services/api';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';

const Settings = ({ setDarkMode, darkMode: darkModeProp }) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkModeLocal] = useState(false);
  const [sound, setSound] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchSettings = async () => {
      setSettingsLoading(true);
      try {
        const res = await settingsAPI.getSettings();
        setNotifications(res.data.notifications);
        setDarkModeLocal(res.data.darkMode);
        setSound(res.data.sound);
      } catch (err) {
        // Optionally handle error
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleUpdateSettings = async () => {
    setSettingsLoading(true);
    try {
      await settingsAPI.updateSettings({ notifications, darkMode, sound });
      dispatch(addNotification({ id: Date.now(), message: 'Settings updated!', type: 'success' }));
    } catch (err) {
      dispatch(addNotification({ id: Date.now(), message: 'Failed to update settings', type: 'error' }));
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDarkModeToggle = async () => {
    setDarkMode && setDarkMode(!darkMode);
    setDarkModeLocal(!darkMode);
    await handleUpdateSettings();
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      if (deleteInput !== 'DELETE') {
        setDeleteError('You must type DELETE to confirm.');
        setDeleteLoading(false);
        return;
      }
      await deleteAccount();
      dispatch(addNotification({ id: Date.now(), message: 'Account deleted successfully', type: 'success' }));
      window.location.href = '/login';
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account');
      dispatch(addNotification({ id: Date.now(), message: 'Failed to delete account', type: 'error' }));
    } finally {
      setDeleteLoading(false);
      setDeleteDialog(false);
      setDeleteInput('');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #e3f2fd 0%, #e0f7fa 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card elevation={3} sx={{ mt: 4, p: 3, maxWidth: 600, width: '100%', borderRadius: 4, boxShadow: 4 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Settings
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <Notifications />
              </ListItemIcon>
              <ListItemText 
                primary="Notifications"
                secondary="Enable push notifications"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={notifications}
                  onChange={e => { setNotifications(e.target.checked); handleUpdateSettings(); }}
                  disabled={settingsLoading}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon><Palette /></ListItemIcon>
              <ListItemText primary="Dark Mode" />
              <ListItemSecondaryAction>
                <Switch checked={darkMode} onChange={handleDarkModeToggle} />
              </ListItemSecondaryAction>
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <VolumeUp />
              </ListItemIcon>
              <ListItemText 
                primary="Sound"
                secondary="Enable sound notifications"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={sound}
                  onChange={e => { setSound(e.target.checked); handleUpdateSettings(); }}
                  disabled={settingsLoading}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <Lock />
              </ListItemIcon>
              <ListItemText 
                primary="Privacy"
                secondary="Manage your privacy settings"
              />
              <ListItemSecondaryAction>
                <Button color="primary" variant="outlined">
                  Manage
                </Button>
              </ListItemSecondaryAction>
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <Language />
              </ListItemIcon>
              <ListItemText 
                primary="Language"
                secondary="Choose your preferred language"
              />
              <ListItemSecondaryAction>
                <Button color="primary" variant="outlined">
                  Change
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          </List>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteForever />}
              onClick={() => setDeleteDialog(true)}
              sx={{ fontWeight: 600 }}
            >
              Delete Account
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            This action cannot be undone. Please type "DELETE" to confirm.
          </Typography>
          <TextField
            fullWidth
            placeholder="Type DELETE to confirm"
            margin="normal"
            value={deleteInput}
            onChange={e => setDeleteInput(e.target.value)}
            disabled={deleteLoading}
          />
          {deleteError && <Typography color="error">{deleteError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button 
            color="error" 
            onClick={handleDeleteAccount}
            variant="contained"
            disabled={deleteLoading || deleteInput !== 'DELETE'}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;