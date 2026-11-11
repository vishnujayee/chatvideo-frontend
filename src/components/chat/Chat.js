import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { chatAPI } from '../../services/api';
import { useSocket } from '../common/SocketContext';
import { Box, CircularProgress, Typography } from '@mui/material';
import { setMessages, setMessagingMethod } from '../../store/slices/chatSlice';

const Chat = ({ type, id }) => {
  const dispatch = useDispatch();
  const messages = useSelector(state => state.chat.messages);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const { user } = useSelector(state => state.auth);
  const { socket } = useSocket();
  const messagingMethod = useSelector(state => state.chat.messagingMethod);

  // Join/leave chat room
  useEffect(() => {
    if (!socket) return;
    const roomId = type === 'group' ? `group:${id}` : id;
    socket.emit('join_room', roomId);
    return () => {
      socket.emit('leave_room', roomId);
    };
  }, [socket, type, id]);

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = type === 'group' 
          ? await chatAPI.getGroupMessages(id, { page })
          : await chatAPI.getPrivateMessages(id, { page });
        const newMessages = response.data.messages;
        dispatch(setMessages(newMessages));
        setHasMore(newMessages.length === 50);
      } catch (error) {
        console.error('Load messages error:', error);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [type, id, page, dispatch]);

  // Refactor sendMessage to use selected method
  const sendMessage = async (content, messageType = 'text', attachments = null) => {
    if (messagingMethod === 'socket') {
      if (socket && typeof socket.emit === 'function') {
        if (type === 'group') {
          socket.emit('group_message', {
            groupId: id,
            content,
            type: messageType,
            mediaUrl: attachments
          });
        } else {
          socket.emit('private_message', {
            recipient: id,
            content,
            type: messageType,
            mediaUrl: attachments
          });
        }
      }
    } else {
      // API method
      try {
        const messageData = {
          content,
          type: messageType,
          ...(attachments && { mediaUrl: attachments })
        };
        const response = type === 'group'
          ? await chatAPI.sendGroupMessage(id, messageData)
          : await chatAPI.sendPrivateMessage(id, messageData);
        dispatch(setMessages([...messages, response.data.message].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )));
        scrollToBottom();
        return response.data.message;
      } catch (error) {
        console.error('Send message error:', error);
        throw error;
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  // Filter messages for current chat/group only
  const filteredMessages = messages.filter(
    m => type === 'group' ? m.groupId === id : (m.sender === id || m.recipient === id)
  );

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {loading && <CircularProgress />}
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
      <MessageList 
        messages={filteredMessages}
        currentUser={user}
        onLoadMore={loadMore}
        hasMore={hasMore}
        loading={loading}
      />
      <MessageInput onSend={sendMessage} />
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default Chat; 