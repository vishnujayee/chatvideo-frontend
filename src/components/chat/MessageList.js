import { Box, Paper, Typography, Avatar, Fade, Tooltip } from '@mui/material';
import { useSelector } from 'react-redux';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useEffect, useRef } from 'react';

const MessageList = ({ messages, currentUser }) => {
  const listRef = useRef();
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);
  return (
    <Box ref={listRef} sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, overflowY: 'auto', p: 1 }} aria-label="Message list">
      {messages.map((message) => {
        const isOwn = (message.sender?._id || message.sender) === currentUser._id;
        return (
          <Fade in key={message._id} timeout={400}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: isOwn ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: 1,
              }}
              aria-live="polite"
            >
              <Avatar
                src={message.sender?.avatar}
                alt={message.sender?.username}
                sx={{ width: 32, height: 32, fontSize: 16 }}
              >
                {message.sender?.username?.[0]?.toUpperCase()}
              </Avatar>
              <Tooltip title={new Date(message.createdAt).toLocaleString()} arrow placement={isOwn ? 'left' : 'right'}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 1.5,
                    maxWidth: '70%',
                    bgcolor: isOwn ? 'primary.main' : 'grey.100',
                    color: isOwn ? 'white' : 'text.primary',
                    borderRadius: 3,
                    borderTopRightRadius: isOwn ? 0 : 3,
                    borderTopLeftRadius: isOwn ? 3 : 0,
                    mb: 0.5,
                    transition: 'background 0.2s',
                    wordBreak: 'break-word',
                    fontSize: 15,
                  }}
                  tabIndex={0}
                  aria-label={isOwn ? 'Your message' : `${message.sender?.username}'s message`}
                >
                  {message.type === 'media' && message.mediaUrl ? (
                    message.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img src={message.mediaUrl} alt="attachment" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 4 }} />
                    ) : (
                      <a href={message.mediaUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <InsertDriveFileIcon fontSize="small" />
                        <span>Download file</span>
                      </a>
                    )
                  ) : message.type === 'location' && message.location ? (
                    <a href={`https://maps.google.com/?q=${message.location.latitude},${message.location.longitude}`} target="_blank" rel="noopener noreferrer">
                      <Typography color="primary">Shared Location</Typography>
                      <Typography variant="caption" color="textSecondary">{message.location.latitude}, {message.location.longitude}</Typography>
                    </a>
                  ) : (
                    <Typography sx={{ wordBreak: 'break-word' }}>{message.content}</Typography>
                  )}
                  {/* Message status (sent/delivered) - placeholder, needs backend support for read */}
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7, fontSize: 11 }}>
                    {isOwn ? 'Sent' : ''}
                  </Typography>
                </Paper>
              </Tooltip>
            </Box>
          </Fade>
        );
      })}
    </Box>
  );
};

export default MessageList; 