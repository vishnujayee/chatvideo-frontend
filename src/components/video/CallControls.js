import { useState } from 'react';
import { 
  Box, 
  IconButton, 
  Badge, 
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Mic, MicOff,
  Videocam, VideocamOff,
  ScreenShare, StopScreenShare,
  Settings, Chat,
  PeopleAlt, CallEnd,
  RecordVoiceOver
} from '@mui/icons-material';

const CallControls = ({
  stream,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onStartRecording,
  onEndCall,
  participants,
  isAdmin
}) => {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleAudioToggle = () => {
    setAudioEnabled(!audioEnabled);
    onToggleAudio(!audioEnabled);
  };

  const handleVideoToggle = () => {
    setVideoEnabled(!videoEnabled);
    onToggleVideo(!videoEnabled);
  };

  const handleSettingsClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setAnchorEl(null);
  };

  const handleShowSettings = () => {
    setShowSettings(true);
    handleSettingsClose();
  };

  return (
    <Box sx={{ 
      position: 'fixed', 
      bottom: 20, 
      left: '50%', 
      transform: 'translateX(-50%)',
      bgcolor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 4,
      padding: 2,
      display: 'flex',
      gap: 2
    }}>
      <Tooltip title={audioEnabled ? "Mute" : "Unmute"}>
        <IconButton onClick={handleAudioToggle} color="primary">
          {audioEnabled ? <Mic /> : <MicOff />}
        </IconButton>
      </Tooltip>

      <Tooltip title={videoEnabled ? "Stop Video" : "Start Video"}>
        <IconButton onClick={handleVideoToggle} color="primary">
          {videoEnabled ? <Videocam /> : <VideocamOff />}
        </IconButton>
      </Tooltip>

      <Tooltip title={isScreenSharing ? "Stop Sharing" : "Share Screen"}>
        <IconButton onClick={onToggleScreenShare} color="primary">
          {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
        </IconButton>
      </Tooltip>

      <Tooltip title="Participants">
        <IconButton>
          <Badge badgeContent={(participants || []).length} color="primary">
            <PeopleAlt />
          </Badge>
        </IconButton>
      </Tooltip>

      {isAdmin && (
        <Tooltip title="Start Recording">
          <IconButton onClick={onStartRecording} color="primary">
            <RecordVoiceOver />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title="Settings">
        <IconButton onClick={handleSettingsClick} color="primary">
          <Settings />
        </IconButton>
      </Tooltip>

      {onEndCall && (
        <Tooltip title="End Call">
          <IconButton onClick={onEndCall} color="error">
            <CallEnd />
          </IconButton>
        </Tooltip>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleSettingsClose}
      >
        <MenuItem onClick={handleShowSettings}>Audio Settings</MenuItem>
        <MenuItem onClick={handleShowSettings}>Video Settings</MenuItem>
        <MenuItem onClick={handleShowSettings}>Connection Settings</MenuItem>
      </Menu>

      <Dialog open={showSettings} onClose={() => setShowSettings(false)}>
        <DialogTitle>Call Settings</DialogTitle>
        <DialogContent>
          {/* Add settings controls here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CallControls; 