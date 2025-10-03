import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Async thunks
export const fetchObservations = createAsyncThunk(
  'observation/fetchObservations',
  async ({ companyId, auditId, status, riskLevel }: { companyId: string, auditId: string, status: string, riskLevel: string }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (riskLevel) params.append('riskLevel', riskLevel);
      
      const response = await axios.get(`${API_URL}/observations/${companyId}/audit/${auditId}?${params}`);
      return response.data.observations;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch observations');
    }
  }
);

export const createObservation = createAsyncThunk(
  'observation/createObservation',
  async ({ companyId, auditId, data }: { companyId: string, auditId: string, data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/observations/${companyId}/audit/${auditId}`, data);
      return response.data.observation;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create observation');
    }
  }
);

export const updateObservation = createAsyncThunk(
  'observation/updateObservation',
  async ({ companyId, observationId, data }: { companyId: string, observationId: string, data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/observations/${companyId}/${observationId}`, data);
      return response.data.observation;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update observation');
    }
  }
);

export const completeObservation = createAsyncThunk(
  'observation/completeObservation',
  async ({ companyId, observationId, data }: { companyId: string, observationId: string, data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/observations/${companyId}/${observationId}/complete`, data);
      return response.data.observation;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete observation');
    }
  }
);

export const approveObservation = createAsyncThunk(
  'observation/approveObservation',
  async ({ companyId, observationId, action, approvalNotes, rejectionReason }: { companyId: string, observationId: string, action: string, approvalNotes: string, rejectionReason: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/observations/${companyId}/${observationId}/approve`, {
        action,
        approvalNotes,
        rejectionReason
      });
      return response.data.observation;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || `Failed to ${action} observation`);
    }
  }
);

export const reassignObservation = createAsyncThunk(
  'observation/reassignObservation',
  async ({ companyId, observationId, responsiblePerson, dueDate, reassignmentReason }: { companyId: string, observationId: string, responsiblePerson: string, dueDate: string, reassignmentReason: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/observations/${companyId}/${observationId}/reassign`, {
        responsiblePerson,
        dueDate,
        reassignmentReason
      });
      return response.data.observation;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reassign observation');
    }
  }
);

const observationSlice = createSlice({
  name: 'observation',
  initialState: {
    observations: [],
    currentObservation: null,
    isLoading: false,
    error: null,
    stats: {
      total: 0,
      open: 0,
      inProgress: 0,
      completed: 0,
      approved: 0,
      highRisk: 0,
      overdue: 0
    }
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentObservation: (state, action) => {
      state.currentObservation = action.payload;
    },
    updateObservationStats: (state) => {
      const observations = state.observations;
      state.stats = {
        total: observations.length,
        open: observations.filter(o => o.status === 'open').length,
        inProgress: observations.filter(o => o.status === 'in_progress').length,
        completed: observations.filter(o => o.status === 'completed').length,
        approved: observations.filter(o => o.status === 'approved').length,
        highRisk: observations.filter(o => ['high', 'very_high'].includes(o.riskLevel)).length,
        overdue: observations.filter(o => 
          new Date(o.dueDate) < new Date() && !['completed', 'approved'].includes(o.status)
        ).length
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch observations
      .addCase(fetchObservations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchObservations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.observations = action.payload;
        observationSlice.caseReducers.updateObservationStats(state);
      })
      .addCase(fetchObservations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create observation
      .addCase(createObservation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createObservation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.observations.unshift(action.payload);
        observationSlice.caseReducers.updateObservationStats(state);
      })
      .addCase(createObservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update observation
      .addCase(updateObservation.fulfilled, (state, action) => {
        const index = state.observations.findIndex(o => o._id === action.payload._id);
        if (index !== -1) {
          state.observations[index] = action.payload;
        }
        observationSlice.caseReducers.updateObservationStats(state);
      })
      
      // Complete observation
      .addCase(completeObservation.fulfilled, (state, action) => {
        const index = state.observations.findIndex(o => o._id === action.payload._id);
        if (index !== -1) {
          state.observations[index] = action.payload;
        }
        observationSlice.caseReducers.updateObservationStats(state);
      })
      
      // Approve/Reject observation
      .addCase(approveObservation.fulfilled, (state, action) => {
        const index = state.observations.findIndex(o => o._id === action.payload._id);
        if (index !== -1) {
          state.observations[index] = action.payload;
        }
        observationSlice.caseReducers.updateObservationStats(state);
      })
      
      // Reassign observation
      .addCase(reassignObservation.fulfilled, (state, action) => {
        const index = state.observations.findIndex(o => o._id === action.payload._id);
        if (index !== -1) {
          state.observations[index] = action.payload;
        }
        observationSlice.caseReducers.updateObservationStats(state);
      });
  }
});

export const { clearError, setCurrentObservation } = observationSlice.actions;
export default observationSlice.reducer;