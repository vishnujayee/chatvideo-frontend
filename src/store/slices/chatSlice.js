import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  loading: false,
  error: null,
  activeChat: null,
  messagingMethod: 'socket', // 'api' or 'socket'
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
      state.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    },
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },
    clearChat: (state) => {
      state.messages = [];
      state.activeChat = null;
    },
    setMessagingMethod: (state, action) => {
      state.messagingMethod = action.payload;
    }
  }
});

export const { setMessages, addMessage, setActiveChat, clearChat, setMessagingMethod } = chatSlice.actions;
export default chatSlice.reducer; 