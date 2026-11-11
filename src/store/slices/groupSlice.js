import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { groupAPI } from '../../services/api';

export const fetchGroups = createAsyncThunk(
  'groups/fetchGroups',
  async () => {
    const response = await groupAPI.getGroups();
    return response.data;
  }
);

export const fetchGroupDetails = createAsyncThunk(
  'groups/fetchDetails',
  async (groupId) => {
    const response = await groupAPI.getGroup(groupId);
    return response.data;
  }
);

export const updateGroup = createAsyncThunk(
  'groups/update',
  async ({ groupId, data }) => {
    const response = await groupAPI.updateGroup(groupId, data);
    return response.data;
  }
);

export const addMember = createAsyncThunk(
  'groups/addMember',
  async ({ groupId, userId }) => {
    const response = await groupAPI.addMember(groupId, userId);
    return response.data;
  }
);

export const removeMember = createAsyncThunk(
  'groups/removeMember',
  async ({ groupId, userId }) => {
    const response = await groupAPI.removeMember(groupId, userId);
    return response.data;
  }
);

export const leaveGroup = createAsyncThunk(
  'groups/leaveGroup',
  async ({ groupId }) => {
    const response = await groupAPI.leaveGroup(groupId);
    return response.data;
  }
);

export const deleteGroup = createAsyncThunk(
  'groups/deleteGroup',
  async ({ groupId }) => {
    const response = await groupAPI.deleteGroup(groupId);
    return response.data;
  }
);

const groupSlice = createSlice({
  name: 'groups',
  initialState: {
    groups: [],
    currentGroup: null,
    loading: false,
    error: null
  },
  reducers: {
    clearGroupError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchGroupDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGroup = action.payload;
      })
      .addCase(fetchGroupDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.currentGroup = action.payload;
      })
      .addCase(addMember.fulfilled, (state, action) => {
        state.currentGroup = action.payload;
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.currentGroup = action.payload;
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.currentGroup = null;
        state.groups = state.groups.filter(g => g._id !== action.meta.arg.groupId);
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.currentGroup = null;
        state.groups = state.groups.filter(g => g._id !== action.meta.arg.groupId);
      });
  }
});

export const { clearGroupError } = groupSlice.actions;
export default groupSlice.reducer; 