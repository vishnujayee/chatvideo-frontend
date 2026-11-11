import { useState, useEffect } from 'react';
import { 
  TextField, 
  Box, 
  List, 
  ListItem, 
  ListItemText,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
  Alert
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import debounce from 'lodash/debounce';
import { chatAPI } from '../../services/api';

const MessageSearch = ({ chatId, onMessageSelect, isGroup = false }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedSearch = debounce(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let response;
      if (isGroup) {
        response = await chatAPI.getGroupMessages(chatId, { q: searchQuery });
      } else {
        response = await chatAPI.getPrivateMessages(chatId, { q: searchQuery });
      }
      setResults(response.data.filter(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase())));
    } catch (err) {
      setError('Search error');
    } finally {
      setLoading(false);
    }
  }, 500);

  useEffect(() => {
    debouncedSearch(query);
    return () => debouncedSearch.cancel();
  }, [query]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setError(null);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
      <TextField
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search messages..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton onClick={handleClear} size="small">
                <Clear />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      {error && <Alert severity="error">{error}</Alert>}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      {results.length > 0 && (
        <List sx={{ mt: 2 }}>
          {results.map((message) => (
            <ListItem 
              key={message._id}
              button
              onClick={() => onMessageSelect(message)}
              sx={{ 
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ListItemText
                primary={message.content}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {message.sender.username}
                    </Typography>
                    {' — '}
                    {new Date(message.createdAt).toLocaleString()}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default MessageSearch; 