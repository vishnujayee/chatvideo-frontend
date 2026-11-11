import { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Typography,
  Box,
  Chip
} from '@mui/material';
import {
  Call as CallIcon,
  CallMade,
  CallReceived,
  CallMissed,
  VideoCall
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CallHistory = () => {
  const navigate = useNavigate();
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    loadCallHistory();
  }, []);

  const loadCallHistory = async () => {
    try {
      const response = await api.get('/api/calls/history');
      setCalls(response.data);
    } catch (error) {
      console.error('Error loading call history:', error);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'No duration';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallIcon = (call) => {
    const props = { color: call.status === 'missed' ? 'error' : 'action' };
    if (call.type === 'video') return <VideoCall {...props} />;
    return <CallIcon {...props} />;
  };

  const getCallStatusChip = (status) => {
    const colors = {
      completed: 'success',
      missed: 'error',
      rejected: 'warning',
      ongoing: 'info'
    };

    return (
      <Chip
        size="small"
        color={colors[status]}
        label={status.charAt(0).toUpperCase() + status.slice(1)}
      />
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Call History
      </Typography>
      <List>
        {calls.map((call) => (
          <ListItem key={call._id}>
            <ListItemAvatar>
              <Avatar src={call.initiator.avatar}>
                {call.initiator.username[0]}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={call.initiator.username}
              secondary={
                <>
                  {new Date(call.startTime).toLocaleString()}
                  {' • '}
                  {formatDuration(call.duration)}
                </>
              }
            />
            <ListItemSecondaryAction>
              {getCallStatusChip(call.status)}
              <IconButton onClick={() => navigate(call.type === 'video' ? `/video/single/${call._id}` : `/call/single/${call._id}`)}>
                {getCallIcon(call)}
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default CallHistory; 