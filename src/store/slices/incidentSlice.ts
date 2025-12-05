import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/bbs/apiService';
// Define types
interface IncidentStats {
  total: number;
  open: number;
  investigating: number;
  closed: number;
  critical: number;
  overdue: number;
  safetyScore: number;
  byType: Array<{ type: string; count: number }>;
  bySeverity: Array<{ severity: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  byPlant: Array<{ plantId: string; plantName: string; total: number; critical: number; open: number }>;
  monthlyTrends: Array<{
    month: string;
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    open: number;
    investigating: number;
    closed: number;
  }>;
}

interface Incident {
  _id: string;
  incidentNumber: string;
  companyId: string;
  plantId: {
    _id: string;
    name: string;
    code: string;
    location?: string;
  };
  areaId?: {
    _id: string;
    name: string;
  };
  reportedBy: {
    _id: string;
    name: string;
    email: string;
  };
  type: string;
  severity: string;
  classification?: string;
  dateTime: string;
  location: {
    area?: string;
    specificLocation?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  description: string;
  immediateActions?: string;
  status: string;
  investigation?: {
    assignedTo?: {
      _id: string;
      name: string;
      role: string;
    };
    team?: Array<{
      _id: string;
      name: string;
      role: string;
    }>;
    timeLimit?: number;
    priority?: string;
    assignmentComments?: string;
    assignedAt?: string;
    findings?: string;
    rootCause?: {
      immediate?: string;
      underlying?: string;
      rootCause?: string;
    };
  };
  correctiveActions?: Array<{
    action: string;
    assignedTo: {
      _id: string;
      name: string;
    };
    dueDate: string;
    status: string;
    completedDate?: string;
    evidence?: string;
  }>;
  closedBy?: {
    _id: string;
    name: string;
  };
  closedAt?: string;
  closureComments?: string;
  createdAt: string;
  updatedAt: string;
}

interface IncidentState {
  incidents: Incident[];
  currentIncident: Incident | null;
  stats: IncidentStats | null;
  plants: Array<{ _id: string; name: string; code: string; location?: string }>;
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  total: number;
}

// Async thunks
export const fetchIncidents = createAsyncThunk(
  'incident/fetchIncidents',
  async (params: any, { rejectWithValue }) => {
    try {
      const { companyId, ...queryParams } = params;
      const response = await api.get(`/incidents/${companyId}`, { params: queryParams });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchIncidentById = createAsyncThunk(
  'incident/fetchIncidentById',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/incidents/${companyId}/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchIncidentStats = createAsyncThunk(
  'incident/fetchIncidentStats',
  async (params: any, { rejectWithValue }) => {
    try {
      const { companyId, ...queryParams } = params;
      const response = await api.get(`/incidents/${companyId}/stats/dashboard`, { params: queryParams });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchPlants = createAsyncThunk(
  'incident/fetchPlants',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/incidents/${companyId}/plants/list`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createIncident = createAsyncThunk(
  'incident/createIncident',
  async ({ companyId, incidentData }: { companyId: string; incidentData: any }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/incidents/${companyId}`, incidentData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateIncident = createAsyncThunk(
  'incident/updateIncident',
  async ({ companyId, id, updateData }: { companyId: string; id: string; updateData: any }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/incidents/${companyId}/${id}`, updateData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const assignIncidentInvestigation = createAsyncThunk(
  'incident/assignInvestigation',
  async ({ companyId, id, assignmentData }: { companyId: string; id: string; assignmentData: any }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/incidents/${companyId}/${id}/assign`, assignmentData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const closeIncident = createAsyncThunk(
  'incident/closeIncident',
  async ({ companyId, id, closureData }: { companyId: string; id: string; closureData: any }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/incidents/${companyId}/${id}/close`, closureData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState: IncidentState = {
  incidents: [],
  incident: null,
  stats: null,
  plants: [],
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  total: 0,
};

const incidentSlice = createSlice({
  name: 'incident',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearIncident: (state) => {
      state.currentIncident = null;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
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
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.total = action.payload.total;
      })
      .addCase(fetchIncidents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch incident by ID
      .addCase(fetchIncidentById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIncidentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentIncident = action.payload.incident;
      })
      .addCase(fetchIncidentById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch stats
      .addCase(fetchIncidentStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIncidentStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload.stats;
      })
      .addCase(fetchIncidentStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch plants
      .addCase(fetchPlants.fulfilled, (state, action) => {
        state.plants = action.payload.plants;
      })
      
      // Create incident
      .addCase(createIncident.fulfilled, (state, action) => {
        state.incidents.unshift(action.payload.incident);
        state.total += 1;
      })
      
      // Update incident
      .addCase(updateIncident.fulfilled, (state, action) => {
        const index = state.incidents.findIndex(inc => inc._id === action.payload.incident._id);
        if (index !== -1) {
          state.incidents[index] = action.payload.incident;
        }
        if (state.incident && state.incident._id === action.payload.incident._id) {
          state.incident = action.payload.incident;
        }
      })
      
      // Assign investigation
      .addCase(assignIncidentInvestigation.fulfilled, (state, action) => {
        const index = state.incidents.findIndex(inc => inc._id === action.payload.incident._id);
        if (index !== -1) {
          state.incidents[index] = action.payload.incident;
        }
        if (state.incident && state.incident._id === action.payload.incident._id) {
          state.incident = action.payload.incident;
        }
      })
      
      // Close incident
      .addCase(closeIncident.fulfilled, (state, action) => {
        const index = state.incidents.findIndex(inc => inc._id === action.payload.incident._id);
        if (index !== -1) {
          state.incidents[index] = action.payload.incident;
        }
        if (state.incident && state.incident._id === action.payload.incident._id) {
          state.incident = action.payload.incident;
        }
      });
  },
});

export const { clearError, clearIncident, setCurrentPage } = incidentSlice.actions;
export default incidentSlice.reducer;