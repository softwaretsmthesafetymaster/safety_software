import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.withCredentials = true;
interface Company {
  _id: string;
  name: string;
  logo?: string;
  industry: string;
  subscription: {
    plan: string;
    status: string;
    expiryDate?: string;
  };
  config: any;
  isActive: boolean;
  createdAt: string;
}

interface CompanyState {
  companies: Company[];
  currentCompany: Company | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CompanyState = {
  companies: [],
  currentCompany: null,
  isLoading: false,
  error: null,
};

export const fetchCompanies = createAsyncThunk(
  'company/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/companies`);
      return response.data.companies;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch companies');
    }
  }
);

export const fetchCompanyById = createAsyncThunk(
  'company/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/companies/${id}`);
      return response.data.company;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch company');
    }
  }
);

export const createCompany = createAsyncThunk(
  'company/create',
  async (companyData: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/companies`, companyData);
      return response.data.company;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create company');
    }
  }
);

export const updateCompany = createAsyncThunk(
  'company/update',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/companies/${id}`, data);
      return response.data.company;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update company');
    }
  }
);

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentCompany: (state, action) => {
      state.currentCompany = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all companies
      .addCase(fetchCompanies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.companies = action.payload;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch company by ID
      .addCase(fetchCompanyById.fulfilled, (state, action) => {
        state.currentCompany = action.payload;
      })
      // Create company
      .addCase(createCompany.fulfilled, (state, action) => {
        state.companies.unshift(action.payload);
      })
      // Update company
      .addCase(updateCompany.fulfilled, (state, action) => {
        const index = state.companies.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.companies[index] = action.payload;
        }
        if (state.currentCompany?._id === action.payload._id) {
          state.currentCompany = action.payload;
        }
      });
  },
});

export const { clearError, setCurrentCompany } = companySlice.actions;
export default companySlice.reducer;