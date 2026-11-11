import { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Button,
  ListItemAvatar
} from '@mui/material';
import {
  Chat,
  Group,
  VideoCall,
  PersonAdd,
  Settings,
  Logout,
  Menu as MenuIcon,
  Person
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import ContactList from '../components/contacts/ContactList';
import GroupList from '../components/groups/GroupList';
import CallHistory from '../components/calls/CallHistory';
import AddContactDialog from '../components/dialogs/AddContactDialog';
import { fetchGroups, fetchGroupDetails } from '../store/slices/groupSlice';
import { contactsAPI } from '../services/api';
import { groupAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading: authLoading, error: authError } = useSelector(state => state.auth);
  const { error: contactError } = useSelector(state => state.contacts);
  const [activeTab, setActiveTab] = useState('chats');
  const [anchorEl, setAnchorEl] = useState(null);
  const [showAddContact, setShowAddContact] = useState(false);

  const [contacts, setContacts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [contactsRes, requestsRes, groupsRes] = await Promise.all([
        contactsAPI.getContacts(),
        contactsAPI.getContactRequests(),
        groupAPI.getGroups()
      ]);
      setContacts(contactsRes.data);
      setRequests(requestsRes.data);
      setGroups(groupsRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRefresh = () => {
    fetchAllData();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleGroupClick = (group) => {
    dispatch(fetchGroupDetails(group._id));
    navigate(`/chat/group/${group._id}`);
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #e3f2fd 0%, #e0f7fa 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Error Display */}
      {(authError || contactError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {authError || contactError}
        </Alert>
      )}

      {/* Top AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'primary.main', boxShadow: 3 }}>
        <Toolbar>
          <Typography variant="h5" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1 }}>
            ChatVideo
          </Typography>
          <IconButton 
            color="inherit" 
            onClick={() => setShowAddContact(true)}
            disabled={authLoading}
            sx={{ mr: 1 }}
          >
            <PersonAdd />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            disabled={authLoading}
          >
            <Avatar src={user?.avatar} sx={{ width: 36, height: 36, bgcolor: 'secondary.main', fontWeight: 700 }}>
              {user?.username ? getInitials(user.username) : <Person />}
            </Avatar>
          </IconButton>
        </Toolbar>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          centered
          sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', boxShadow: 1 }}
          TabIndicatorProps={{ style: { background: '#00bcd4', height: 4, borderRadius: 2 } }}
        >
          <Tab value="chats" label="Chats" icon={<Chat />} iconPosition="start" sx={{ fontWeight: 600 }} />
          <Tab value="groups" label="Groups" icon={<Group />} iconPosition="start" sx={{ fontWeight: 600 }} />
          <Tab value="calls" label="Calls" icon={<VideoCall />} iconPosition="start" sx={{ fontWeight: 600 }} />
        </Tabs>
      </AppBar>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          setAnchorEl(null);
          navigate('/profile');
        }}>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => {
          setAnchorEl(null);
          navigate('/settings');
        }}>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, md: 3 },
          mt: 12,
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%'
        }}
      >
        {authLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ width: '100%', maxWidth: 900, mt: 2 }}>
            {activeTab === 'chats' && (
              <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Contacts</Typography>
                  <ContactList contacts={contacts} requests={requests} loading={loading} error={error} onRefresh={handleRefresh} />
                </CardContent>
              </Card>
            )}
            {activeTab === 'groups' && (
              <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Groups</Typography>
                  <GroupList groups={groups} loading={loading} error={error} onRefresh={handleRefresh} />
                </CardContent>
              </Card>
            )}
            {activeTab === 'calls' && (
              <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Call History</Typography>
                  <CallHistory />
                </CardContent>
              </Card>
            )}
            {/* Empty state illustration/message if no data */}
            {/* You can add illustrations or Lottie animations here for extra polish */}
          </Box>
        )}
      </Box>

      {/* Add Contact Dialog */}
      <AddContactDialog
        open={showAddContact}
        onClose={() => setShowAddContact(false)}
      />
    </Box>
  );
};

export default Dashboard;