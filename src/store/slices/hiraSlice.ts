import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Async thunks
export const fetchHIRAStats = createAsyncThunk(
  'hira/fetchStats',
  async (companyId: string) => {
    const response = await axios.get(`${API_URL}/hira/${companyId}/dashboard`);
    if (!response) throw new Error('Failed to fetch HIRA stats');
    return response.data;
  }
);

export const downloadHIRA = createAsyncThunk(
  'hira/download',
  async (params: { companyId: string; id: string; format: 'pdf' | 'excel' | 'word' }) => {
    const response = await axios.get(`${API_URL}/hira/${params.companyId}/${params.id}/download/${params.format}`, {
      responseType: 'blob',
    });
    console.log(response)
    return response.data;
  }
);

export const fetchHIRAAssessments = createAsyncThunk(
  'hira/fetchAssessments',
  async (params: { companyId: string; page?: number; status?: string; plantId?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.status) query.set('status', params.status);
    if (params.plantId) query.set('plantId', params.plantId);
    if (params.search) query.set('search', params.search);

    const response = await axios.get(`${API_URL}/hira/${params.companyId}?${query}`);
   
    if (!response) throw new Error('Failed to fetch assessments');
    return response.data;
  }
);

export const fetchHIRAById = createAsyncThunk(
  'hira/fetchById',
  async (params: { companyId: string; id: string }) => {
    const response = await axios.get(`${API_URL}/hira/${params.companyId}/${params.id}`);
    if (!response) throw new Error('Failed to fetch assessment');
    return response.data;
  }
);

export const createHIRAAssessment = createAsyncThunk(
  'hira/create',
  async (params: { companyId: string; assessmentData: any }) => {
    const response = await axios.post(`${API_URL}/hira/${params.companyId}`, params.assessmentData);
    if (!response) throw new Error('Failed to create assessment');
    return response.data;
  }
);

export const updateHIRAAssessment = createAsyncThunk(
  'hira/update',
  async (params: { companyId: string; id: string; data: any }) => {
    const response = await axios.patch(`${API_URL}/hira/${params.companyId}/${params.id}`, params.data);
    if (!response) throw new Error('Failed to update assessment');
    return response.data;
  }
);

export const assignHIRA = createAsyncThunk(
  'hira/assign',
  async (params: { companyId: string; id: string; team: string[]; comments: string }) => {
    
    const response = await axios.post(`${API_URL}/hira/${params.companyId}/${params.id}/assign`, {
      team: params.team,
      comments: params.comments
    });
    return response.data;
  }
);

export const updateHIRAWorksheet = createAsyncThunk(
  'hira/updateWorksheet',
  async (params: { companyId: string; id: string; worksheetRows: any[] }) => {
    const response = await axios.patch(`${API_URL}/hira/${params.companyId}/${params.id}/worksheet`, {
      worksheetRows: params.worksheetRows
    });
    return response.data;
  }
);

export const completeHIRAAssessment = createAsyncThunk(
  'hira/complete',
  async (params: { companyId: string; id: string; worksheetRows: any[] }) => {
    const response = await axios.post(`${API_URL}/hira/${params.companyId}/${params.id}/complete`, {
      worksheetRows: params.worksheetRows,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  }
);

export const approveHIRAAssessment = createAsyncThunk(
  'hira/approve',
  async (params: { companyId: string; id: string; action: string; comments: string }) => {
    const response = await axios.post(`${API_URL}/hira/${params.companyId}/${params.id}/approve`, {
      action: params.action,
      comments: params.comments
    });
    return response.data;
  }
);

export const closeHIRAAssessment = createAsyncThunk(
  'hira/close',
  async (params: { companyId: string; id: string; comments?: string }) => {
    const response = await axios.post(`${API_URL}/hira/${params.companyId}/${params.id}/close`, {
      comments: params.comments
    });
    return response.data;
  }
);

export const getAISuggestions = createAsyncThunk(
  'hira/aiSuggestions',
  async (params: { companyId: string; id: string; taskName: string; activityService: string; existingHazards?: string[] }) => {
    const response = await axios.post(`${API_URL}/hira/${params.companyId}/${params.id}/ai-suggestions`, {
      taskName: params.taskName,
      activityService: params.activityService,
      existingHazards: params.existingHazards
    });
    return response.data;
  }
);

export const updateHIRAActions = createAsyncThunk(
  'hira/updateActions',
  async (params: { companyId: string; id: string; worksheetRows: any[] }) => {
    const response = await axios.patch(`${API_URL}/hira/${params.companyId}/${params.id}/worksheet`, {
      worksheetRows: params.worksheetRows
    });
    return response.data;
  }
);

interface HIRAState {
  assessments: any[];
  currentAssessment: any;
  stats: any;
  isLoading: boolean;
  error: string | null;
  pagination: any;
}

const initialState: HIRAState = {
  assessments: [],
  currentAssessment: null,
  stats: null,
  isLoading: false,
  error: null,
  pagination: null
};

const hiraSlice = createSlice({
  name: 'hira',
  initialState,
  reducers: {
    clearCurrentAssessment: (state) => {
      state.currentAssessment = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch stats
      .addCase(fetchHIRAStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchHIRAStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload.stats;
      })
      .addCase(fetchHIRAStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch stats';
      })
      
      // Fetch assessments
      .addCase(fetchHIRAAssessments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchHIRAAssessments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assessments = action.payload.assessments;
        state.pagination = {
          totalPages: action.payload.totalPages,
          currentPage: action.payload.currentPage,
          total: action.payload.total
        };
      })
      .addCase(fetchHIRAAssessments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch assessments';
      })
      
      // Fetch by ID
      .addCase(fetchHIRAById.fulfilled, (state, action) => {
        state.currentAssessment = action.payload.assessment;
        state.isLoading = false;
      })
      
      // Create assessment
      .addCase(createHIRAAssessment.fulfilled, (state, action) => {
        state.assessments.unshift(action.payload.assessment);
        state.isLoading = false;
      })
      
      // Update assessment
      .addCase(updateHIRAAssessment.fulfilled, (state, action) => {
        const index = state.assessments.findIndex(a => a._id === action.payload.assessment._id);
        if (index !== -1) {
          state.assessments[index] = action.payload.assessment;
        }
        state.currentAssessment = action.payload.assessment;
        state.isLoading = false;
      })
      
      // Assign assessment
      .addCase(assignHIRA.fulfilled, (state, action) => {
        state.currentAssessment = action.payload.assessment;
        state.isLoading = false;
      })
      
      // Complete assessment
      .addCase(completeHIRAAssessment.fulfilled, (state, action) => {
        state.currentAssessment = action.payload.assessment;
        state.isLoading = false;
      })
      
      // Approve assessment
      .addCase(approveHIRAAssessment.fulfilled, (state, action) => {
        state.currentAssessment = action.payload.assessment;
        state.isLoading = false;
      })
      
      // Close assessment
      .addCase(closeHIRAAssessment.fulfilled, (state, action) => {
        state.currentAssessment = action.payload.assessment;
        state.isLoading = false;
      });
  }
});

export const { clearCurrentAssessment, clearError } = hiraSlice.actions;
export default hiraSlice.reducer;