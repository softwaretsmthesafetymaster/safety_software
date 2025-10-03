import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Permit {
  _id: string;
  permitNumber: string;
  workDescription: string;
  types: string[];
  status: string;
  schedule: {
    startDate: string;
    endDate: string;
  };
  requestedBy: {
    name: string;
    email: string;
  };
  plantId: {
    name: string;
    code: string;
  };
  createdAt: string;
}

interface PermitState {
  permits: Permit[];
  currentPermit: Permit | null;
  isLoading: boolean;
  error: string | null;
  stats: any;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

const initialState: PermitState = {
  permits: [],
  currentPermit: null,
  isLoading: false,
  error: null,
  stats: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
  },
};

export const fetchPermits = createAsyncThunk(
  'permit/fetchAll',
  async ({ companyId, ...params }: { companyId: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/permits/${companyId}?${queryParams}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch permits');
    }
  }
);

export const fetchPermitById = createAsyncThunk(
  'permit/fetchById',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/permits/${companyId}/${id}`);
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch permit');
    }
  }
);

export const createPermit = createAsyncThunk(
  'permit/create',
  async ({ companyId, permitData }: { companyId: string; permitData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/permits/${companyId}`, permitData);
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create permit');
    }
  }
);

export const updatePermit = createAsyncThunk(
  'permit/update',
  async ({ companyId, id, data }: { companyId: string; id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/permits/${companyId}/${id}`, data);
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update permit');
    }
  }
);

export const submitPermit = createAsyncThunk(
  'permit/submit',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/permits/${companyId}/${id}/submit`);
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit permit');
    }
  }
);

export const fetchPermitStats = createAsyncThunk(
  'permit/fetchStats',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/permits/${companyId}/stats/dashboard`);
      return response.data.stats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);

export const approvePermit = createAsyncThunk(
  'permit/approve',
  async ({ companyId, id, decision, comments }: { companyId: string; id: string; decision: string; comments: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/permits/${companyId}/${id}/approve`, { decision, comments });
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process approval');
    }
  }
);

export const closePermit = createAsyncThunk(
  'permit/close',
  async ({ companyId, id, closureData }: { companyId: string; id: string; closureData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/permits/${companyId}/${id}/close`, { closureData,approvalDecision: closureData.approvalDecision });
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to close permit');
    }
  }
);

export const stopPermit = createAsyncThunk(
  'permit/stop',
  async ({ companyId, id, stopData }: { companyId: string; id: string; stopData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/permits/${companyId}/${id}/stop`, { stopData });
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to stop permit');
    }
  }
);

export const activatePermit = createAsyncThunk(
  'permit/activate',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/permits/${companyId}/${id}/activate`);
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to activate permit');
    }
  }
);
const permitSlice = createSlice({
  name: 'permit',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPermit: (state) => {
      state.currentPermit = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch permits
      .addCase(fetchPermits.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPermits.fulfilled, (state, action) => {
        state.isLoading = false;
        state.permits = action.payload.permits;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          total: action.payload.total,
        };
      })
      .addCase(fetchPermits.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch permit by ID
      .addCase(fetchPermitById.fulfilled, (state, action) => {
        state.currentPermit = action.payload;
      })
      // Create permit
      .addCase(createPermit.fulfilled, (state, action) => {
        state.permits.unshift(action.payload);
        state.currentPermit = action.payload;
      })
      // Update permit
      .addCase(updatePermit.fulfilled, (state, action) => {
        const index = state.permits.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.permits[index] = action.payload;
        }
        if (state.currentPermit?._id === action.payload._id) {
          state.currentPermit = action.payload;
        }
      })
      // Submit permit
      .addCase(submitPermit.fulfilled, (state, action) => {
        const index = state.permits.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.permits[index] = action.payload;
        }
        if (state.currentPermit?._id === action.payload._id) {
          state.currentPermit = action.payload;
        }
      })
      // Fetch stats
      .addCase(fetchPermitStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // Approve permit
      .addCase(approvePermit.fulfilled, (state, action) => {
        const index = state.permits.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.permits[index] = action.payload;
        }
        if (state.currentPermit?._id === action.payload._id) {
          state.currentPermit = action.payload;
        }
      })
      // Close permit
      .addCase(closePermit.fulfilled, (state, action) => {
        const index = state.permits.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.permits[index] = action.payload;
        }
        if (state.currentPermit?._id === action.payload._id) {
          state.currentPermit = action.payload;
        }
      })
      // Stop permit
      .addCase(stopPermit.fulfilled, (state, action) => {
        const index = state.permits.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.permits[index] = action.payload;
        }
        if (state.currentPermit?._id === action.payload._id) {
          state.currentPermit = action.payload;
        }
      })
      // Activate permit
      .addCase(activatePermit.fulfilled, (state, action) => {
        const index = state.permits.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.permits[index] = action.payload;
        }
        if (state.currentPermit?._id === action.payload._id) {
          state.currentPermit = action.payload;
        }
      });
  },
});

export const { clearError, clearCurrentPermit } = permitSlice.actions;
export default permitSlice.reducer;