import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface BBSReport {
  _id: string;
  reportNumber: string;
  observationType: string;
  category: string;
  description: string;
  severity: string;
  status: string;
  observer: {
    name: string;
    email: string;
  };
  plantId: {
    name: string;
    code: string;
  };
  observationDate: string;
  createdAt: string;
}

interface BBSState {
  reports: BBSReport[];
  currentReport: BBSReport | null;
  isLoading: boolean;
  error: string | null;
  stats: any;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

const initialState: BBSState = {
  reports: [],
  currentReport: null,
  isLoading: false,
  error: null,
  stats: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
  },
};

export const fetchBBSReports = createAsyncThunk(
  'bbs/fetchAll',
  async ({ companyId, ...params }: { companyId: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/bbs/${companyId}?${queryParams}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch BBS reports');
    }
  }
);

export const fetchBBSById = createAsyncThunk(
  'bbs/fetchById',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/bbs/${companyId}/${id}`);
      return response.data.report;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch BBS report');
    }
  }
);

export const createBBSReport = createAsyncThunk(
  'bbs/create',
  async ({ companyId, reportData }: { companyId: string; reportData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/bbs/${companyId}`, reportData);
      return response.data.report;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create BBS report');
    }
  }
);

export const updateBBSReport = createAsyncThunk(
  'bbs/update',
  async ({ companyId, id, data }: { companyId: string; id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/bbs/${companyId}/${id}`, data);
      return response.data.report;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update BBS report');
    }
  }
);

export const fetchBBSStats = createAsyncThunk(
  'bbs/fetchStats',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/bbs/${companyId}/stats/dashboard`);
      return response.data.stats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);

const bbsSlice = createSlice({
  name: 'bbs',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentReport: (state) => {
      state.currentReport = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch reports
      .addCase(fetchBBSReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBBSReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports = action.payload.reports;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          total: action.payload.total,
        };
      })
      .addCase(fetchBBSReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch report by ID
      .addCase(fetchBBSById.fulfilled, (state, action) => {
        state.currentReport = action.payload;
      })
      // Create report
      .addCase(createBBSReport.fulfilled, (state, action) => {
        state.reports.unshift(action.payload);
        state.currentReport = action.payload;
      })
      // Update report
      .addCase(updateBBSReport.fulfilled, (state, action) => {
        const index = state.reports.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.reports[index] = action.payload;
        }
        if (state.currentReport?._id === action.payload._id) {
          state.currentReport = action.payload;
        }
      })
      // Fetch stats
      .addCase(fetchBBSStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearError, clearCurrentReport } = bbsSlice.actions;
export default bbsSlice.reducer;