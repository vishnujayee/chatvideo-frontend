import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Tooltip,
  Badge,
  IconButton,
  Divider,
  useMediaQuery
} from '@mui/material';
import {
  Chat,
  Group,
  Call,
  VideoCall,
  Settings,
  Logout,
  Dashboard as DashboardIcon,
  Person
} from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice';

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Chats', icon: <Chat />, path: '/chat' },
  { label: 'Groups', icon: <Group />, path: '/dashboard/groups' },
  { label: 'Calls', icon: <Call />, path: '/dashboard/calls' },
  { label: 'Profile', icon: <Person />, path: '/profile' },
  { label: 'Settings', icon: <Settings />, path: '/settings' }
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  // Example unread counts (replace with real data from store)
  const unreadChats = 0;
  const unreadGroups = 0;
  const isMobile = useMediaQuery('(max-width:600px)');
  const [open, setOpen] = React.useState(!isMobile);

  React.useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={open}
      onClose={() => setOpen(false)}
      sx={{
        width: 220,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 220,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: 0,
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
        <Avatar src={user?.avatar} alt={user?.username} sx={{ width: 64, height: 64, mb: 1 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{user?.username}</Typography>
        <Typography variant="caption" color="text.secondary">Online</Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <Tooltip key={item.label} title={item.label} placement="right" arrow>
            <ListItem
              button
              selected={location.pathname.startsWith(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                bgcolor: location.pathname.startsWith(item.path) ? 'primary.light' : 'inherit',
              }}
            >
              <ListItemIcon>
                {item.label === 'Chats' && unreadChats > 0 ? (
                  <Badge color="secondary" badgeContent={unreadChats}>{item.icon}</Badge>
                ) : item.label === 'Groups' && unreadGroups > 0 ? (
                  <Badge color="secondary" badgeContent={unreadGroups}>{item.icon}</Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          </Tooltip>
        ))}
        <Divider sx={{ my: 1 }} />
        <Tooltip title="Logout" placement="right" arrow>
          <ListItem button onClick={handleLogout} sx={{ borderRadius: 2, mx: 1 }}>
            <ListItemIcon><Logout /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </Tooltip>
      </List>
    </Drawer>
  );
};

export default Navbar; 