import { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, LinearProgress, TextField } from '@mui/material';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { useSocket } from '../common/SocketContext';
import { chatAPI } from '../../services/api';
import { mediaAPI } from '../../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { setMessages, addMessage } from '../../store/slices/chatSlice';
import { setMessagingMethod } from '../../store/slices/chatSlice';
import { addMember, removeMember, updateGroup, fetchGroupDetails } from '../../store/slices/groupSlice';
import CreateGroupDialog from '../dialogs/CreateGroupDialog';

const ChatWindow = ({ recipientId, isGroup, groupMembers = [] }) => {
  const dispatch = useDispatch();
  const messages = useSelector(state => state.chat.messages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [socketError, setSocketError] = useState(null);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const { socket } = useSocket();
  const messagesEndRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagingMethod = useSelector(state => state.chat.messagingMethod);
  const allUsers = useSelector(state => state.contacts.contacts.concat(state.groups?.currentGroup?.members?.map(m => m.user) || []));
  const currentUser = useSelector(state => state.auth.user);
  const handleShareLocation = () => {
    // TODO: Implement location sharing logic (e.g., get geolocation and send as message)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleSendMessage('', 'location', '', { latitude, longitude });
        },
        (error) => {
          alert('Unable to get your location.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Fetch message history on mount or when recipientId/isGroup changes
  useEffect(() => {
    let isMounted = true;
    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        let response;
        if (isGroup) {
          response = await chatAPI.getGroupMessages(recipientId);
        } else {
          response = await chatAPI.getPrivateMessages(recipientId);
        }
        const sorted = response.data.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const deduped = Array.from(new Map(sorted.map(m => [m._id, m])).values());
        if (isMounted) dispatch(setMessages(deduped));
        scrollToBottom();
      } catch (err) {
        if (isMounted) setError('Failed to load messages');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (recipientId) fetchMessages();
    return () => { isMounted = false; };
  }, [recipientId, isGroup, dispatch]);

  // Real-time socket room join (no per-chat listeners, only join/leave room)
  useEffect(() => {
    if (!socket || typeof socket.emit !== 'function') return;
    const roomName = isGroup ? `group:${recipientId}` : recipientId;
    console.log('[Socket] Joining room:', roomName);
    socket.emit('join_room', roomName);
    return () => {
      console.log('[Socket] Leaving room:', roomName);
      socket.emit('leave_room', roomName);
    };
  }, [socket, recipientId, isGroup]);

  useEffect(() => {
    if (!socket) return;
    // Listen for new messages (private and group)
    const handleNewMessage = ({ message }) => {
      dispatch(setMessages(prev => [...prev, message]));
      scrollToBottom();
    };
    socket.on('new_message', handleNewMessage);
    // Listen for typing indicators
    const handleUserTyping = (data) => {
      if (isGroup) {
        if (data.groupId === recipientId && data.userId !== undefined) {
          setTypingUsers(prev => Array.from(new Set([...prev, data.userId])));
        }
      } else {
        if (data.userId !== undefined && data.userId !== null) {
          setTypingUsers(prev => Array.from(new Set([...prev, data.userId])));
        }
      }
    };
    const handleUserStopTyping = (data) => {
      if (isGroup) {
        if (data.groupId === recipientId && data.userId !== undefined) {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }
      } else {
        if (typeof data === 'string' || typeof data === 'number') {
          setTypingUsers(prev => prev.filter(id => id !== data));
        } else if (data.userId !== undefined) {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }
      }
    };
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    // Listen for message delivery confirmation
    const handleDelivered = ({ messageId }) => {
      // Optionally update message status in UI
    };
    socket.on('message_delivered', handleDelivered);
    // Listen for message errors
    const handleMessageError = ({ error }) => {
      setSocketError(error);
    };
    socket.on('message_error', handleMessageError);
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('message_delivered', handleDelivered);
      socket.off('message_error', handleMessageError);
    };
  }, [socket, dispatch, isGroup, recipientId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle file/media upload
  const handleAttachFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatId', recipientId);
      const response = await mediaAPI.uploadFile(formData);
      const mediaUrl = response.data.url || response.data.mediaUrl;
      handleSendMessage('', 'media', mediaUrl);
    } catch (err) {
      setUploadError('Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  // Send message via socket
  const handleSendMessage = async (content, type = 'text', mediaUrl = '', location = null) => {
    if (messagingMethod === 'socket') {
      if (socket && typeof socket.emit === 'function') {
        if (isGroup) {
          socket.emit('group_message', {
            groupId: recipientId,
            content,
            type,
            mediaUrl,
            location
          });
        } else {
          socket.emit('private_message', {
            recipient: recipientId,
            content,
            type,
            mediaUrl,
            location
          });
        }
      } else {
        console.log('Socket not connected');
      }
    } else {
      // API method
      try {
        let response;
        if (isGroup) {
          response = await chatAPI.sendGroupMessage(recipientId, { content, type, mediaUrl, location });
        } else {
          response = await chatAPI.sendPrivateMessage(recipientId, { content, type, mediaUrl, location });
        }
        if (response && response.data && response.data.message) {
          dispatch(addMessage(response.data.message));
          scrollToBottom();
        }
      } catch (err) {
        setError('Failed to send message via API');
        console.log('API send error', err);
      }
    }
  };

  // Group management UI stubs (unchanged)
  const handleCreateGroup = () => setShowGroupDialog(true);
  const handleCloseGroupDialog = () => setShowGroupDialog(false);
  const handleShowMembers = () => setShowMembersDialog(true);
  const handleCloseMembersDialog = () => setShowMembersDialog(false);

  // Add group creation logic
  const handleGroupCreated = (group) => {
    dispatch(fetchGroupDetails(group._id));
    setShowGroupDialog(false);
  };

  // Add member logic
  const handleAddMember = async (userId) => {
    await dispatch(addMember({ groupId: recipientId, userId }));
    dispatch(fetchGroupDetails(recipientId));
  };

  // Remove member logic
  const handleRemoveMember = async (userId) => {
    await dispatch(removeMember({ groupId: recipientId, userId }));
    dispatch(fetchGroupDetails(recipientId));
  };

  // Filter messages for current chat/group only
  const filteredMessages = messages.filter(
    m => isGroup ? m.groupId === recipientId : (m.sender === recipientId || m.recipient === recipientId)
  );

  return (
    <Paper elevation={2} sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 0, bgcolor: '#f5fafd', borderLeft: '1px solid #e0e0e0', minHeight: 0 }}>
      {/* Header (if any) */}
      {error && <Alert severity="error">{error}</Alert>}
      {uploadError && <Alert severity="error">{uploadError}</Alert>}
      {socketError && <Alert severity="error">{socketError}</Alert>}
      {/* Add toggle UI above message input */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ mr: 1 }}>Send via:</Typography>
        <select
          value={messagingMethod}
          onChange={e => dispatch(setMessagingMethod(e.target.value))}
          style={{ marginRight: 8 }}
        >
          <option value="socket">Socket</option>
          <option value="api">API</option>
        </select>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, gap: 1 }}>
        {isGroup && <Button size="small" variant="outlined" onClick={handleShowMembers}>Show Members</Button>}
        <Button size="small" variant="outlined" onClick={handleCreateGroup}>Create Group</Button>
      </Box>
      {/* Message List */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, minHeight: 0, maxHeight: 'calc(100vh - 180px)', background: 'linear-gradient(135deg, #f5fafd 0%, #e3f2fd 100%)', borderBottom: '1px solid #e0e0e0' }}>
        <MessageList messages={filteredMessages} />
        <div ref={messagesEndRef} />
      </Box>
      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <Box sx={{ p: 1, color: 'text.secondary', fontStyle: 'italic', fontSize: 13 }}>
          {isGroup
            ? `${typingUsers.map(id => {
                const user = allUsers.find(u => u._id === id);
                return user ? user.username : 'Someone';
              }).join(', ')} ${typingUsers.length > 1 ? 'are' : 'is'} typing...`
            : 'Typing...'}
        </Box>
      )}
      {/* Input */}
      <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: 'white', position: 'sticky', bottom: 0, zIndex: 1 }}>
        <ChatInput
          onSendMessage={handleSendMessage}
          onAttachFile={handleAttachFile}
          onShareLocation={handleShareLocation}
          loading={loading || uploading}
          error={error || uploadError || socketError}
          recipientId={recipientId}
          isGroup={isGroup}
          currentUser={currentUser}
        />
      </Box>
      {/* Group management dialogs (stubs) */}
      <Dialog open={showGroupDialog} onClose={handleCloseGroupDialog}>
        <DialogTitle>Create Group</DialogTitle>
        <DialogContent>
          {/* Use CreateGroupDialog for actual group creation */}
          <CreateGroupDialog open={showGroupDialog} onClose={handleCloseGroupDialog} onGroupCreated={handleGroupCreated} />
        </DialogContent>
      </Dialog>
      <Dialog open={showMembersDialog} onClose={handleCloseMembersDialog}>
        <DialogTitle>Group Members</DialogTitle>
        <DialogContent>
          <List>
            {groupMembers.map((member) => (
              <ListItem key={member._id}>
                <ListItemText primary={member.username} secondary={member.email} />
                <Button onClick={() => handleRemoveMember(member._id)} color="error">Remove</Button>
              </ListItem>
            ))}
          </List>
          <TextField
            placeholder="User ID to add"
            fullWidth
            onKeyDown={e => {
              if (e.key === 'Enter' && e.target.value) {
                handleAddMember(e.target.value);
                e.target.value = '';
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMembersDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ChatWindow; 