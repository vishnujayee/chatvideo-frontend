import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = (token) => {
  return io(process.env.REACT_APP_WS_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initializeSocket first.');
  }
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

export default {
  initializeSocket,
  getSocket,
  closeSocket,
}; 