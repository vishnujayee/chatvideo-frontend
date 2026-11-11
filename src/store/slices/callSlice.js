import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeCall: null,
  participants: [],
  isScreenSharing: false,
  isMuted: false,
  isVideoOff: false
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    setActiveCall: (state, action) => {
      state.activeCall = action.payload;
    },
    setParticipants: (state, action) => {
      state.participants = action.payload;
    },
    toggleScreenShare: (state) => {
      state.isScreenSharing = !state.isScreenSharing;
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    toggleVideo: (state) => {
      state.isVideoOff = !state.isVideoOff;
    },
    endCall: (state) => {
      state.activeCall = null;
      state.participants = [];
      state.isScreenSharing = false;
    }
  }
});

export const { 
  setActiveCall, 
  setParticipants, 
  toggleScreenShare, 
  toggleMute, 
  toggleVideo, 
  endCall 
} = callSlice.actions;

export default callSlice.reducer; 