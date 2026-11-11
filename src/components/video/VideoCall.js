import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Button, Grid, Typography, Alert, Stack, Avatar, List, ListItem, ListItemText, ListItemAvatar, Dialog, DialogTitle, DialogContent, DialogActions, Slide } from '@mui/material';
import { Call, CallEnd } from '@mui/icons-material';
import Peer from 'simple-peer';
import { useSocket } from '../common/SocketContext';
import Controls from './CallControls';
import { setActiveCall, endCall, toggleScreenShare } from '../../store/slices/callSlice';
import { addNotification } from '../../store/slices/notificationSlice';
import ringSoundFile from '../../assets/pop-blast-ringtones-236915.mp3'; // Use your new pop-blast ringtone
import { useParams, useLocation } from 'react-router-dom';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  // To use your own TURN server, add:
  // { urls: 'turn:your.turn.server:3478', username: 'user', credential: 'pass' }
];

const VideoCall = ({ roomId, isGroup, groupId }) => {
  const { id: calleeId } = useParams();
  const location = useLocation();
  const isCallee = location.search.includes('callee=1');
  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [screenShare, setScreenShare] = useState(null);
  const [screenSharer, setScreenSharer] = useState(null); // userId of who is sharing
  const [error, setError] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null); // { callerId, callerName, signal }
  const ringAudioRef = useRef(null);
  const { user } = useSelector(state => state.auth);
  const callState = useSelector(state => state.call);
  const dispatch = useDispatch();
  const userVideo = useRef();
  const peersRef = useRef({});
  const { socket } = useSocket();
  const [participantStatus, setParticipantStatus] = useState({}); // userId: status
  const [waitingTimeout, setWaitingTimeout] = useState(null);

  // Redirect if the callType is not 'video'
  useEffect(() => {
    if (callState.activeCall && callState.activeCall.callType && callState.activeCall.callType !== 'video') {
      window.location.href = '/dashboard';
    }
  }, [callState.activeCall]);

  // Move createPeer here so it has access to socket and user
  const createPeer = (userToCall, callerId, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      config: { iceServers: ICE_SERVERS },
    });
    peer.on('signal', signal => {
      if (socket && typeof socket.emit === 'function') {
        console.log('Emitting call_user', { userToCall, signalData: signal, callerId, callerName: user.username });
        socket.emit('call_user', {
          userToCall,
          signalData: signal,
          callerId,
          callerName: user.username
        });
      }
    });
    return peer;
  };

  useEffect(() => {
    if (!socket) return;
    let localStream;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setStream(stream);
        userVideo.current.srcObject = stream;
        localStream = stream;
        let joinRoomId;
        if (isGroup && groupId) {
          joinRoomId = `group:${groupId}`;
        } else {
          // One-to-one: join a unique call room
          joinRoomId = `call:${user._id}:${calleeId}`;
        }
        console.log('[Socket] Joining room:', joinRoomId);
        socket.emit('join_room', joinRoomId);
        dispatch(setActiveCall(joinRoomId));
        dispatch(addNotification({ id: Date.now(), message: 'You joined the call.', type: 'info' }));
        // Only auto-initiate call if user is the caller
        if (!isGroup && user && user._id && calleeId && user._id !== calleeId && !isCallee) {
          createPeer(calleeId, user._id, stream); // user._id is caller, calleeId is callee
        }
      })
      .catch(err => {
        setError('Camera/microphone access denied or unavailable.');
        dispatch(addNotification({ id: Date.now(), message: 'Camera/microphone access denied.', type: 'error' }));
      });
    // No per-component socket event listeners for call events here (handled globally)
    return () => {
      if (localStream) localStream.getTracks().forEach(track => track.stop());
      Object.values(peersRef.current).forEach(({ peer }) => peer.destroy());
      if (socket && typeof socket.emit === 'function') {
        console.log('[Socket] Leaving room:', roomId);
        socket.emit('leave_room', roomId);
      }
      dispatch(endCall());
      dispatch(addNotification({ id: Date.now(), message: 'You left the call.', type: 'info' }));
      setIncomingCall(null);
      setPeers({});
    };
  }, [socket, roomId, dispatch, user._id, user.username, isCallee]);

  useEffect(() => {
    if (!socket) return;
    // Join group room if group call
    if (isGroup && groupId) {
      socket.emit('join_room', `group:${groupId}`);
    }
    // Listen for incoming group call
    const handleIncomingGroupCall = (data) => {
      if (data.groupId === groupId) {
        setIncomingCall({ callerId: data.callerId, callerName: data.callerName, signal: data.signal, callType: data.callType });
        // Play ringing sound, show UI, etc.
      }
    };
    if (socket && typeof socket.on === 'function') socket.on('incoming_group_call', handleIncomingGroupCall);
    return () => {
      if (socket && typeof socket.off === 'function') socket.off('incoming_group_call', handleIncomingGroupCall);
      if (isGroup && groupId) socket.emit('leave_room', `group:${groupId}`);
    };
  }, [socket, isGroup, groupId]);

  useEffect(() => {
    if (!isGroup || !groupId) return;
    // On group call start, set all members to 'waiting' (simulate, or fetch from group info)
    // For demo, assume you have a groupMembers array (replace with real data)
    const groupMembers = callState.participants.map(p => p.id);
    const statusObj = {};
    groupMembers.forEach(id => {
      if (id !== user._id) statusObj[id] = 'waiting';
    });
    setParticipantStatus(statusObj);
    // Set timeout for waiting
    if (waitingTimeout) clearTimeout(waitingTimeout);
    const timeout = setTimeout(() => {
      setParticipantStatus(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          if (updated[id] === 'waiting') updated[id] = 'did_not_join';
        });
        return updated;
      });
    }, 30000);
    setWaitingTimeout(timeout);
    return () => { if (timeout) clearTimeout(timeout); };
  }, [isGroup, groupId, callState.participants, user._id]);

  // Listen for user_offline/user_busy events and update status
  useEffect(() => {
    if (!socket) return;
    const handleUserOffline = ({ userToCall }) => {
      setParticipantStatus(prev => ({ ...prev, [userToCall]: 'offline' }));
    };
    const handleUserBusy = ({ userToCall }) => {
      setParticipantStatus(prev => ({ ...prev, [userToCall]: 'busy' }));
    };
    socket.on('user_offline', handleUserOffline);
    socket.on('user_busy', handleUserBusy);
    return () => {
      socket.off('user_offline', handleUserOffline);
      socket.off('user_busy', handleUserBusy);
    };
  }, [socket]);

  // One-to-one: auto-close modal if recipient is offline/busy
  useEffect(() => {
    if (!isGroup && (participantStatus[user._id] === 'offline' || participantStatus[user._id] === 'busy')) {
      setIncomingCall(null);
      setError('User is offline or busy.');
    }
  }, [isGroup, participantStatus, user._id]);

  // Listen for 'user_offline' socket event. When received, show an error and auto-exit the call UI after 2 seconds.
  useEffect(() => {
    if (!socket) return;
    const handleUserOffline = ({ userToCall }) => {
      console.log('user_offline event received', userToCall);
      setError('The user is offline.');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    };
    socket.on('user_offline', handleUserOffline);
    return () => {
      socket.off('user_offline', handleUserOffline);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const handleIncomingCall = ({ signal, callerId, callerName, callType }) => {
      if (callType && callType !== 'video') {
        // Ignore voice calls in VideoCall page
        return;
      }
      setIncomingCall({ callerId, callerName, signal, callType });
      if (ringAudioRef.current) ringAudioRef.current.play();
    };
    socket.on('incoming_call', handleIncomingCall);
    return () => {
      socket.off('incoming_call', handleIncomingCall);
    };
  }, [socket]);

  const addPeer = (incomingSignal, callerId, stream, callType) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: { iceServers: ICE_SERVERS },
    });
    peer.on('signal', signal => {
      socket.emit('answer_call', { signal, to: callerId, callType });
    });
    peer.signal(incomingSignal);
    return peer;
  };

  const startScreenShare = async () => {
    try {
      if (screenSharer && screenSharer.userId !== user._id) {
        socket.emit('screen_share_request', { toUserId: screenSharer.userId, fromUserId: user._id, fromUsername: user.username });
        return;
      }
      const screenStream = await navigator.mediaDevices.getDisplayMedia();
      setScreenShare(screenStream);
      Object.values(peersRef.current).forEach(({ peer }) => {
        peer.replaceTrack(
          stream.getVideoTracks()[0],
          screenStream.getVideoTracks()[0],
          stream
        );
      });
      socket.emit('screen_share_started', { roomId, userId: user._id, username: user.username });
      setScreenSharer({ userId: user._id, username: user.username });
      dispatch(toggleScreenShare());
    } catch (error) {
      setError('Error sharing screen: ' + (error.message || error));
    }
  };

  const stopScreenShare = () => {
    if (screenShare) {
      screenShare.getTracks().forEach(track => track.stop());
      Object.values(peersRef.current).forEach(({ peer }) => {
        peer.replaceTrack(
          screenShare.getVideoTracks()[0],
          stream.getVideoTracks()[0],
          stream
        );
      });
      setScreenShare(null);
      socket.emit('screen_share_stopped', { roomId });
      setScreenSharer(null);
      dispatch(toggleScreenShare());
    }
  };

  // Reject call handler
  const handleRejectCall = () => {
    if (incomingCall) {
      socket.emit('reject_call', { callerId: incomingCall.callerId });
      setIncomingCall(null);
      setPeers({});
      dispatch(endCall());
    }
  };

  // Accept call handler
  const handleAcceptCall = () => {
    if (incomingCall) {
      // Create peer as callee
      const peer = addPeer(incomingCall.signal, incomingCall.callerId, stream, 'video');
      peersRef.current[incomingCall.callerId] = peer;
      setPeers(peers => ({ ...peers, [incomingCall.callerId]: { peer, username: incomingCall.callerName } }));
      setIncomingCall(null);
      if (ringAudioRef.current) ringAudioRef.current.pause();
    }
  };

  // To start a group call:
  const startGroupCall = (callType, signalData) => {
    if (socket && isGroup && groupId) {
      socket.emit('group_call', { groupId, callType, signalData });
    }
  };

  // Add navigation on call end
  const handleEndCall = () => {
    dispatch(endCall());
    setIncomingCall(null);
    setPeers({});
    window.location.href = '/dashboard';
  };

  // UI for screen sharing status and controls
  return (
    <Box sx={{ height: '100vh', p: 2, position: 'relative' }}>
      <audio ref={ringAudioRef} src={ringSoundFile} loop />
      {/* Incoming Call Modal */}
      <Dialog
        open={!!incomingCall}
        TransitionComponent={Slide}
        transitionDuration={400}
        keepMounted
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 3,
            minWidth: 320,
            textAlign: 'center',
            background: 'rgba(255,255,255,0.95)',
            boxShadow: 24
          }
        }}
        BackdropProps={{
          sx: { backdropFilter: 'blur(4px)' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22, mb: 1 }}>
          Incoming Video Call
        </DialogTitle>
        <DialogContent>
          <Avatar sx={{ width: 72, height: 72, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 36 }}>
            {incomingCall?.callerName?.[0]?.toUpperCase() || '?'}
          </Avatar>
          <Typography variant="h6" sx={{ mb: 1 }}>{incomingCall?.callerName || 'Unknown'}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Call color="success" sx={{ fontSize: 32, mr: 1, animation: 'ringing 1s infinite alternate' }} />
            <Typography color="text.secondary">Ringing...</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<Call />}
            onClick={handleAcceptCall}
            sx={{ minWidth: 120, fontWeight: 600 }}
          >
            Accept
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="large"
            startIcon={<CallEnd />}
            onClick={handleRejectCall}
            sx={{ minWidth: 120, fontWeight: 600 }}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
      <style>{`
        @keyframes ringing {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
      `}</style>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {/* Participant List */}
        <List sx={{ mb: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
          {callState.participants.map((p) => (
            <ListItem key={p.id}>
              <ListItemAvatar>
                <Avatar>{p.username?.[0]?.toUpperCase()}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={p.username}
                secondary={
                  <>
                    {isGroup && (
                      <>
                        {participantStatus[p.id] === 'waiting' && <span style={{ color: '#888' }}>Waiting...</span>}
                        {participantStatus[p.id] === 'connected' && <span style={{ color: 'green' }}>Connected</span>}
                        {participantStatus[p.id] === 'busy' && <span style={{ color: 'orange' }}>Busy</span>}
                        {participantStatus[p.id] === 'offline' && <span style={{ color: 'red' }}>Offline</span>}
                        {participantStatus[p.id] === 'did_not_join' && <span style={{ color: 'gray' }}>Did not join</span>}
                      </>
                    )}
                    {!isGroup && (
                      <>
                        {callState.isMuted && 'Muted'}
                        {callState.isVideoOff && ' | Video Off'}
                        {callState.isScreenSharing && ' | Sharing Screen'}
                      </>
                    )}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <video ref={userVideo} autoPlay playsInline muted />
          </Grid>
          {Object.entries(peers).map(([peerId, { peer, username }]) => (
            <Grid item xs={12} md={3} key={peerId}>
              <video
                ref={video => {
                  if (video && peer.streams && peer.streams[0]) video.srcObject = peer.streams[0];
                }}
                autoPlay
                playsInline
              />
              <Typography>{username}</Typography>
            </Grid>
          ))}
        </Grid>
        <Controls
          stream={stream}
          screenShare={screenShare}
          onStartScreenShare={startScreenShare}
          onStopScreenShare={stopScreenShare}
          onEndCall={handleEndCall}
        />
      </Stack>
    </Box>
  );
};

export default VideoCall; 