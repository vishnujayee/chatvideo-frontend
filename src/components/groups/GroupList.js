import { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import {
  VideoCall,
  Call,
  Chat,
  Add
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGroups, fetchGroupDetails } from '../../store/slices/groupSlice';
import { useNavigate } from 'react-router-dom';
import CreateGroupDialog from '../dialogs/CreateGroupDialog';
import { groupAPI } from '../../services/api';

const GroupList = ({ groups, loading, error, onRefresh }) => {
  const navigate = useNavigate();
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const handleGroupCreated = (newGroup) => {
    onRefresh(); // Refresh groups after creation
    setShowCreateGroup(false);
  };

  const handleGroupAction = (groupId, action) => {
    switch (action) {
      case 'chat':
        navigate(`/chat/group/${groupId}`);
        break;
      case 'video':
        navigate(`/video/group/${groupId}`);
        break;
      case 'voice':
        navigate(`/call/group/${groupId}`);
        break;
      default:
        break;
    }
  };

  const handleGroupClick = (group) => {
    navigate(`/chat/group/${group._id}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button onClick={onRefresh} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Groups</Typography>
        <Button
          startIcon={<Add />}
          variant="contained"
          onClick={() => setShowCreateGroup(true)}
        >
          Create Group
        </Button>
      </Box>

      {groups.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="textSecondary">
            No groups found. Create your first group!
          </Typography>
        </Box>
      ) : (
        <List>
          {groups.map(group => (
            <ListItem
              key={group._id}
              button
              onClick={() => handleGroupClick(group)}
              sx={{ borderRadius: 2, mb: 1, transition: 'background 0.2s', '&:hover': { background: '#f0f7ff' } }}
            >
              <ListItemAvatar>
                <Avatar src={group.avatar} alt={group.name} sx={{ bgcolor: '#1976d2' }}>
                  {group.name?.[0]?.toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={<Typography sx={{ fontWeight: 600 }}>{group.name}</Typography>}
                secondary={`Members: ${group.members?.length || 0}`}
              />
            </ListItem>
          ))}
        </List>
      )}

      <CreateGroupDialog
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={handleGroupCreated}
      />
    </Box>
  );
};

export default GroupList; 