import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.withCredentials = true;
interface HIRAState {
  assessments: any[];
  currentAssessment: any | null;
  stats: any | null;
  isLoading: boolean;
  error: string | null;
  pagination: any | null;
}

const initialState: HIRAState = {
  assessments: [],
  currentAssessment: null,
  stats: null,
  isLoading: false,
  error: null,
  pagination: null,
};

// Async thunks
export const fetchHIRAAssessments = createAsyncThunk(
  'hira/fetchAssessments',
  async (params: any, { rejectWithValue }) => {
    try {
      const { companyId, ...queryParams } = params;
      const queryString = new URLSearchParams(queryParams).toString();
      const response = await axios.get(`${API_URL}/hira/${companyId}?${queryString}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assessments');
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
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assessment');
    }
  }
);

export const createHIRAAssessment = createAsyncThunk(
  'hira/create',
  async ({ companyId, assessmentData }: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hira/${companyId}`, assessmentData);
      toast.success('HIRA assessment created successfully');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create assessment');
      return rejectWithValue(error.response?.data?.message || 'Failed to create assessment');
    }
  }
);

export const updateHIRAAssessment = createAsyncThunk(
  'hira/update',
  async ({ companyId, id, data }: any, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/hira/${companyId}/${id}`, data);
      toast.success('Assessment updated successfully');
      return response.data.assessment;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update assessment');
      return rejectWithValue(error.response?.data?.message || 'Failed to update assessment');
    }
  }
);

export const assignHIRA = createAsyncThunk(
  'hira/assign',
  async ({ companyId, id, team,dueDate, priority, comments }: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hira/${companyId}/${id}/assign`, {
        team,
        dueDate,
        priority,
        comments
      });
      toast.success('Assessment assigned successfully');
      return response.data.assessment;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign assessment');
      return rejectWithValue(error.response?.data?.message || 'Failed to assign assessment');
    }
  }
);

export const updateHIRAWorksheet = createAsyncThunk(
  'hira/updateWorksheet',
  async ({ companyId, id, worksheetRows }: any, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/hira/${companyId}/${id}/worksheet`, {
        worksheetRows
      });
      toast.success('Worksheet updated successfully');
      return response.data.assessment;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update worksheet');
      return rejectWithValue(error.response?.data?.message || 'Failed to update worksheet');
    }
  }
);

export const completeHIRAAssessment = createAsyncThunk(
  'hira/complete',
  async ({ companyId, id, worksheetRows }: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hira/${companyId}/${id}/complete`, {
        worksheetRows
      });
      toast.success('Assessment completed successfully');
      return response.data.assessment;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete assessment');
      return rejectWithValue(error.response?.data?.message || 'Failed to complete assessment');
    }
  }
);

export const approveHIRAAssessment = createAsyncThunk(
  'hira/approve',
  async ({ companyId, id, action, comments }: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hira/${companyId}/${id}/approve`, {
        action,
        comments
      });
      toast.success(`Assessment ${action}d successfully`);
      return response.data.assessment;
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} assessment`);
      return rejectWithValue(error.response?.data?.message || `Failed to ${action} assessment`);
    }
  }
);

export const assignActions = createAsyncThunk(
  'hira/assignActions',
  async ({ companyId, id, worksheetRows }: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hira/${companyId}/${id}/assign-actions`, {
        worksheetRows
      });
      toast.success('Actions assigned successfully');
      return response.data.assessment;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign actions');
      return rejectWithValue(error.response?.data?.message || 'Failed to assign actions');
    }
  }
);

export const updateHIRAActions = createAsyncThunk(
  'hira/updateAction',
  async ({ companyId, id, actionIndex, data }: any, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/hira/${companyId}/${id}/actions/${actionIndex}`, data);
      toast.success('Action updated successfully');
      return response.data.assessment;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update action');
      return rejectWithValue(error.response?.data?.message || 'Failed to update action');
    }
  }
);

export const completeAllActions = createAsyncThunk(
  'hira/completeAllActions',
  async ({ companyId, id }: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hira/${companyId}/${id}/complete-actions`);
      toast.success('All actions completed successfully');
      return response.data.assessment;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete all actions');
      return rejectWithValue(error.response?.data?.message || 'Failed to complete all actions');
    }
  }
);

export const closeHIRAAssessment = createAsyncThunk(
  'hira/close',
  async ({ companyId, id, comments }: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hira/${companyId}/${id}/close`, {
        comments
      });
      toast.success('Assessment closed successfully');
      return response.data.assessment;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to close assessment');
      return rejectWithValue(error.response?.data?.message || 'Failed to close assessment');
    }
  }
);

export const getAISuggestions = createAsyncThunk(
  'hira/getAISuggestions',
  async ({ companyId, id, taskName, activityService, existingHazards }: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hira/${companyId}/${id}/ai-suggestions`, {
        taskName,
        activityService,
        existingHazards
      });
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to get AI suggestions');
      return rejectWithValue(error.response?.data?.message || 'Failed to get AI suggestions');
    }
  }
);

export const fetchHIRAStats = createAsyncThunk(
  'hira/fetchStats',
  async ({ companyId, period, plantId }: { companyId: string, period: string, plantId: string }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (period) {
        params.append('period', period);
      }

      if (plantId) {
         params.append('plantId', plantId);
      }
      const response = await axios.get(
        `${API_URL}/hira/${companyId}/dashboard?${params.toString()}`
      );
      return response.data.stats;  
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

export const downloadHIRA = createAsyncThunk(
  'hira/download',
  async ({ companyId, id, format }: any, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hira/${companyId}/${id}/download/${format}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HIRA-assessment.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started');
      return response.data;
    } catch (error: any) {
      toast.error('Failed to download assessment');
      return rejectWithValue('Failed to download assessment');
    }
  }
);

// Slice
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

      // Fetch by ID
      .addCase(fetchHIRAById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchHIRAById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAssessment = action.payload;
      })
      .addCase(fetchHIRAById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create assessment
      .addCase(createHIRAAssessment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createHIRAAssessment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assessments.unshift(action.payload.assessment);
      })
      .addCase(createHIRAAssessment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update assessment
      .addCase(updateHIRAAssessment.fulfilled, (state, action) => {
        state.currentAssessment = action.payload;
        const index = state.assessments.findIndex(a => a._id === action.payload._id);
        if (index !== -1) {
          state.assessments[index] = action.payload;
        }
      })

      // Assign
      .addCase(assignHIRA.fulfilled, (state, action) => {
        state.currentAssessment = action.payload;
      })

      // Update worksheet
      .addCase(updateHIRAWorksheet.fulfilled, (state, action) => {
        state.currentAssessment = action.payload;
      })

      // Complete assessment
      .addCase(completeHIRAAssessment.fulfilled, (state, action) => {
        state.currentAssessment = action.payload;
      })

      // Approve/reject
      .addCase(approveHIRAAssessment.fulfilled, (state, action) => {
        state.currentAssessment = action.payload;
      })

      // Assign actions
      .addCase(assignActions.fulfilled, (state, action) => {
        state.currentAssessment = action.payload;
      })

      // Update action
      .addCase(updateHIRAActions.fulfilled, (state, action) => {
        state.currentAssessment = action.payload;
      })

      // Complete all actions
      .addCase(completeAllActions.fulfilled, (state, action) => {
        state.currentAssessment = action.payload;
      })

      // Close
      .addCase(closeHIRAAssessment.fulfilled, (state, action) => {
        state.currentAssessment = action.payload;
      })

      // Fetch stats
      .addCase(fetchHIRAStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchHIRAStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchHIRAStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentAssessment } = hiraSlice.actions;
export default hiraSlice.reducer;