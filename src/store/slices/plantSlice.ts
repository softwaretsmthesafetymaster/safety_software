import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.withCredentials = true;
// Interfaces for data types
interface User {
  _id: string;
  name: string;
  email: string;
}

interface Area {
  _id: string;
  name: string;
  code: string;
  description: string;
  hod: User;
  safetyIncharge: User;
  createdAt: string;
  updatedAt: string;
}

interface Plant {
  _id: string;
  name: string;
  code: string;
  companyId: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PlantState {
  plants: Plant[];
  currentPlant: Plant | null;
  areas: Area[]; // New state for managing areas separately
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
  areas: [], // Initialize the new state
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
  },
};

// ** Async Thunks for Plant Management **

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

// ** Async Thunks for Area Management (Updated for separate state) **

export const addArea = createAsyncThunk(
  'plant/addArea',
  async ({ companyId, plantId, areaData }: { companyId: string; plantId: string; areaData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/plants/${companyId}/${plantId}/areas`, areaData);
      return response.data.area; // Assuming API returns the newly created area
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add area');
    }
  }
);

export const getArea = createAsyncThunk(
  'plant/getArea',
  async ({ companyId, plantId }: { companyId: string; plantId: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/plants/${companyId}/${plantId}/areas`);
      return response.data.areas; // API returns an array of areas
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch areas');
    }
  }
);

export const updateArea = createAsyncThunk(
  'plant/updateArea',
  async ({ companyId, plantId, areaId, data }: { companyId: string; plantId: string; areaId: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/plants/${companyId}/${plantId}/areas/${areaId}`, data);
      return response.data.area; // Assuming API returns the updated area
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update area');
    }
  }
);

export const deleteArea = createAsyncThunk(
  'plant/deleteArea',
  async ({ companyId, plantId, areaId }: { companyId: string; plantId: string; areaId: string }, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/plants/${companyId}/${plantId}/areas/${areaId}`);
      return areaId; // Return the ID of the deleted area
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete area');
    }
  }
);

// ** Redux Slice **

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
      // Fetch Plants
      .addCase(fetchPlants.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plants = action.payload.plants;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPlants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Plant By ID
      .addCase(fetchPlantById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlantById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPlant = action.payload;
        // The API response for a single plant does not include areas, so we clear the areas state
        state.areas = [];
      })
      .addCase(fetchPlantById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create Plant
      .addCase(createPlant.fulfilled, (state, action) => {
        state.plants.unshift(action.payload);
        state.currentPlant = action.payload;
      })
      
      // Update Plant
      .addCase(updatePlant.fulfilled, (state, action) => {
        const index = state.plants.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.plants[index] = action.payload;
        }
        if (state.currentPlant?._id === action.payload._id) {
          state.currentPlant = action.payload;
        }
      })
      
      // Delete Plant
      .addCase(deletePlant.fulfilled, (state, action) => {
        state.plants = state.plants.filter(p => p._id !== action.payload);
        if (state.currentPlant?._id === action.payload) {
          state.currentPlant = null;
        }
      })

      // ** Area Management Reducers **

      // Get Areas (Populates the `areas` state)
      .addCase(getArea.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getArea.fulfilled, (state, action: PayloadAction<Area[]>) => {
        state.isLoading = false;
        state.areas = action.payload;
      })
      .addCase(getArea.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Add Area (Adds a new area to the `areas` state)
      .addCase(addArea.fulfilled, (state, action: PayloadAction<Area>) => {
        state.areas.push(action.payload);
      })

      // Update Area (Updates an existing area in the `areas` state)
      .addCase(updateArea.fulfilled, (state, action: PayloadAction<Area>) => {
        const index = state.areas.findIndex(area => area._id === action.payload._id);
        if (index !== -1) {
          state.areas[index] = action.payload;
        }
      })
      
      // Delete Area (Removes the area from the `areas` state)
      .addCase(deleteArea.fulfilled, (state, action: PayloadAction<string>) => {
        state.areas = state.areas.filter(area => area._id !== action.payload);
      });
  },
});

export const { clearError, clearCurrentPlant } = plantSlice.actions;
export default plantSlice.reducer;