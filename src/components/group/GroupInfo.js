import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Delete, Edit, PersonAdd } from '@mui/icons-material';
import { useSocket } from '../common/SocketContext';
import { useDispatch } from 'react-redux';
import { updateGroup, addMember, removeMember, fetchGroupDetails, deleteGroup, leaveGroup } from '../../store/slices/groupSlice';

const GroupInfo = ({ group, isAdmin, onClose }) => {
  const { socket } = useSocket();
  const dispatch = useDispatch();
  const [editMode, setEditMode] = useState(false);
  const [addMemberDialog, setAddMemberDialog] = useState(false);
  const [groupName, setGroupName] = useState(group?.name || '');
  const [groupDescription, setGroupDescription] = useState(group?.description || '');
  const [members, setMembers] = useState(group?.members || []);
  const [addMemberValue, setAddMemberValue] = useState('');
  const [error, setError] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setMembers(group?.members || []);
  }, [group]);

  // Real-time group member updates
  useEffect(() => {
    if (!socket) return;
    const handleMemberAdded = ({ groupId, userId }) => {
      if (groupId === group._id) {
        // Refetch members
        socket.emit('get_group_members', { groupId });
      }
    };
    const handleMemberRemoved = ({ groupId, userId }) => {
      if (groupId === group._id) {
        // Refetch members
        socket.emit('get_group_members', { groupId });
      }
    };
    const handleMembers = ({ groupId, members }) => {
      if (groupId === group._id) setMembers(members);
    };
    socket.on('group_member_added', handleMemberAdded);
    socket.on('group_member_removed', handleMemberRemoved);
    socket.on('group_members', handleMembers);
    // Initial fetch
    socket.emit('get_group_members', { groupId: group._id });
    return () => {
      socket.off('group_member_added', handleMemberAdded);
      socket.off('group_member_removed', handleMemberRemoved);
      socket.off('group_members', handleMembers);
    };
  }, [socket, group._id]);

  const handleSaveChanges = async () => {
    try {
      await dispatch(updateGroup({ groupId: group._id, data: { name: groupName, description: groupDescription } }));
      dispatch(fetchGroupDetails(group._id));
      setEditMode(false);
    } catch (err) {
      setError('Failed to update group');
    }
  };

  const handleAddMember = async () => {
    if (!addMemberValue.trim()) return;
    try {
      await dispatch(addMember({ groupId: group._id, userId: addMemberValue.trim() }));
      dispatch(fetchGroupDetails(group._id));
      setAddMemberDialog(false);
      setAddMemberValue('');
    } catch (err) {
      setError('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await dispatch(removeMember({ groupId: group._id, userId }));
      dispatch(fetchGroupDetails(group._id));
    } catch (err) {
      setError('Failed to remove member');
    }
  };

  const handleLeaveGroup = async () => {
    setLeaving(true);
    setError(null);
    try {
      await dispatch(leaveGroup({ groupId: group._id }));
      if (onClose) onClose();
    } catch (err) {
      setError('Failed to leave group');
    } finally {
      setLeaving(false);
    }
  };
  const handleDeleteGroup = async () => {
    setDeleting(true);
    setError(null);
    try {
      await dispatch(deleteGroup({ groupId: group._id }));
      if (onClose) onClose();
    } catch (err) {
      setError('Failed to delete group');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ width: 320, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Group Information
      </Typography>

      {editMode ? (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </Box>
      ) : (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">{group?.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {group?.description}
          </Typography>
          {isAdmin && (
            <Button startIcon={<Edit />} onClick={() => setEditMode(true)}>
              Edit
            </Button>
          )}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleLeaveGroup}
          disabled={leaving}
        >
          {leaving ? 'Leaving...' : 'Leave Group'}
        </Button>
        {isAdmin && (
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteGroup}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Group'}
          </Button>
        )}
      </Box>
      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1">Members ({members.length})</Typography>
        {isAdmin && (
          <Button
            startIcon={<PersonAdd />}
            size="small"
            onClick={() => setAddMemberDialog(true)}
            variant="contained"
            color="primary"
          >
            Add
          </Button>
        )}
      </Box>

      <List>
        {members.map((member) => (
          <ListItem key={member._id}>
            <ListItemAvatar>
              <Avatar src={member.avatar} alt={member.username} />
            </ListItemAvatar>
            <ListItemText
              primary={member.username}
              secondary={member.email}
            />
            {isAdmin && (
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveMember(member._id)}>
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            )}
          </ListItem>
        ))}
      </List>

      <Dialog open={addMemberDialog} onClose={() => setAddMemberDialog(false)}>
        <DialogTitle>Add Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="User ID (for demo)"
            fullWidth
            value={addMemberValue}
            onChange={e => setAddMemberValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMemberDialog(false)}>Cancel</Button>
          <Button onClick={handleAddMember}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupInfo; 