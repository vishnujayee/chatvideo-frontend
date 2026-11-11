import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent
} from '@mui/material';
import { Home } from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #e3f2fd 0%, #e0f7fa 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card elevation={3} sx={{ maxWidth: 400, width: '100%', borderRadius: 4, boxShadow: 4, p: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <img src="/illustrations/404.svg" alt="Not Found" style={{ width: 120, marginBottom: 16, opacity: 0.8 }} />
          <Typography variant="h1" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
            404
          </Typography>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Page Not Found
          </Typography>
          <Typography color="text.secondary" paragraph>
            The page you're looking for doesn't exist or has been moved.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Home />}
            onClick={() => navigate('/')}
            sx={{ mt: 2, fontWeight: 600 }}
            size="large"
          >
            Go Home
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotFound; 