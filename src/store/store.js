import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import contactReducer from './slices/contactSlice';
import notificationReducer from './slices/notificationSlice';
import chatReducer from './slices/chatSlice';
import groupReducer from './slices/groupSlice';
import callReducer from './slices/callSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    contacts: contactReducer,
    notifications: notificationReducer,
    chat: chatReducer,
    groups: groupReducer,
    call: callReducer
  }
});

export default store; 