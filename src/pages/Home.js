import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Stack
} from '@mui/material';
import {
  VideoCall,
  Chat,
  Group,
  Security
} from '@mui/icons-material';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(state => state.auth);

  const features = [
    {
      icon: <VideoCall fontSize="large" color="primary" />,
      title: "Video Calls",
      description: "High-quality video calls with screen sharing"
    },
    {
      icon: <Chat fontSize="large" color="primary" />,
      title: "Real-time Chat",
      description: "Instant messaging with media sharing"
    },
    {
      icon: <Group fontSize="large" color="primary" />,
      title: "Group Chats",
      description: "Create and manage group conversations"
    },
    {
      icon: <Security fontSize="large" color="primary" />,
      title: "Secure",
      description: "End-to-end encrypted communications"
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h2" component="h1" gutterBottom>
              Connect with Video & Chat
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph>
              Secure, reliable, and feature-rich communication platform for everyone
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
              {isAuthenticated ? (
                <>
                  <Button 
                    variant="contained" 
                    size="large"
                    onClick={() => navigate('/chat')}
                  >
                    Go to Chat
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="large"
                    onClick={() => navigate('/profile')}
                  >
                    My Profile
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="contained" 
                    size="large"
                    onClick={() => navigate('/register')}
                  >
                    Get Started
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="large"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </Button>
                </>
              )}
            </Stack>
          </Grid>
        </Grid>

        <Grid container spacing={4} sx={{ mt: 6 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                {feature.icon}
                <Typography variant="h6" sx={{ mt: 2 }}>
                  {feature.title}
                </Typography>
                <Typography color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default Home; 