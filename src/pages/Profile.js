import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  Grid,
  TextField,
  Divider,
  Box,
  IconButton,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import { Edit, Save, Cancel, PhotoCamera } from '@mui/icons-material';
import { addNotification } from '../store/slices/notificationSlice';
import { userAPI } from '../services/api';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [editing, setEditing] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    try {
      if (avatar) {
        const avatarForm = new FormData();
        avatarForm.append('avatar', avatar);
        await userAPI.uploadAvatar(avatarForm);
      }
      await userAPI.updateProfile(formData);
      setSuccess('Profile updated successfully!');
      dispatch(addNotification({ id: Date.now(), message: 'Profile updated successfully!', type: 'success' }));
      setEditing(false);
    } catch (err) {
      setError('Failed to update profile.');
      dispatch(addNotification({ id: Date.now(), message: 'Failed to update profile.', type: 'error' }));
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #e3f2fd 0%, #e0f7fa 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card elevation={3} sx={{ p: 4, mt: 4, maxWidth: 600, width: '100%', borderRadius: 4, boxShadow: 4 }}>
        <CardContent>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Avatar
                src={user?.avatar}
                sx={{ width: 150, height: 150, mx: 'auto', mb: 2, boxShadow: 2, border: '4px solid #e0f7fa' }}
              />
              {editing && (
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  sx={{ mt: 1 }}
                >
                  Change Photo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </Button>
              )}
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>Profile</Typography>
                {!editing ? (
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setEditing(true)}
                    variant="contained"
                    color="primary"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <Box>
                    <Button
                      startIcon={<Save />}
                      onClick={handleSubmit}
                      sx={{ mr: 1 }}
                      variant="contained"
                      color="success"
                    >
                      Save
                    </Button>
                    <Button
                      startIcon={<Cancel />}
                      onClick={() => setEditing(false)}
                      color="error"
                      variant="outlined"
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={!editing}
                    sx={{ bgcolor: '#f5fafd', borderRadius: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!editing}
                    sx={{ bgcolor: '#f5fafd', borderRadius: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!editing}
                    multiline
                    rows={4}
                    sx={{ bgcolor: '#f5fafd', borderRadius: 2 }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile; 