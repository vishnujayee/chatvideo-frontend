import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { initializeSocket } from '../../services/socket';
import { addMessage } from '../../store/slices/chatSlice';
import { setActiveCall, setParticipants, endCall } from '../../store/slices/callSlice';
import { addNotification } from '../../store/slices/notificationSlice';
import { setOnlineUsers, setTypingUser, clearTypingUser } from '../../store/slices/contactSlice';

const SocketContext = createContext({ socket: null, connectionStatus: 'disconnected', connectionError: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const token = useSelector(state => state.auth?.token);
  const dispatch = useDispatch();
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionError, setConnectionError] = useState(null);
  const activeCall = useSelector(state => state.call.activeCall);

  // Handle socket connection and authentication
  useEffect(() => {
    if (!token) {
      setSocket(null);
      setConnectionStatus('disconnected');
      setConnectionError(null);
      return;
    }
    setConnectionStatus('connecting');
    const sock = initializeSocket(token);
    setSocket(sock);
    // Connection status listeners
    const handleConnect = () => {
      setConnectionStatus('connected');
      setConnectionError(null);
      sock.emit('whoami');
      console.log('[Socket] Connected');
    };
    const handleDisconnect = () => {
      setConnectionStatus('disconnected');
      console.log('[Socket] Disconnected');
    };
    const handleError = (err) => {
      setConnectionStatus('error');
      setConnectionError(err?.message || 'Socket connection error');
      console.error('[Socket] Error:', err);
    };
    sock.on('connect', handleConnect);
    sock.on('disconnect', handleDisconnect);
    sock.on('connect_error', handleError);
    sock.on('error', handleError);
    // Heartbeat interval
    let heartbeatInterval = setInterval(() => {
      if (sock && sock.connected) {
        sock.emit('heartbeat');
      }
    }, 20000);
    return () => {
      sock.off('connect', handleConnect);
      sock.off('disconnect', handleDisconnect);
      sock.off('connect_error', handleError);
      sock.off('error', handleError);
      sock.disconnect();
      setSocket(null);
      clearInterval(heartbeatInterval);
    };
  }, [token]);

  // Join own user room after handshake
  useEffect(() => {
    if (!socket || typeof socket.emit !== 'function') return;
    const handleYouAre = ({ userId }) => {
      socket.user = { _id: userId };
      socket.emit('join_room', userId); // Always join own user room for private messages
      console.log('[Socket] Joined own room:', userId, 'Socket ID:', socket.id);
    };
    socket.on('youare', handleYouAre);
    return () => {
      socket.off('youare', handleYouAre);
    };
  }, [socket]);

  // Global real-time event listeners
  useEffect(() => {
    if (!socket) return;
    // --- Messaging ---
    const handleNewMessage = (data) => {
      if (data && data.message) {
        dispatch(addMessage(data.message));
        console.log('[Socket] new_message received:', data.message, 'Socket ID:', socket.id, 'User ID:', socket.user?._id);
      }
    };
    socket.on('new_message', handleNewMessage);
    // --- Online users ---
    const handleOnlineUsers = (userIds) => {
      dispatch(setOnlineUsers(userIds));
      console.log('[Socket] online_users:', userIds);
    };
    socket.on('online_users', handleOnlineUsers);
    // --- Typing indicators ---
    const handleUserTyping = ({ userId, username }) => {
      dispatch(setTypingUser({ userId, username }));
      console.log('[Socket] user_typing:', userId, username);
    };
    const handleUserStopTyping = (userId) => {
      dispatch(clearTypingUser(userId));
      console.log('[Socket] user_stop_typing:', userId);
    };
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    // --- Call events ---
    const handleUserOffline = (data) => {
      dispatch(addNotification({ id: Date.now(), message: 'User is offline and cannot receive the call.', type: 'warning' }));
      console.log('[Socket] user_offline:', data);
    };
    const handleUserBusy = (data) => {
      dispatch(addNotification({ id: Date.now(), message: 'User is busy and cannot receive the call.', type: 'warning' }));
      console.log('[Socket] user_busy:', data);
    };
    const handleIncomingCall = (data) => {
      // Only set activeCall if not already in a call
      if (activeCall) {
        // Already in a call, ignore repeated incoming calls
        console.warn('Ignoring incoming_call: already in a call');
        return;
      }
      const callType = data.callType || (data.call && data.call.type) || 'video';
      // Only set activeCall if the callType matches the current route/component
      // We'll rely on the component-level handler to filter further, but this prevents global state overwrite
      dispatch(setActiveCall({ ...data, callType }));
      dispatch(addNotification({ id: Date.now(), message: `${data.callerName || (data.call && data.call.initiator?.username) || 'Unknown'} is calling.`, type: 'info' }));
      console.log('[Socket] incoming_call:', data);
    };
    const handleCallAccepted = (data) => {
      dispatch(addNotification({ id: Date.now(), message: 'Call accepted.', type: 'success' }));
      dispatch(setActiveCall(null));
      console.log('[Socket] call_accepted:', data);
    };
    const handleCallRejected = (data) => {
      dispatch(addNotification({ id: Date.now(), message: 'Call rejected.', type: 'error' }));
      dispatch(endCall());
      dispatch(setActiveCall(null));
      console.log('[Socket] call_rejected:', data);
    };
    const handleCallMissed = (data) => {
      dispatch(addNotification({ id: Date.now(), message: 'Call missed.', type: 'error' }));
      dispatch(endCall());
      dispatch(setActiveCall(null));
      console.log('[Socket] call_missed:', data);
    };
    const handleCallEnded = (data) => {
      dispatch(addNotification({ id: Date.now(), message: 'Call ended.', type: 'info' }));
      dispatch(endCall());
      dispatch(setActiveCall(null));
      console.log('[Socket] call_ended:', data);
    };
    // --- Group call events ---
    const handleIncomingGroupCall = (data) => {
      // Fix: Add callType from data or default to 'video' for backward compatibility
      if (activeCall) {
        // Already in a call, ignore repeated incoming calls
        console.warn('Ignoring incoming_group_call: already in a call');
        return;
      }
      const callType = data.callType || 'video';
      dispatch(setActiveCall({ ...data, callType }));
      dispatch(addNotification({ id: Date.now(), message: `Group call from ${data.callerName}.`, type: 'info' }));
      console.log('[Socket] incoming_group_call:', data);
    };
    // --- Participant updates ---
    const handleRoomParticipants = (participants) => {
      dispatch(setParticipants(participants));
      console.log('[Socket] room_participants:', participants);
    };
    // Register listeners
    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_missed', handleCallMissed);
    socket.on('call_ended', handleCallEnded);
    socket.on('incoming_group_call', handleIncomingGroupCall);
    socket.on('room_participants', handleRoomParticipants);
    socket.on('user_offline', handleUserOffline);
    socket.on('user_busy', handleUserBusy);
    // Cleanup
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('online_users', handleOnlineUsers);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_missed', handleCallMissed);
      socket.off('call_ended', handleCallEnded);
      socket.off('incoming_group_call', handleIncomingGroupCall);
      socket.off('room_participants', handleRoomParticipants);
      socket.off('user_offline', handleUserOffline);
      socket.off('user_busy', handleUserBusy);
    };
  }, [socket, dispatch, activeCall]);

  useEffect(() => {
    if (!socket) return;
    socket.onAny((event, ...args) => {
      console.log('[Socket] Event:', event, args);
    });
    return () => {
      socket.offAny();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, connectionStatus, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
}; 