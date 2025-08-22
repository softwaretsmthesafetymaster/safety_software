import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface HAZOPStudy {
  _id: string;
  studyNumber: string;
  title: string;
  description: string;
  methodology: string;
  status: string;
  facilitator: {
    name: string;
    email: string;
  };
  plantId: {
    name: string;
    code: string;
  };
  createdAt: string;
}

interface HAZOPState {
  studies: HAZOPStudy[];
  currentStudy: HAZOPStudy | null;
  isLoading: boolean;
  error: string | null;
  stats: any;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

const initialState: HAZOPState = {
  studies: [

  ],
  currentStudy: null,
  isLoading: false,
  error: null,
  stats: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
  },
};

export const fetchHAZOPStudies = createAsyncThunk(
  'hazop/fetchAll',
  async ({ companyId, ...params }: { companyId: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/hazop/${companyId}?${queryParams}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch HAZOP studies');
    }
  }
);

export const fetchHAZOPById = createAsyncThunk(
  'hazop/fetchById',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hazop/${companyId}/${id}`);
      return response.data.study;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch HAZOP study');
    }
  }
);

export const createHAZOPStudy = createAsyncThunk(
  'hazop/create',
  async ({ companyId, studyData }: { companyId: string; studyData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hazop/${companyId}`, studyData);
      return response.data.study;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create HAZOP study');
    }
  }
);

export const updateHAZOPStudy = createAsyncThunk(
  'hazop/update',
  async ({ companyId, id, data }: { companyId: string; id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/hazop/${companyId}/${id}`, data);
      return response.data.study;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update HAZOP study');
    }
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

export const getAISuggestions = createAsyncThunk(
  'hazop/aiSuggestions',
  async ({ companyId, id, data }: { companyId: string; id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hazop/${companyId}/${id}/ai-suggestions`, data);
      return response.data.suggestions;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get AI suggestions');
    }
  }
);

export const addNodeToHAZOP = createAsyncThunk(
  'hazop/addNode',
  async ({ companyId, id, nodeData }: { companyId: string; id: string; nodeData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/hazop/${companyId}/${id}/nodes`, nodeData);
      return response.data.node;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add node to HAZOP study');
    }
  } 
);

const hazopSlice = createSlice({
  name: 'hazop',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentStudy: (state) => {
      state.currentStudy = null;
    },
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
          total: action.payload.total,
        };
      })
      .addCase(fetchHAZOPStudies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch study by ID
      .addCase(fetchHAZOPById.fulfilled, (state, action) => {
        state.currentStudy = action.payload;
      })
      // Create study
      .addCase(createHAZOPStudy.fulfilled, (state, action) => {
        state.studies.unshift(action.payload);
        state.currentStudy = action.payload;
      })
      // Update study
      .addCase(updateHAZOPStudy.fulfilled, (state, action) => {
        const index = state.studies.findIndex(s => s._id === action.payload._id);
        if (index !== -1) {
          state.studies[index] = action.payload;
        }
        if (state.currentStudy?._id === action.payload._id) {
          state.currentStudy = action.payload;
        }
      })
      // Add node to study
      .addCase(addNodeToHAZOP.fulfilled, (state, action) =>{
        if (state.currentStudy) {
          state.currentStudy.nodes.push(action.payload);
        }
  })
      // Get AI suggestions
      .addCase(getAISuggestions.fulfilled, (state, action) => {
        if (state.currentStudy) {
          state.currentStudy.aiSuggestions = action.payload;
        }
      })
      // Fetch stats
      .addCase(fetchHAZOPStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearError, clearCurrentStudy } = hazopSlice.actions;
export default hazopSlice.reducer;