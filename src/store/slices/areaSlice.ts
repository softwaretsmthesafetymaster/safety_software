import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.withCredentials = true;
interface Area {
  _id: string;
  name: string;
  plant: {
    _id: string;
    name: string;
    code?: string;
  };
  hod: {
    _id: string;
    name: string;
    email?: string;
  };
  safetyInCharge?: {
    _id: string;
    name: string;
    email?: string;
  };
  description?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  equipmentTypes: string[];
  commonHazards: string[];
  emergencyContacts: {
    name: string;
    role: string;
    phone: string;
  }[];
  isActive: boolean;
  stats?: any;
}

interface AreaState {
  areas: Area[];
  currentArea: Area | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

const initialState: AreaState = {
  areas: [],
  currentArea: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
  },
};

// Thunks
export const fetchAreas = createAsyncThunk(
  'area/fetchAll',
  async ({ plantId, params }: { plantId: string; params?: any }, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params || {}).toString();
      const response = await axios.get(`${API_URL}/areas/${plantId}/areas?${query}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch areas');
    }
  }
);

export const fetchAreaById = createAsyncThunk(
  'area/fetchById',
  async (areaId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/areas/${areaId}`);
      return response.data.area;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch area');
    }
  }
);

export const createArea = createAsyncThunk(
  'area/create',
  async ({ plantId, data }: { plantId: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/plants/${plantId}/areas`, data);
      return response.data.area;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create area');
    }
  }
);

export const updateArea = createAsyncThunk(
  'area/update',
  async ({ areaId, data }: { areaId: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/areas/${areaId}`, data);
      return response.data.area;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update area');
    }
  }
);

export const deleteArea = createAsyncThunk(
  'area/delete',
  async (areaId: string, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/areas/${areaId}`);
      return { ...response.data, _id: areaId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete area');
    }
  }
);

export const fetchAreaStats = createAsyncThunk(
  'area/fetchStats',
  async (areaId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/areas/${areaId}/stats`);
      return { areaId, stats: response.data.stats };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch area stats');
    }
  }
);

// Slice
const areaSlice = createSlice({
  name: 'area',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentArea: (state) => {
      state.currentArea = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch areas
      .addCase(fetchAreas.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAreas.fulfilled, (state, action) => {
        state.isLoading = false;
        state.areas = action.payload.areas;
        state.pagination = {
          currentPage: action.payload.pagination.currentPage,
          totalPages: action.payload.pagination.totalPages,
          total: action.payload.pagination.totalAreas,
        };
      })
      .addCase(fetchAreas.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch single area
      .addCase(fetchAreaById.fulfilled, (state, action) => {
        state.currentArea = action.payload;
      })
      // Create area
      .addCase(createArea.fulfilled, (state, action) => {
        state.areas.unshift(action.payload);
        state.currentArea = action.payload;
      })
      // Update area
      .addCase(updateArea.fulfilled, (state, action) => {
        const index = state.areas.findIndex(a => a._id === action.payload._id);
        if (index !== -1) state.areas[index] = action.payload;
        if (state.currentArea?._id === action.payload._id) state.currentArea = action.payload;
      })
      // Delete area
      .addCase(deleteArea.fulfilled, (state, action) => {
        state.areas = state.areas.filter(a => a._id !== action.payload._id);
        if (state.currentArea?._id === action.payload._id) state.currentArea = null;
      })
      // Fetch area stats
      .addCase(fetchAreaStats.fulfilled, (state, action) => {
        const area = state.areas.find(a => a._id === action.payload.areaId);
        if (area) area.stats = action.payload.stats;
        if (state.currentArea?._id === action.payload.areaId) {
          state.currentArea.stats = action.payload.stats;
        }
      });
  },
});

export const { clearError, clearCurrentArea } = areaSlice.actions;
export default areaSlice.reducer;
