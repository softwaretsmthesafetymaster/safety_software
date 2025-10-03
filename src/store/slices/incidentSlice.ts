import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Incident {
  _id: string;
  incidentNumber: string;
  type: string;
  severity: string;
  description: string;
  status: string;
  dateTime: string;
  reportedBy: {
    name: string;
    email: string;
  };
  plantId: {
    name: string;
    code: string;
  };
  createdAt: string;
}

interface IncidentState {
  incidents: Incident[];
  currentIncident: Incident | null;
  isLoading: boolean;
  error: string | null;
  stats: any;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

const initialState: IncidentState = {
  incidents: [],
  currentIncident: null,
  isLoading: false,
  error: null,
  stats: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
  },
};

export const fetchIncidents = createAsyncThunk(
  'incident/fetchAll',
  async ({ companyId, ...params }: { companyId: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/incidents/${companyId}?${queryParams}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch incidents');
    }
  }
);

export const fetchIncidentById = createAsyncThunk(
  'incident/fetchById',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/incidents/${companyId}/${id}`);
      return response.data.incident;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch incident');
    }
  }
);

export const createIncident = createAsyncThunk(
  'incident/create',
  async ({ companyId, incidentData }: { companyId: string; incidentData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/incidents/${companyId}`, incidentData,);
      return response.data.incident;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create incident');
    }
  }
);

export const updateIncident = createAsyncThunk(
  'incident/update',
  async ({ companyId, id, data }: { companyId: string; id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/incidents/${companyId}/${id}`, data);
      return response.data.incident;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update incident');
    }
  }
);

export const fetchIncidentStats = createAsyncThunk(
  'incident/fetchStats',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/incidents/${companyId}/stats/dashboard`);
      return response.data.stats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);

export const assignIncidentInvestigation = createAsyncThunk(
  'incident/assign',
  async ({ companyId, id, assignmentData }: { companyId: string; id: string; assignmentData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/incidents/${companyId}/${id}/assign`, assignmentData);
      return response.data.incident;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign investigation');
    }
  }
);

export const closeIncident = createAsyncThunk(
  'incident/close',
  async ({ companyId, id, closureData }: { companyId: string; id: string; closureData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/incidents/${companyId}/${id}/close`, closureData);
      return response.data.incident;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to close incident');
    }
  }
);
const incidentSlice = createSlice({
  name: 'incident',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentIncident: (state) => {
      state.currentIncident = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch incidents
      .addCase(fetchIncidents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIncidents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.incidents = action.payload.incidents;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          total: action.payload.total,
        };
      })
      .addCase(fetchIncidents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch incident by ID
      .addCase(fetchIncidentById.fulfilled, (state, action) => {
        state.currentIncident = action.payload;
      })
      // Create incident
      .addCase(createIncident.fulfilled, (state, action) => {
        state.incidents.unshift(action.payload);
        state.currentIncident = action.payload;
      })
      // Update incident
      .addCase(updateIncident.fulfilled, (state, action) => {
        const index = state.incidents.findIndex(i => i._id === action.payload._id);
        if (index !== -1) {
          state.incidents[index] = action.payload;
        }
        if (state.currentIncident?._id === action.payload._id) {
          state.currentIncident = action.payload;
        }
      })
      // Assign investigation
      .addCase(assignIncidentInvestigation.fulfilled, (state, action) => {
        const index = state.incidents.findIndex(i => i._id === action.payload._id);
        if (index !== -1) {
          state.incidents[index] = action.payload;
        }
        if (state.currentIncident?._id === action.payload._id) {
          state.currentIncident = action.payload;
        }
      })
      // Close incident
      .addCase(closeIncident.fulfilled, (state, action) => {
        const index = state.incidents.findIndex(i => i._id === action.payload._id);
        if (index !== -1) {
          state.incidents[index] = action.payload;
        }
        if (state.currentIncident?._id === action.payload._id) {
          state.currentIncident = action.payload;
        }
      })
      // Fetch stats
      .addCase(fetchIncidentStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearError, clearCurrentIncident } = incidentSlice.actions;
export default incidentSlice.reducer;