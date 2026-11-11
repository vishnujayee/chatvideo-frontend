import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Grid,
  Alert,
  Button
} from '@mui/material';
import {
  MicOff,
  Mic,
  CallEnd
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useSocket } from '../components/common/SocketContext';
import Peer from 'simple-peer';
import { addNotification } from '../store/slices/notificationSlice';
import ringSoundFile from '../assets/pop-blast-ringtones-236915.mp3'; // Use your new pop-blast ringtone
import { endCall } from '../store/slices/callSlice';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  // To use your own TURN server, add:
  // { urls: 'turn:your.turn.server:3478', username: 'user', credential: 'pass' }
];

const VoiceCall = () => {
  const { id } = useParams();
  const location = useLocation();
  const isGroup = location.pathname.includes('/group/');
  const isCallee = location.search.includes('callee=1');
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [peers, setPeers] = useState({});
  const peersRef = useRef({});
  const { socket } = useSocket();
  const localAudioRef = useRef();
  const [error, setError] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null); // { callerId, callerName, signal }
  const ringAudioRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    let localStream;
    let timer;
    const initializeCall = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (localAudioRef.current) {
          localAudioRef.current.srcObject = localStream;
        }
        console.log('[Socket] Joining room:', id);
        socket.emit('join_room', id);
        dispatch(addNotification({ id: Date.now(), message: 'You joined the voice call.', type: 'info' }));
        // Only auto-initiate call if user is the caller
        if (user && user._id && id && user._id !== id && !isCallee) {
          createPeer(id, user._id, localStream); // user._id is caller, id is callee
        }
      } catch (err) {
        setError('Microphone access denied or unavailable.');
        dispatch(addNotification({ id: Date.now(), message: 'Microphone access denied.', type: 'error' }));
        return;
      }
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      // No per-component socket event listeners for call events here (handled globally)
      // Only handle local media/peer logic and UI.
      return () => {
        clearInterval(timer);
        if (localStream) localStream.getTracks().forEach(track => track.stop());
        Object.values(peersRef.current).forEach(({ peer }) => peer.destroy());
        if (socket && typeof socket.emit === 'function') {
          console.log('[Socket] Leaving room:', id);
          socket.emit('leave_room', id);
        }
        dispatch(addNotification({ id: Date.now(), message: 'You left the voice call.', type: 'info' }));
        setIncomingCall(null);
        setPeers({});
        dispatch(endCall());
      };
    };
    const cleanup = initializeCall();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [socket, id, user.username, dispatch, isCallee]);

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
      if (callType && callType !== 'voice') {
        // Ignore video calls in VoiceCall page
        return;
      }
      setIncomingCall({ callerId, callerName, signal });
      if (ringAudioRef.current) ringAudioRef.current.play();
    };
    socket.on('incoming_call', handleIncomingCall);
    return () => {
      socket.off('incoming_call', handleIncomingCall);
    };
  }, [socket]);

  // Redirect if the callType is not 'voice'
  const callState = useSelector(state => state.call);
  useEffect(() => {
    if (callState.activeCall && callState.activeCall.callType && callState.activeCall.callType !== 'voice') {
      window.location.href = '/dashboard';
    }
  }, [callState.activeCall]);

  const createPeer = (userToCall, callerId, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      config: { iceServers: ICE_SERVERS },
    });
    peer.on('signal', signal => {
      if (socket && typeof socket.emit === 'function') {
        console.log('Emitting call_user', { userToCall, signalData: signal, callerId, callerName: user.username, callType: 'voice' });
        socket.emit('call_user', {
          userToCall,
          signalData: signal,
          callerId,
          callerName: user.username,
          callType: 'voice'
        });
      }
    });
    return peer;
  };

  const addPeer = (incomingSignal, callerId, stream, callType) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: { iceServers: ICE_SERVERS },
    });
    peer.on('signal', signal => {
      if (socket && typeof socket.emit === 'function') socket.emit('answer_call', { signal, to: callerId, callType });
    });
    peer.signal(incomingSignal);
    return peer;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMute = () => {
    setIsMuted(m => !m);
    if (localAudioRef.current && localAudioRef.current.srcObject) {
      localAudioRef.current.srcObject.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  };

  // End call logic (could navigate away or emit a socket event)
  const handleEndCall = () => {
    dispatch(endCall());
    setIncomingCall(null);
    setPeers({});
    window.location.href = '/dashboard';
  };

  // Reject call handler
  const handleRejectCall = () => {
    if (incomingCall) {
      if (socket && typeof socket.emit === 'function') socket.emit('reject_call', { callerId: incomingCall.callerId });
      setIncomingCall(null);
      setPeers({});
      dispatch(endCall());
    }
  };

  // Accept call handler
  const handleAcceptCall = () => {
    if (incomingCall) {
      // Create peer as callee
      const peer = addPeer(incomingCall.signal, incomingCall.callerId, localAudioRef.current.srcObject, 'voice');
      peersRef.current[incomingCall.callerId] = peer;
      setPeers(peers => ({ ...peers, [incomingCall.callerId]: { peer, username: incomingCall.callerName } }));
      setIncomingCall(null);
      if (ringAudioRef.current) ringAudioRef.current.pause();
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default'
      }}
    >
      <audio ref={ringAudioRef} src={ringSoundFile} loop />
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 4,
          maxWidth: 500,
          width: '100%'
        }}
      >
        {/* Incoming call UI */}
        {incomingCall && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Incoming call from {incomingCall.callerName}
            <Button color="success" variant="contained" size="small" sx={{ ml: 2 }} onClick={handleAcceptCall}>
              Accept
            </Button>
            <Button color="error" variant="outlined" size="small" sx={{ ml: 2 }} onClick={handleRejectCall}>
              Reject
            </Button>
          </Alert>
        )}
        <Avatar
          sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
        />
        <Typography variant="h6" gutterBottom>
          {isGroup ? 'Group Voice Call' : 'Voice Call'}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          {formatDuration(duration)}
        </Typography>
        {error && <Typography color="error">{error}</Typography>}
        <audio ref={localAudioRef} autoPlay muted />
        {/* Render remote participants' audio */}
        {Object.entries(peers).map(([peerId, { peer, username }]) => (
          <Box key={peerId} sx={{ mt: 2 }}>
            <Typography variant="subtitle2">{username}</Typography>
            <audio
              ref={audio => {
                if (audio && peer.streams && peer.streams[0]) audio.srcObject = peer.streams[0];
              }}
              autoPlay
            />
          </Box>
        ))}
        <Grid container spacing={2} justifyContent="center" sx={{ mt: 2 }}>
          <Grid item>
            <IconButton
              size="large"
              onClick={handleMute}
              color={isMuted ? "error" : "primary"}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </IconButton>
          </Grid>
          <Grid item>
            <IconButton
              size="large"
              color="error"
              onClick={handleEndCall}
            >
              <CallEnd />
            </IconButton>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default VoiceCall; 