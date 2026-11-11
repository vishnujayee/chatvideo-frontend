import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { contactsAPI } from '../../services/api';

// Async thunks
export const fetchContacts = createAsyncThunk(
  'contacts/fetchContacts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await contactsAPI.getContacts();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch contacts');
    }
  }
);

export const fetchPendingRequests = createAsyncThunk(
  'contacts/fetchPendingRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await contactsAPI.getContactRequests();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch requests');
    }
  }
);

export const handleContactRequest = createAsyncThunk(
  'contacts/handleRequest',
  async ({ requestId, action }, { dispatch, rejectWithValue, getState }) => {
    try {
      const { contacts } = getState();
      
      // Check if request is already being processed
      const existingRequest = contacts.incomingRequests.find(req => req._id === requestId);
      if (!existingRequest) {
        return rejectWithValue('Request not found or already processed');
      }

      let response;
      if (action === 'accept') {
        response = await contactsAPI.acceptRequest(requestId);
      } else {
        response = await contactsAPI.rejectRequest(requestId);
      }

      // Remove the request from pending list
      dispatch(removeRequest(requestId));

      // If accepted and we got a contact back, add it
      if (action === 'accept' && response.data.contact) {
        // Check if contact already exists
        const contactExists = contacts.contacts.some(
          c => c._id === response.data.contact._id
        );
        if (!contactExists) {
          dispatch(addContact(response.data.contact));
        }
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to handle request');
    }
  }
);

const contactSlice = createSlice({
  name: 'contacts',
  initialState: {
    contacts: [],
    incomingRequests: [],
    outgoingRequestIds: [], // was: new Set()
    loading: {
      contacts: false,
      requests: false,
      action: false
    },
    error: null,
    lastUpdated: null,
    onlineUsers: [],
    typingUsers: {}, // { [userId]: username }
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    removeRequest: (state, action) => {
      state.incomingRequests = state.incomingRequests.filter(
        request => request._id !== action.payload
      );
      state.outgoingRequestIds = state.outgoingRequestIds.filter(id => id !== action.payload);
    },
    addContact: (state, action) => {
      // Don't add if already in contacts
      const exists = state.contacts.some(contact => contact._id === action.payload._id);
      if (!exists) {
        state.contacts.push(action.payload);
      }
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    setTypingUser: (state, action) => {
      const { userId, username } = action.payload;
      state.typingUsers[userId] = username;
    },
    clearTypingUser: (state, action) => {
      delete state.typingUsers[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch contacts
      .addCase(fetchContacts.pending, (state) => {
        state.loading.contacts = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.loading.contacts = false;
        // Remove any duplicate contacts
        const uniqueContacts = Array.from(
          new Map(action.payload.map(contact => [contact._id.toString(), contact])).values()
        );
        state.contacts = uniqueContacts;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loading.contacts = false;
        state.error = action.payload;
      })
      // Fetch pending requests
      .addCase(fetchPendingRequests.pending, (state) => {
        state.loading.requests = true;
        state.error = null;
      })
      .addCase(fetchPendingRequests.fulfilled, (state, action) => {
        state.loading.requests = false;
        state.incomingRequests = action.payload.incoming;
        state.outgoingRequestIds = Array.isArray(action.payload.outgoingIds) ? action.payload.outgoingIds : [];
        state.lastUpdated = Date.now();
      })
      .addCase(fetchPendingRequests.rejected, (state, action) => {
        state.loading.requests = false;
        state.error = action.payload;
      })
      // Handle contact request
      .addCase(handleContactRequest.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(handleContactRequest.fulfilled, (state) => {
        state.loading.action = false;
        state.lastUpdated = Date.now();
      })
      .addCase(handleContactRequest.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, removeRequest, addContact, setOnlineUsers, setTypingUser, clearTypingUser } = contactSlice.actions;
export default contactSlice.reducer; 