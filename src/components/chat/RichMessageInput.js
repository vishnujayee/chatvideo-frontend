import { useState, useRef } from 'react';
import { 
  Box, 
  Paper, 
  IconButton, 
  Tooltip,
  Popover,
  Button,
  Alert
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatQuote,
  Code,
  AttachFile,
  Send,
  EmojiEmotions,
  LocationOn
} from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react';
import { Editor } from '@tinymce/tinymce-react';
import PropTypes from 'prop-types';

const RichMessageInput = ({ onSend, onAttachFile, onShareLocation, loading = false, error = null }) => {
  const [content, setContent] = useState('');
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const editorRef = useRef(null);

  const handleSend = () => {
    if (!content.trim() || loading) return;
    onSend(content);
    setContent('');
  };

  const handleEmojiClick = (event, emojiObject) => {
    setContent(prev => prev + emojiObject.emoji);
    setEmojiAnchor(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2,
        position: 'relative',
        borderRadius: 2
      }}
    >
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <Box sx={{ mb: 1, display: 'flex', gap: 1 }}>
        <Tooltip title="Bold">
          <IconButton size="small" disabled={loading}>
            <FormatBold />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic">
          <IconButton size="small" disabled={loading}>
            <FormatItalic />
          </IconButton>
        </Tooltip>
        <Tooltip title="Quote">
          <IconButton size="small" disabled={loading}>
            <FormatQuote />
          </IconButton>
        </Tooltip>
        <Tooltip title="Code">
          <IconButton size="small" disabled={loading}>
            <Code />
          </IconButton>
        </Tooltip>
      </Box>
      <Editor
        onInit={(evt, editor) => editorRef.current = editor}
        value={content}
        onEditorChange={(content) => setContent(content)}
        init={{
          height: 100,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
          ],
          toolbar: false,
          statusbar: false,
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px }',
          readonly: loading
        }}
        disabled={loading}
      />
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 1 
      }}>
        <Box>
          <Tooltip title="Add emoji">
            <IconButton onClick={(e) => setEmojiAnchor(e.currentTarget)} disabled={loading}>
              <EmojiEmotions />
            </IconButton>
          </Tooltip>
          <Tooltip title="Attach file">
            <IconButton component="label" disabled={loading}>
              <AttachFile />
              <input
                type="file"
                hidden
                onChange={onAttachFile}
                accept="image/*,video/*,audio/*"
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share location">
            <IconButton onClick={onShareLocation} disabled={loading}>
              <LocationOn />
            </IconButton>
          </Tooltip>
        </Box>
        <Button
          variant="contained"
          endIcon={<Send />}
          onClick={handleSend}
          disabled={!content.trim() || loading}
        >
          Send
        </Button>
      </Box>
      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <EmojiPicker onEmojiClick={handleEmojiClick} />
      </Popover>
    </Paper>
  );
};

RichMessageInput.propTypes = {
  onSend: PropTypes.func.isRequired,
  onAttachFile: PropTypes.func,
  onShareLocation: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string
};

export default RichMessageInput; 