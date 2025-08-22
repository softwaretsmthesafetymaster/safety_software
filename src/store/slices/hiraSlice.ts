import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface HIRAAssessment {
  _id: string;
  assessmentNumber: string;
  title: string;
  area: string;
  process: string;
  status: string;
  assessor: {
    name: string;
    email: string;
  };
  plantId: {
    name: string;
    code: string;
  };
  assessmentDate: string;
  createdAt: string;
}

interface HIRAState {
  assessments: HIRAAssessment[];
  currentAssessment: HIRAAssessment | null;
  isLoading: boolean;
  error: string | null;
  stats: any;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

const initialState: HIRAState = {
  assessments: [],
  currentAssessment: null,
  isLoading: false,
  error: null,
  stats: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
  },
};

export const fetchHIRAAssessments = createAsyncThunk(
  'hira/fetchAll',
  async ({ companyId, ...params }: { companyId: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/hira/${companyId}?${queryParams}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch HIRA assessments');
    }
  }
);

export const fetchHIRAById = createAsyncThunk(
  'hira/fetchById',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hira/${companyId}/${id}`);
      return response.data.assessment;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch HIRA assessment');
    }
  }
);

export const createHIRAAssessment = createAsyncThunk(
  'hira/create',
  async ({ companyId, assessmentData }: { companyId: string; assessmentData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hira/${companyId}`, assessmentData);
      return response.data.assessment;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create HIRA assessment');
    }
  }
);

export const updateHIRAAssessment = createAsyncThunk(
  'hira/update',
  async ({ companyId, id, data }: { companyId: string; id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/hira/${companyId}/${id}`, data);
      return response.data.assessment;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update HIRA assessment');
    }
  }
);

export const fetchHIRAStats = createAsyncThunk(
  'hira/fetchStats',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hira/${companyId}/stats/dashboard`);
      return response.data.stats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);

const hiraSlice = createSlice({
  name: 'hira',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAssessment: (state) => {
      state.currentAssessment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch assessments
      .addCase(fetchHIRAAssessments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHIRAAssessments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assessments = action.payload.assessments;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          total: action.payload.total,
        };
      })
      .addCase(fetchHIRAAssessments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch assessment by ID
      .addCase(fetchHIRAById.fulfilled, (state, action) => {
        state.currentAssessment = action.payload;
      })
      // Create assessment
      .addCase(createHIRAAssessment.fulfilled, (state, action) => {
        state.assessments.unshift(action.payload);
        state.currentAssessment = action.payload;
      })
      // Update assessment
      .addCase(updateHIRAAssessment.fulfilled, (state, action) => {
        const index = state.assessments.findIndex(a => a._id === action.payload._id);
        if (index !== -1) {
          state.assessments[index] = action.payload;
        }
        if (state.currentAssessment?._id === action.payload._id) {
          state.currentAssessment = action.payload;
        }
      })
      // Fetch stats
      .addCase(fetchHIRAStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearError, clearCurrentAssessment } = hiraSlice.actions;
export default hiraSlice.reducer;