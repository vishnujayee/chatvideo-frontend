import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Drawer,
  Divider,
  Button,
  Card,
  CardContent
} from '@mui/material';
import {
  Info,
  PersonAdd,
  Settings,
  VideoCall,
  Call // Add Call icon
} from '@mui/icons-material';
import ChatWindow from '../components/chat/ChatWindow';
import GroupInfo from '../components/group/GroupInfo';
import { fetchGroupDetails } from '../store/slices/groupSlice';
import debounce from 'lodash/debounce';
import { addNotification } from '../store/slices/notificationSlice';

const GroupChat = () => {
  const { groupId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [infoOpen, setInfoOpen] = useState(false);
  const { currentGroup, loading } = useSelector(state => state.groups);
  const { user } = useSelector(state => state.auth);
  const lastFetchedGroupId = useRef(null);
  const debouncedFetchGroupDetails = useRef(
    debounce(async (id) => {
      try {
        await dispatch(fetchGroupDetails(id));
      } catch {
        dispatch(addNotification({ id: Date.now(), message: 'Failed to load group details', type: 'error' }));
      }
    }, 300)
  ).current;

  useEffect(() => {
    if (groupId && groupId !== lastFetchedGroupId.current) {
      debouncedFetchGroupDetails(groupId);
      lastFetchedGroupId.current = groupId;
    }
  }, [groupId, debouncedFetchGroupDetails, dispatch]);

  const isAdmin = currentGroup?.admins?.includes(user?._id);

  return (
    <Box sx={{ height: '100vh', display: 'flex', bgcolor: 'linear-gradient(135deg, #e3f2fd 0%, #e0f7fa 100%)' }}>
      <Grid container>
        <Grid item xs={12}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: 3,
              bgcolor: 'primary.light',
              boxShadow: 2
            }}
          >
            <Button variant="outlined" size="small" sx={{ mr: 2 }} onClick={() => navigate('/dashboard')}>Back to chats</Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {currentGroup?.avatar && (
                <Avatar src={currentGroup.avatar} alt={currentGroup.name} sx={{ width: 48, height: 48, mr: 2 }} />
              )}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {currentGroup?.name}
                </Typography>
                {currentGroup?.description && (
                  <Typography variant="body2" color="text.secondary">
                    {currentGroup.description}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box>
              <IconButton onClick={() => setInfoOpen(true)}>
                <Info />
              </IconButton>
              <IconButton onClick={() => navigate(`/video/group/${groupId}`)}>
                <VideoCall />
              </IconButton>
              <IconButton onClick={() => navigate(`/call/group/${groupId}`)}>
                <Call />
              </IconButton>
              {isAdmin && (
                <IconButton>
                  <Settings />
                </IconButton>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sx={{ flexGrow: 1, height: 'calc(100vh - 72px)' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography>Loading group...</Typography>
            </Box>
          ) : !currentGroup ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <img src="/illustrations/group-empty.svg" alt="No group" style={{ width: 180, opacity: 0.7 }} />
              <Typography color="error" sx={{ mt: 2 }}>Group not found.</Typography>
              <Button variant="contained" sx={{ mt: 2 }} onClick={() => {
                dispatch(fetchGroupDetails(groupId));
                dispatch(addNotification({ id: Date.now(), message: 'Group not found', type: 'error' }));
              }}>Retry</Button>
              <Button variant="outlined" sx={{ mt: 1 }} onClick={() => navigate('/dashboard')}>Back to chats</Button>
            </Box>
          ) : (
            <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: 2, bgcolor: 'white', mt: 2 }}>
              <CardContent sx={{ flexGrow: 1, p: 0 }}>
                <ChatWindow 
                  recipientId={groupId} 
                  isGroup={true}
                  groupMembers={currentGroup?.members || []}
                />
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Drawer
        anchor="right"
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        sx={{ width: 320 }}
        PaperProps={{ sx: { width: 320, borderRadius: 3 } }}
      >
        <GroupInfo 
          group={currentGroup}
          isAdmin={isAdmin}
          onClose={() => setInfoOpen(false)}
        />
      </Drawer>
    </Box>
  );
};

export default GroupChat; 