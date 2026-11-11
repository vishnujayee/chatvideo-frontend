import axios from 'axios';
// Removed: import { io } from 'socket.io-client';

// Remove trailing slash from API_URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token
    });
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/api/auth/verify')) {
      // Only clear storage if it's not a verify request
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Let the auth slice handle the redirect
      return Promise.reject({ ...error, isAuthError: true });
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  verify: () => api.get('/api/auth/verify'),
  getProfile: () => api.get('/api/auth/me')
};

// Contacts API
export const contactsAPI = {
  // Get all contacts
  getContacts: () => api.get('/api/contacts'),
  
  // Contact requests
  sendContactRequest: (recipientId) => api.post('/api/contacts/requests/send', { recipientId }),
  getContactRequests: () => api.get('/api/contacts/requests'),
  acceptRequest: (requestId) => api.put(`/api/contacts/requests/${requestId}/accept`),
  rejectRequest: (requestId) => api.put(`/api/contacts/requests/${requestId}/reject`)
};

// Chat API with improved handling for both group and private messages
export const chatAPI = {
  // Get chat history with pagination and ordering
  getChatHistory: (params) => api.get('/api/messages', {
    params: {
      ...params,
      limit: params.limit || 50,
      orderBy: 'createdAt',
      order: 'desc'
    }
  }),

  // Get private chat messages
  getPrivateMessages: (userId, params = {}) => api.get(`/api/messages/private/${userId}`, {
    params: {
      ...params,
      limit: params.limit || 50,
      orderBy: 'createdAt',
      order: 'desc'
    }
  }),

  // Get group messages
  getGroupMessages: (groupId, params = {}) => api.get(`/api/messages/group/${groupId}`, {
    params: {
      ...params,
      limit: params.limit || 50,
      orderBy: 'createdAt',
      order: 'desc'
    }
  }),

  // Send private message
  sendPrivateMessage: (recipientId, messageData) => api.post('/api/messages/private', {
    recipient: recipientId,
    ...messageData
  }),

  // Send group message
  sendGroupMessage: (groupId, messageData) => api.post('/api/messages/group', {
    groupId,
    ...messageData
  }),

  // Mark messages as read
  markAsRead: (messageIds) => api.put('/api/messages/read', { messageIds }),

  // Get unread message count
  getUnreadCount: () => api.get('/api/messages/unread/count'),

  // Get latest messages for all chats (for chat list)
  getLatestMessages: () => api.get('/api/messages/latest')
};

// Socket service for real-time messaging
// Removed duplicate initializeSocket function from api.js. Use services/socket.js instead.

// Group API
export const groupAPI = {
  // Create group
  createGroup: (groupData) => api.post('/api/groups', groupData),
  
  // Get user's groups
  getGroups: () => api.get('/api/groups'),
  
  // Get specific group
  getGroup: (groupId) => api.get(`/api/groups/${groupId}`),
  
  // Update group
  updateGroup: (groupId, data) => api.put(`/api/groups/${groupId}`, data),
  
  // Add member
  addMember: (groupId, userId) => api.post(`/api/groups/${groupId}/members`, { userId }),
  
  // Remove member
  removeMember: (groupId, userId) => api.delete(`/api/groups/${groupId}/members`, { data: { userId } }),
  // Leave group
  leaveGroup: (groupId) => api.post(`/api/groups/${groupId}/leave`),
  // Delete group
  deleteGroup: (groupId) => api.delete(`/api/groups/${groupId}`)
};

// Call API
export const callAPI = {
  // Start call
  initiateCall: (userId, type = 'video') => api.post('/api/calls/initiate', {
    recipient: userId,
    type
  }),
  
  // End call
  endCall: (callId) => api.put(`/api/calls/${callId}/end`),
  
  // Get call history
  getCallHistory: () => api.get('/api/calls/history')
};

// User API
export const userAPI = {
  // Search users
  searchUsers: (email) => api.get(`/api/users/search?email=${email}`),
  
  // Update profile
  updateProfile: (data) => api.put('/api/users/profile', data),
  
  // Upload avatar
  uploadAvatar: (formData) => api.post('/api/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
};

// Media API
export const mediaAPI = {
  // Upload file
  uploadFile: (formData) => api.post('/api/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // Get shared media
  getSharedMedia: (chatId) => api.get(`/api/media/chat/${chatId}`)
};

// Settings API
export const settingsAPI = {
  getSettings: () => api.get('/api/settings'),
  updateSettings: (data) => api.put('/api/settings', data),
};

// Update account deletion to use correct endpoint
export const deleteAccount = () => api.delete('/api/auth/delete');

export default api; 