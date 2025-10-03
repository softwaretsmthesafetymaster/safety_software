import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  companyId?: string;
  company?: {
    name: string;
    logo?: string;
  };
  plantId?: {
    _id: string;
    name: string;
    code: string;
  };
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface UserState {
  users: User[];
  plantUsers: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  stats: any;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

const initialState: UserState = {
  users: [],  
  plantUsers: [],
  currentUser: null,
  isLoading: false,
  error: null,
  stats: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
  },
};

export const fetchUsers = createAsyncThunk(
  'user/fetchAll',
  async ({ companyId, ...params }: { companyId: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/users/${companyId}?${queryParams}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const fetchPlantUsers = createAsyncThunk(
  'user/fetchByPlantId',
  async({companyId,plantId}:{companyId: string; plantId: string}, { rejectWithValue }) => {
    try{
      
      const response = await axios.get(`${API_URL}/users/${companyId}/${plantId}`)
      
      return response.data.users;
    }catch(error:any){
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
)

export const fetchUserById = createAsyncThunk(
  'user/fetchById',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/users/${companyId}/${id}`);
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const createUser = createAsyncThunk(
  'user/create',
  async ({ companyId, userData }: { companyId: string; userData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/users/${companyId}`, userData);
      console.log('User created:', response);
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'user/update',
  async ({ companyId, id, data }: { companyId: string; id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/users/${companyId}/${id}`, data);
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user');
    }
  }
);

export const deactivateUser = createAsyncThunk(
  'user/deactivate',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/users/${companyId}/${id}/deactivate`);
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to deactivate user');
    }
  }
);

export const activateUser = createAsyncThunk(
  'user/activate',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/users/${companyId}/${id}/activate`);
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to activate user');
    }
  }
);

export const fetchUserStats = createAsyncThunk(
  'user/fetchStats',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/users/${companyId}/stats/dashboard`);
      return response.data.stats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          total: action.payload.total,
        };
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch user by plant ID
      .addCase(fetchPlantUsers.fulfilled, (state,action) => {
        state.plantUsers = action.payload;
      })
      // Fetch user by ID
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.currentUser = action.payload;
      })
      // Create user
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload);
        state.currentUser = action.payload;
      })
      // Update user
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(u => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser?._id === action.payload._id) {
          state.currentUser = action.payload;
        }
      })
      // Deactivate user
      .addCase(deactivateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(u => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      // Activate user
      .addCase(activateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(u => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      // Fetch stats
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearError, clearCurrentUser } = userSlice.actions;
export default userSlice.reducer;