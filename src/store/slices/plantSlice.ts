import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Plant {
  _id: string;
  name: string;
  code: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  areas: Array<{
    _id: string;
    name: string;
    code: string;
    description: string;
    hazardLevel: string;
  }>;
  isActive: boolean;
  createdAt: string;
}

interface PlantState {
  plants: Plant[];
  currentPlant: Plant | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

const initialState: PlantState = {
  plants: [],
  currentPlant: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
  },
};

export const fetchPlants = createAsyncThunk(
  'plant/fetchAll',
  async ({ companyId, ...params }: { companyId: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/plants/${companyId}?${queryParams}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plants');
    }
  }
);

export const fetchPlantById = createAsyncThunk(
  'plant/fetchById',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/plants/${companyId}/${id}`);
      return response.data.plant;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plant');
    }
  }
);

export const createPlant = createAsyncThunk(
  'plant/create',
  async ({ companyId, plantData }: { companyId: string; plantData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/plants/${companyId}`, plantData);
      return response.data.plant;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create plant');
    }
  }
);

export const updatePlant = createAsyncThunk(
  'plant/update',
  async ({ companyId, id, data }: { companyId: string; id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/plants/${companyId}/${id}`, data);
      return response.data.plant;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update plant');
    }
  }
);

export const deletePlant = createAsyncThunk(
  'plant/delete',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/plants/${companyId}/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete plant');
    }
  }
);

export const addArea = createAsyncThunk(
  'plant/addArea',
  async ({ companyId, plantId, areaData }: { companyId: string; plantId: string; areaData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/plants/${companyId}/${plantId}/areas`, areaData);
      return response.data.plant;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add area');
    }
  }
);

export const updateArea = createAsyncThunk(
  'plant/updateArea',
  async ({ companyId, plantId, areaId, data }: { companyId: string; plantId: string; areaId: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/plants/${companyId}/${plantId}/areas/${areaId}`, data);
      return response.data.plant;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update area');
    }
  }
);

export const deleteArea = createAsyncThunk(
  'plant/deleteArea',
  async ({ companyId, plantId, areaId }: { companyId: string; plantId: string; areaId: string }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/plants/${companyId}/${plantId}/areas/${areaId}`);
      return response.data.plant;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete area');
    }
  }
);

const plantSlice = createSlice({
  name: 'plant',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPlant: (state) => {
      state.currentPlant = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch plants
      .addCase(fetchPlants.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plants = action.payload.plants;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          total: action.payload.total,
        };
      })
      .addCase(fetchPlants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch plant by ID
      .addCase(fetchPlantById.fulfilled, (state, action) => {
        state.currentPlant = action.payload;
      })
      // Create plant
      .addCase(createPlant.fulfilled, (state, action) => {
        state.plants.unshift(action.payload);
        state.currentPlant = action.payload;
      })
      // Update plant
      .addCase(updatePlant.fulfilled, (state, action) => {
        const index = state.plants.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.plants[index] = action.payload;
        }
        if (state.currentPlant?._id === action.payload._id) {
          state.currentPlant = action.payload;
        }
      })
      // Delete plant
      .addCase(deletePlant.fulfilled, (state, action) => {
        state.plants = state.plants.filter(p => p._id !== action.payload);
        if (state.currentPlant?._id === action.payload) {
          state.currentPlant = null;
        }
      })
      // Add area
      .addCase(addArea.fulfilled, (state, action) => {
        const index = state.plants.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.plants[index] = action.payload;
        }
        if (state.currentPlant?._id === action.payload._id) {
          state.currentPlant = action.payload;
        }
      })
      // Update area
      .addCase(updateArea.fulfilled, (state, action) => {
        const index = state.plants.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.plants[index] = action.payload;
        }
        if (state.currentPlant?._id === action.payload._id) {
          state.currentPlant = action.payload;
        }
      })
      // Delete area
      .addCase(deleteArea.fulfilled, (state, action) => {
        const index = state.plants.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.plants[index] = action.payload;
        }
        if (state.currentPlant?._id === action.payload._id) {
          state.currentPlant = action.payload;
        }
      });
  },
});

export const { clearError, clearCurrentPlant } = plantSlice.actions;
export default plantSlice.reducer;