import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface HAZOPState {
  studies: any[];
  currentStudy: any | null;
  isLoading: boolean;
  error: string | null;
  aiSuggestions: any | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

const initialState: HAZOPState = {
  studies: [],
  currentStudy: null,
  isLoading: false,
  error: null,
  aiSuggestions: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0
  }
};

// Fetch all HAZOP studies
export const fetchHAZOPStudies = createAsyncThunk(
  'hazop/fetchStudies',
  async ({ companyId, params }: { companyId: string; params?: any }) => {
    const response = await axios.get(`${API_URL}/hazop/${companyId}`, { params });
    return response.data;
  }
);

// Fetch HAZOP by ID
export const fetchHAZOPById = createAsyncThunk(
  'hazop/fetchById',
  async ({ companyId, id }: { companyId: string; id: string }) => {
    const response = await axios.get(`${API_URL}/hazop/${companyId}/${id}`);
    return response.data.study;
  }
);

// Create HAZOP study
export const createHAZOPStudy = createAsyncThunk(
  'hazop/create',
  async ({ companyId, studyData }: { companyId: string; studyData: any }) => {
    const response = await axios.post(`${API_URL}/hazop/${companyId}`, studyData);
    
    // Send notifications to team members
    await axios.post(`${API_URL}/notifications/send-team-notification`, {
      companyId,
      studyId: response.data.study._id,
      type: 'success',
      recipients: [
        studyData.chairman,
        studyData.scribe,
        ...studyData.team.map((t: any) => t.member)
      ]
    });

    return response.data.study;
  }
);

// Update HAZOP study
export const updateHAZOPStudy = createAsyncThunk(
  'hazop/update',
  async ({ companyId, id, data }: { companyId: string; id: string; data: any }) => {
    const response = await axios.patch(`${API_URL}/hazop/${companyId}/${id}`, data);
    return response.data.study;
  }
);

// Start HAZOP study
export const startHAZOPStudy = createAsyncThunk(
  'hazop/start',
  async ({ companyId, id }: { companyId: string; id: string }) => {
    const response = await axios.post(`${API_URL}/hazop/${companyId}/${id}/start`);
    
    // Send notification to team
    await axios.post(`${API_URL}/notifications/send-team-notification`, {
      companyId,
      studyId: id,
      type: 'success'
    });

    return response.data.study;
  }
);

// Complete HAZOP study
export const completeHAZOPStudy = createAsyncThunk(
  'hazop/complete',
  async ({ companyId, id }: { companyId: string; id: string }) => {
    const response = await axios.post(`${API_URL}/hazop/${companyId}/${id}/complete`);
    
    // Send notification to chairman for closure
    await axios.post(`${API_URL}/notifications/send-team-notification`, {
      companyId,
      studyId: id,
      type: 'success',
      
    });

    return response.data.study;
  }
);

// Close HAZOP study
export const closeHAZOPStudy = createAsyncThunk(
  'hazop/close',
  async ({ companyId, studyId, closureData }: { companyId: string; studyId: string; closureData: any }) => {
    const response = await axios.post(`${API_URL}/hazop/${companyId}/${studyId}/close`, closureData);


    return response.data.study;
  }
);

// Create node
export const createHAZOPNode = createAsyncThunk(
  'hazop/createNode',
  async ({ companyId, studyId, nodeData }: { companyId: string; studyId: string; nodeData: any }) => {
    const response = await axios.post(`${API_URL}/hazop/${companyId}/${studyId}/nodes`, nodeData);
    return response.data.study;
  }
);

// Create/Update worksheet
export const createWorksheet = createAsyncThunk(
  'hazop/createWorksheet',
  async ({ companyId, studyId, nodeNumber, worksheets }: { 
    companyId: string; 
    studyId: string; 
    nodeNumber: string; 
    worksheets: any[] 
  }) => {
    const response = await axios.post(`${API_URL}/hazop/${companyId}/${studyId}/nodes/${nodeNumber}/worksheet`, {
      nodeNumber,
      worksheets
    });
    
    // Check if all worksheets are complete and notify
    const hasHighRisk = worksheets.some(w => ['high', 'very_high'].includes(w.risk));
    if (hasHighRisk) {
      await axios.post(`${API_URL}/notifications/send-team-notification`, {
        companyId,
        studyId,
        type: 'warning',
        nodeNumber
      });
    }

    return response.data.study;
  }
);

// Update worksheet
export const updateWorksheet = createAsyncThunk(
  'hazop/updateWorksheet',
  async ({ companyId, studyId, nodeNumber, worksheetId, worksheetData }: { 
    companyId: string; 
    studyId: string; 
    nodeNumber: string;
    worksheetId: string;
    worksheetData: any 
  }) => {
    const response = await axios.patch(`${API_URL}/hazop/${companyId}/${studyId}/worksheet/${worksheetId}`, worksheetData);
    return response.data.study;
  }
);

// Mark worksheet as complete
export const markWorksheetComplete = createAsyncThunk(
  'hazop/markComplete',
  async ({ companyId, studyId, nodeNumber, userId }: { 
    companyId: string; 
    studyId: string; 
    nodeNumber: string;
    userId: string;
  }) => {
    const response = await axios.post(`${API_URL}/hazop/${companyId}/${studyId}/mark-complete`, {
      nodeNumber,
      userId
    });

    // Check if all members have marked complete
    if (response.data.allComplete) {
      await axios.post(`${API_URL}/notifications/send-team-notification`, {
        companyId,
        studyId,
        type: 'success',
        nodeNumber
      });
    }

    return response.data.study;
  }
);

// Get AI suggestions
export const getAISuggestions = createAsyncThunk(
  'hazop/getAISuggestions',
  async ({ companyId, studyId, parameter, guideWord, process }: {
    companyId: string;
    studyId: string;
    parameter: string;
    guideWord: string;
    process: string;
  }) => {
    const response = await axios.post(`${API_URL}/hazop/${companyId}/${studyId}/ai-suggestions`, {
      parameter,
      guideWord,
      process
    });
    return response.data.suggestions;
  }
);

// Export HAZOP study
export const exportHAZOPStudy = createAsyncThunk(
  'hazop/export',
  async ({ companyId, studyId, format }: { companyId: string; studyId: string; format: string }) => {
    const response = await axios.get(`${API_URL}/hazop/${companyId}/${studyId}/export/${format}`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `HAZOP_Study_${studyId}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  }
);

export const fetchHAZOPStats = createAsyncThunk(
  'hazop/fetchStats',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hazop/${companyId}/stats/dashboard`);
      return response.data.stats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);  

const hazopSlice = createSlice({
  name: 'hazop',
  initialState,
  reducers: {
    clearCurrentStudy: (state) => {
      state.currentStudy = null;
    },
    clearAISuggestions: (state) => {
      state.aiSuggestions = null;
    },
    updateStudyStatus: (state, action) => {
      if (state.currentStudy) {
        state.currentStudy.status = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch studies
      .addCase(fetchHAZOPStudies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHAZOPStudies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.studies = action.payload.studies;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          total: action.payload.total
        };
      })
      .addCase(fetchHAZOPStudies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch studies';
      })
      
      // Fetch by ID
      .addCase(fetchHAZOPById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHAZOPById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentStudy = action.payload;
      })
      .addCase(fetchHAZOPById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch study';
      })

      // Create study
      .addCase(createHAZOPStudy.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createHAZOPStudy.fulfilled, (state, action) => {
        state.isLoading = false;
        state.studies.unshift(action.payload);
      })
      .addCase(createHAZOPStudy.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create study';
      })

      // AI Suggestions
      .addCase(getAISuggestions.fulfilled, (state, action) => {
        state.aiSuggestions = action.payload;
      })
      //fetch stats
      .addCase(fetchHAZOPStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // Generic fulfilled cases for updates
      .addMatcher(
        (action) => action.type.endsWith('/fulfilled') && action.type.includes('hazop/'),
        (state, action) => {
          if (action.payload && typeof action.payload === 'object' && action.payload._id) {
            state.currentStudy = action.payload;
          }
        }
      );
  }
});

export const { clearCurrentStudy, clearAISuggestions, updateStudyStatus } = hazopSlice.actions;
export default hazopSlice.reducer;