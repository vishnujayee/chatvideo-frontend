import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Alert
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  LocationOn
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { useSocket } from '../common/SocketContext';
import { useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';

const ChatInput = ({ onSendMessage, onAttachFile, onShareLocation, loading = false, error = null, recipientId, isGroup = false, currentUser }) => {
  const [message, setMessage] = useState('');
  const { socket } = useSocket();
  const typingTimeout = useRef(null);
  const lastTypingSent = useRef(0);
  const [emojiAnchor, setEmojiAnchor] = useState(null);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (socket && typeof socket.emit === 'function' && recipientId) {
      const now = Date.now();
      if (now - lastTypingSent.current > 500) {
        socket.emit('typing_start', recipientId, isGroup);
        lastTypingSent.current = now;
      }
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('typing_stop', recipientId, isGroup);
      }, 2000);
    }
  };

  const handleInputBlur = () => {
    if (socket && typeof socket.emit === 'function' && recipientId) {
      socket.emit('typing_stop', recipientId, isGroup);
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  const handleEmojiClick = (event, emojiObject) => {
    setMessage(prev => prev + (emojiObject.emoji || ''));
    setEmojiAnchor(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !loading) {
      onSendMessage(message);
      setMessage('');
      if (socket && typeof socket.emit === 'function' && recipientId) {
        socket.emit('typing_stop', recipientId, isGroup);
      }
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={message}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder="Type a message..."
        variant="outlined"
        disabled={loading}
        InputProps={{
          sx: { borderRadius: 3, bgcolor: 'background.paper' },
          endAdornment: (
            <InputAdornment position="end">
              <IconButton component="label" disabled={loading}>
                <AttachFile />
                <input
                  type="file"
                  hidden
                  onChange={onAttachFile}
                  accept="image/*,video/*"
                />
              </IconButton>
              <IconButton disabled={loading} onClick={e => setEmojiAnchor(e.currentTarget)}>
                <EmojiEmotions />
              </IconButton>
              <IconButton onClick={onShareLocation} disabled={loading}>
                <LocationOn />
              </IconButton>
              <IconButton type="submit" disabled={!message.trim() || loading}>
                <Send />
              </IconButton>
              <EmojiPicker
                open={Boolean(emojiAnchor)}
                anchorEl={emojiAnchor}
                onEmojiClick={handleEmojiClick}
                onClose={() => setEmojiAnchor(null)}
              />
            </InputAdornment>
          )
        }}
      />
    </Box>
  );
};

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  onAttachFile: PropTypes.func,
  onShareLocation: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string
};

export default ChatInput; 