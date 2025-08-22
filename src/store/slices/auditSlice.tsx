import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Audit {
  _id: string;
  auditNumber: string;
  title: string;
  type: string;
  standard: string;
  status: string;
  auditor: {
    name: string;
    email: string;
  };
  plantId: {
    name: string;
    code: string;
  };
  scheduledDate: string;
  createdAt: string;
}

interface AuditState {
  audits: Audit[];
  currentAudit: Audit | null;
  isLoading: boolean;
  error: string | null;
  stats: any;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

const initialState: AuditState = {
  audits: [],
  currentAudit: null,
  isLoading: false,
  error: null,
  stats: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
  },
};

export const fetchAudits = createAsyncThunk(
  'audit/fetchAll',
  async ({ companyId, ...params }: { companyId: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/audits/${companyId}?${queryParams}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch audits');
    }
  }
);

export const fetchAuditById = createAsyncThunk(
  'audit/fetchById',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/audits/${companyId}/${id}`);
      return response.data.audit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch audit');
    }
  }
);

export const createAudit = createAsyncThunk(
  'audit/create',
  async ({ companyId, auditData }: { companyId: string; auditData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/audits/${companyId}`, auditData);
      return response.data.audit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create audit');
    }
  }
);

export const updateAudit = createAsyncThunk(
  'audit/update',
  async ({ companyId, id, data }: { companyId: string; id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/audits/${companyId}/${id}`, data);
      return response.data.audit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update audit');
    }
  }
);

export const fetchAuditStats = createAsyncThunk(
  'audit/fetchStats',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/audits/${companyId}/stats/dashboard`);
      return response.data.stats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAudit: (state) => {
      state.currentAudit = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch audits
      .addCase(fetchAudits.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAudits.fulfilled, (state, action) => {
        state.isLoading = false;
        state.audits = action.payload.audits;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          total: action.payload.total,
        };
      })
      .addCase(fetchAudits.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch audit by ID
      .addCase(fetchAuditById.fulfilled, (state, action) => {
        state.currentAudit = action.payload;
      })
      // Create audit
      .addCase(createAudit.fulfilled, (state, action) => {
        state.audits.unshift(action.payload);
        state.currentAudit = action.payload;
      })
      // Update audit
      .addCase(updateAudit.fulfilled, (state, action) => {
        const index = state.audits.findIndex(a => a._id === action.payload._id);
        if (index !== -1) {
          state.audits[index] = action.payload;
        }
        if (state.currentAudit?._id === action.payload._id) {
          state.currentAudit = action.payload;
        }
      })
      // Fetch stats
      .addCase(fetchAuditStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearError, clearCurrentAudit } = auditSlice.actions;
export default auditSlice.reducer;