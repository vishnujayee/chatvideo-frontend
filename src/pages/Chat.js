import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  IconButton,
  Typography,
  Divider,
  Badge,
  CircularProgress,
  Alert,
  Popover,
  Tooltip
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  Refresh,
  PersonAdd,
  ArrowBack,
  Call,
  VideoCall,
  Info
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { setMessagingMethod, setMessages, addMessage } from '../store/slices/chatSlice';
import { chatAPI, userAPI, contactsAPI, groupAPI } from '../services/api';
import EmojiPicker from 'emoji-picker-react';
import { useSocket } from '../components/common/SocketContext';
import { styled } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router-dom';
import AddContactDialog from '../components/dialogs/AddContactDialog';
import debounce from 'lodash/debounce';
import { addNotification } from '../store/slices/notificationSlice';
import { useTheme } from '@mui/material/styles';

const Chat = () => {
  const { user } = useSelector(state => state.auth);
  const { contactId } = useParams();
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const { socket } = useSocket();
  const messagesEndRef = useRef(null);
  const onlineUsers = useSelector(state => state.contacts.onlineUsers);
  const messagingMethod = useSelector(state => state.chat.messagingMethod);
  const messages = useSelector(state => state.chat.messages);
  const dispatch = useDispatch();
  const initialLoadDone = useRef(false);
  const navigate = useNavigate();
  const [showAddContact, setShowAddContact] = useState(false);
  const lastFetchedChatId = useRef(null);
  const debouncedLoadMessages = useRef(debounce((id, isGroup) => loadMessages(id, isGroup), 300)).current;
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState(null);
  const fetchContactsAndGroups = async () => {
    setLoadingContacts(true);
    setContactsError(null);
    try {
      const [contactsRes, groupsRes] = await Promise.all([
        contactsAPI.getContacts(),
        chatAPI.getGroupMessages ? groupAPI.getGroups() : Promise.resolve({ data: [] })
      ]);
      setContacts(contactsRes.data.filter(c => c._id !== user._id));
      setGroups(groupsRes.data || []);
    } catch (error) {
      setContactsError('Failed to load contacts or groups');
      dispatch(addNotification({ id: Date.now(), message: 'Failed to load contacts or groups', type: 'error' }));
    } finally {
      setLoadingContacts(false);
    }
  };
  const debouncedFetchContactsAndGroups = useRef(debounce(fetchContactsAndGroups, 300)).current;
  const theme = useTheme();

  // Load contacts and groups on mount
  useEffect(() => {
    if (!initialLoadDone.current) {
      debouncedFetchContactsAndGroups();
      initialLoadDone.current = true;
    }
  }, []);

  // If contactId is present in the URL, open that chat automatically
  useEffect(() => {
    if (contactId && contacts.length > 0) {
      const contact = contacts.find(c => c._id === contactId);
      if (contact) setSelectedChat({ ...contact, isGroup: false });
    }
  }, [contactId, contacts]);

  // Search users by email
  const handleSearch = async () => {
    if (!searchEmail.trim()) return; // Prevent empty search
    setContactsError(null);
    setLoadingContacts(true);
    try {
      const response = await userAPI.searchUsers(searchEmail);
      const newContact = response.data;
      if (Array.isArray(newContact)) {
        newContact.forEach(c => {
          if (c._id !== user._id && !contacts.some(contact => contact._id === c._id)) {
            setContacts(prev => [...prev, c]);
          }
        });
      } else if (newContact._id !== user._id && !contacts.some(contact => contact._id === newContact._id)) {
        setContacts(prev => [...prev, newContact]);
      }
      setSearchEmail('');
    } catch (error) {
      setContactsError('Error searching user');
    } finally {
      setLoadingContacts(false);
    }
  };

  // Load messages for selected chat or group
  useEffect(() => {
    if (selectedChat && selectedChat._id !== lastFetchedChatId.current) {
      debouncedLoadMessages(selectedChat._id, selectedChat.isGroup);
      lastFetchedChatId.current = selectedChat._id;
    }
  }, [selectedChat, debouncedLoadMessages]);

  const loadMessages = async (id, isGroup = false) => {
    setLoadingMessages(true);
    setMessagesError(null);
    try {
      let response;
      if (isGroup) {
        response = await chatAPI.getGroupMessages(id);
      } else {
        response = await chatAPI.getPrivateMessages(id);
      }
      const msgs = Array.isArray(response.data.messages) ? response.data.messages : response.data;
      // Always sort by createdAt ascending
      dispatch(setMessages(msgs.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))));
      scrollToBottom();
    } catch (error) {
      setMessagesError('Error loading messages');
      dispatch(addNotification({ id: Date.now(), message: 'Error loading messages', type: 'error' }));
    } finally {
      setLoadingMessages(false);
    }
  };

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message) => {
      // Only add if for current chat/group
      if (selectedChat && ((selectedChat.isGroup && message.groupId === selectedChat._id) || (!selectedChat.isGroup && (message.sender === selectedChat._id || message.recipient === selectedChat._id)))) {
        dispatch(addMessage(message));
        scrollToBottom();
      }
    };
    if (socket && typeof socket.on === 'function') socket.on('new_message', handleNewMessage);
    return () => {
      if (socket && typeof socket.off === 'function') socket.off('new_message', handleNewMessage);
    };
  }, [socket, selectedChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Refactor message sending logic to use selected method
  const handleSendMessage = async (content, type = 'text', mediaUrl = '', location = null) => {
    const trimmedContent = (content || newMessage).trim();
    if ((!trimmedContent && !mediaUrl) || !selectedChat) return;
    setSending(true);
    setSendError(null);
    try {
      if (messagingMethod === 'socket') {
        if (socket && typeof socket.emit === 'function') {
          const msgData = selectedChat?.isGroup
            ? { groupId: selectedChat._id, content: trimmedContent, type, mediaUrl, location }
            : { recipient: selectedChat._id, content: trimmedContent, type, mediaUrl, location };
          socket.emit(selectedChat?.isGroup ? 'group_message' : 'private_message', msgData);
          // Do NOT optimistically add the message to the UI here. The UI will update when 'new_message' is received from the backend.
          scrollToBottom();
        }
      } else {
        // API method
        if (!trimmedContent && !mediaUrl) {
          setSendError('Message content or media is required');
          setSending(false);
          return;
        }
        const messageData = {
          content: trimmedContent,
          type,
          ...(mediaUrl && { mediaUrl }),
          ...(location && { location })
        };
        const response = selectedChat?.isGroup
          ? await chatAPI.sendGroupMessage(selectedChat._id, messageData)
          : await chatAPI.sendPrivateMessage(selectedChat._id, messageData);
        if (response && response.data && response.data.message) {
          dispatch(addMessage(response.data.message));
          scrollToBottom();
        }
      }
      setNewMessage('');
    } catch (error) {
      setSendError('Error sending message');
      dispatch(addNotification({ id: Date.now(), message: 'Error sending message', type: 'error' }));
    } finally {
      setSending(false);
    }
  };

  // Emoji picker handlers
  const handleEmojiClick = (event, emojiObject) => {
    setNewMessage(prev => prev + (emojiObject.emoji || ''));
    setEmojiAnchor(null);
  };

  // File/media picker handler
  const handleAttachFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // TODO: Implement file upload logic here
    alert('File upload not implemented in this demo.');
  };

  // Refresh contacts and groups
  const handleRefresh = () => {
    fetchContactsAndGroups();
  };

  // UI for full chat page (all groups and people)
  const [showFullChat, setShowFullChat] = useState(false);
  const openFullChat = () => setShowFullChat(true);
  const closeFullChat = () => setShowFullChat(false);

  // Sidebar click handlers
  const handleSelectContact = (contact) => {
    setSelectedChat({ ...contact, isGroup: false });
    navigate(`/chat/single/${contact._id}`);
  };
  const handleSelectGroup = (group) => {
    setSelectedChat({ ...group, isGroup: true });
    navigate(`/chat/group/${group._id}`);
  };

  // Styled badge for online status
  const OnlineBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
      backgroundColor: '#44b700',
      color: '#44b700',
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      borderRadius: '50%',
      height: 10,
      minWidth: 10,
      border: '2px solid white',
    },
  }));

  const handleShareLocation = () => {
    alert('Location sharing not implemented in this demo.');
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: theme.palette.background.default }}>
      <Grid container sx={{ maxWidth: 1200, width: '100%', height: '90vh', boxShadow: 3, borderRadius: 4, overflow: 'hidden', bgcolor: theme.palette.background.paper }}>
        {/* Sidebar: Contacts & Groups */}
        <Grid item xs={3} sx={{ borderRight: 1, borderColor: 'divider', bgcolor: theme.palette.background.paper, minWidth: 260, maxWidth: 320, height: '100%', overflowY: 'auto', boxShadow: 2 }}>
          <Paper elevation={0} sx={{ height: '100%', bgcolor: 'white', borderRadius: 0, boxShadow: 'none', p: 0 }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>Chats</Typography>
              <Box>
                <IconButton onClick={handleRefresh} size="small" title="Refresh" style={{ color: '#1976d2' }}>
                  <Refresh />
                </IconButton>
                <IconButton onClick={() => setShowAddContact(true)} size="small" title="Add Contact" style={{ color: '#1976d2' }}>
                  <PersonAdd />
                </IconButton>
              </Box>
            </Box>
            <Divider />
            <List sx={{ overflowY: 'auto', maxHeight: 'calc(100vh - 180px)', p: 0 }}>
              {/* Show groups first */}
              {groups.map((group) => (
                <ListItem
                  key={group._id}
                  button
                  selected={selectedChat?._id === group._id}
                  onClick={() => handleSelectGroup(group)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: selectedChat?._id === group._id ? '#e3f2fd' : 'inherit',
                    boxShadow: selectedChat?._id === group._id ? 2 : 0,
                    transition: 'background 0.2s',
                    '&:hover': { background: '#f0f7ff' },
                  }}
                >
                  <ListItemAvatar>
                    <OnlineBadge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant={onlineUsers.includes(group._id) ? 'dot' : undefined}
                    >
                      <Avatar src={group.avatar} alt={group.name} sx={{ bgcolor: '#1976d2' }}>
                        {group.name?.[0]?.toUpperCase()}
                      </Avatar>
                    </OnlineBadge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: 600 }}>{group.name}</Typography>}
                    secondary="Group"
                  />
                </ListItem>
              ))}
              {/* Then contacts */}
              {contacts.map((contact) => (
                <ListItem
                  key={contact._id}
                  button
                  selected={selectedChat?._id === contact._id}
                  onClick={() => handleSelectContact(contact)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: selectedChat?._id === contact._id ? '#e3f2fd' : 'inherit',
                    boxShadow: selectedChat?._id === contact._id ? 2 : 0,
                    transition: 'background 0.2s',
                    '&:hover': { background: '#f0f7ff' },
                  }}
                >
                  <ListItemAvatar>
                    <OnlineBadge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant={onlineUsers.includes(contact._id) ? 'dot' : undefined}
                    >
                      <Avatar src={contact.avatar} alt={contact.username} sx={{ bgcolor: '#1976d2' }}>
                        {contact.username?.[0]?.toUpperCase()}
                      </Avatar>
                    </OnlineBadge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: 600 }}>{contact.username}</Typography>}
                    secondary={contact.status || ''}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        {/* Chat Window */}
        <Grid item xs={9} sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 0, bgcolor: theme.palette.background.default }}>
          <Paper elevation={2} sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 4, bgcolor: theme.palette.background.default, minHeight: 0, boxShadow: 2, m: 2, p: 0 }}>
            {/* Chat Header */}
            {selectedChat && (
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'primary.light', borderTopLeftRadius: 12, borderTopRightRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton onClick={() => { setSelectedChat(null); navigate('/chat'); }}>
                    <ArrowBack />
                  </IconButton>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedChat.isGroup ? selectedChat.name : selectedChat.username || selectedChat.name || selectedChat.email}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {selectedChat.isGroup ? 'Group' : selectedChat.email}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {!selectedChat.isGroup && (
                    <IconButton onClick={() => navigate(`/call/single/${selectedChat._id}`)} title="Voice Call">
                      <Call />
                    </IconButton>
                  )}
                  {!selectedChat.isGroup && (
                    <IconButton onClick={() => navigate(`/video/single/${selectedChat._id}`)} title="Video Call">
                      <VideoCall />
                    </IconButton>
                  )}
                  <IconButton onClick={() => navigate(selectedChat.isGroup ? `/group/${selectedChat._id}` : `/profile/${selectedChat._id}`)} title="Info">
                    <Info />
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* Messages Area */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 3, minHeight: 0, borderLeft: '1px solid', borderColor: 'divider', bgcolor: theme.palette.background.default, background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #23272f 0%, #2c313a 100%)' : 'linear-gradient(135deg, #f5fafd 0%, #e3f2fd 100%)' }}>
              {loadingMessages ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : messagesError ? (
                <Alert severity="error">{messagesError}</Alert>
              ) : !selectedChat ? (
                <Box sx={{ textAlign: 'center', mt: 8 }}>
                  <img src="/illustrations/chat-empty.svg" alt="No chat" style={{ width: 180, opacity: 0.7 }} />
                  <Typography color="textSecondary" sx={{ mt: 2 }}>Select a contact or group to start chatting</Typography>
                </Box>
              ) : messages.length === 0 ? (
                <Typography color="textSecondary" align="center">No messages yet.</Typography>
              ) : (
                messages.map((message, idx) => {
                  const isOwn = (message.sender?._id || message.sender) === user._id;
                  const bubbleBg = isOwn
                    ? theme.palette.primary.main
                    : theme.palette.mode === 'dark'
                      ? theme.palette.grey[900]
                      : theme.palette.common.white;
                  const bubbleText = isOwn
                    ? theme.palette.primary.contrastText
                    : theme.palette.text.primary;
                  const showAvatar = !isOwn && (idx === 0 || (messages[idx - 1].sender !== message.sender));
                  return (
                  <Box
                    key={message._id}
                    sx={{
                      display: 'flex',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        mb: 2,
                        alignItems: 'flex-end',
                    }}
                  >
                      {!isOwn && showAvatar && (
                        <Avatar
                          src={message.sender?.avatar}
                          alt={message.sender?.username || ''}
                          sx={{ width: 32, height: 32, mr: 1, alignSelf: 'flex-end', bgcolor: theme.palette.secondary.main, fontSize: 16 }}
                        >
                          {message.sender?.username?.[0]?.toUpperCase() || '?'}
                        </Avatar>
                      )}
                    <Paper
                        elevation={4}
                      sx={{
                          p: 2,
                          maxWidth: '65%',
                          bgcolor: bubbleBg,
                          color: bubbleText,
                        borderRadius: 3,
                          borderTopRightRadius: isOwn ? 0 : 3,
                          borderTopLeftRadius: isOwn ? 3 : 0,
                          boxShadow: isOwn ? '0 2px 8px #1976d233' : '0 2px 8px #b0bec533',
                          fontSize: 16,
                        wordBreak: 'break-word',
                        transition: 'background 0.2s',
                          ml: isOwn ? 6 : 0,
                          mr: isOwn ? 0 : 1,
                          minHeight: 44,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isOwn ? 'flex-end' : 'flex-start',
                      }}
                    >
                        <Typography sx={{ wordBreak: 'break-word', color: bubbleText, fontSize: 16 }}>{message.content}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5, textAlign: isOwn ? 'right' : 'left', color: bubbleText }}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Paper>
                      {isOwn && <Box sx={{ width: 32, ml: 1 }} />} {/* Spacer for alignment */}
                  </Box>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            {selectedChat && (
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: theme.palette.background.paper, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                {sendError && <Alert severity="error">{sendError}</Alert>}
                <Grid container spacing={1} alignItems="center" wrap="nowrap">
                  {/* Send via Dropdown */}
                  <Grid item>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                  <Typography variant="subtitle2" sx={{ mr: 1 }}>Send via:</Typography>
                  <select
                    value={messagingMethod}
                    onChange={e => dispatch(setMessagingMethod(e.target.value))}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 }}
                  >
                    <option value="socket">Socket</option>
                    <option value="api">API</option>
                  </select>
                </Box>
                  </Grid>
                  {/* Emoji Picker */}
                  <Grid item>
                    <Tooltip title="Emoji">
                    <IconButton onClick={(e) => setEmojiAnchor(e.currentTarget)}>
                      <EmojiEmotions />
                    </IconButton>
                    </Tooltip>
                    <Popover
                      open={Boolean(emojiAnchor)}
                      anchorEl={emojiAnchor}
                      onClose={() => setEmojiAnchor(null)}
                      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                      transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    >
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </Popover>
                  </Grid>
                  {/* Media Picker */}
                  <Grid item>
                    <Tooltip title="Attach file">
                    <IconButton component="label">
                      <AttachFile />
                      <input
                        type="file"
                        hidden
                        onChange={handleAttachFile}
                          accept="image/*,video/*,audio/*"
                      />
                    </IconButton>
                    </Tooltip>
                  </Grid>
                  {/* Location Picker */}
                  <Grid item>
                    <Tooltip title="Share location">
                      <IconButton onClick={handleShareLocation}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 12 22 12 22C12 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5Z" fill="#1976d2"/></svg>
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  {/* Input Field */}
                  <Grid item xs>
                    <TextField
                      fullWidth
                      size="medium"
                      placeholder="Type a message"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={sending}
                      sx={{ bgcolor: theme.palette.background.paper, borderRadius: 2, fontSize: 16 }}
                    />
                  </Grid>
                  {/* Send Button */}
                  <Grid item>
                    <Tooltip title="Send">
                    <IconButton color="primary" onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                      <Send />
                    </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      {/* Full chat page dialog */}
      {showFullChat && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.3)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Paper sx={{ width: 600, maxHeight: 700, overflow: 'auto', p: 3, borderRadius: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>All Chats & Groups</Typography>
            <List>
              {groups.map((group) => (
                <ListItem key={group._id} button onClick={() => { setSelectedChat({ ...group, isGroup: true }); closeFullChat(); }}>
                  <ListItemAvatar>
                    <Avatar src={group.avatar}>{group.name?.[0]?.toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={group.name} secondary="Group" />
                </ListItem>
              ))}
              {contacts.map((contact) => (
                <ListItem key={contact._id} button onClick={() => { setSelectedChat({ ...contact, isGroup: false }); closeFullChat(); }}>
                  <ListItemAvatar>
                    <Avatar src={contact.avatar}>{contact.username?.[0]?.toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={contact.username} secondary={contact.email} />
                </ListItem>
              ))}
            </List>
            <Box sx={{ textAlign: 'right', mt: 2 }}>
              <IconButton onClick={closeFullChat} color="error"><span role="img" aria-label="close">❌</span></IconButton>
            </Box>
          </Paper>
        </Box>
      )}
      <AddContactDialog open={showAddContact} onClose={() => setShowAddContact(false)} />
    </Box>
  );
};

export default Chat; 