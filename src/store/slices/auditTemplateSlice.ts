import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Async thunks
export const fetchAuditTemplates = createAsyncThunk(
  'auditTemplate/fetchAuditTemplates',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/audit-templates/${companyId}`);
      return response.data.templates;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch templates');
    }
  }
);

export const createAuditTemplate = createAsyncThunk(
  'auditTemplate/createAuditTemplate',
  async ({ companyId, templateData }: { companyId: string, templateData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/audit-templates/${companyId}`, templateData);
      return response.data.template;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create template');
    }
  }
);

export const uploadChecklistTemplate = createAsyncThunk(
  'auditTemplate/uploadChecklistTemplate',
  async ({ companyId, templateId, file }: { companyId: string, templateId: string, file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `/audit-templates/${companyId}/${templateId}/upload-checklist`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.template;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload checklist');
    }
  }
);

const auditTemplateSlice = createSlice({
  name: 'auditTemplate',
  initialState: {
    templates: [],
    currentTemplate: null,
    isLoading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentTemplate: (state, action) => {
      state.currentTemplate = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch templates
      .addCase(fetchAuditTemplates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAuditTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates = action.payload;
      })
      .addCase(fetchAuditTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create template
      .addCase(createAuditTemplate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAuditTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates.push(action.payload);
      })
      .addCase(createAuditTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Upload checklist
      .addCase(uploadChecklistTemplate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadChecklistTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.templates.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
      })
      .addCase(uploadChecklistTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, setCurrentTemplate } = auditTemplateSlice.actions;
export default auditTemplateSlice.reducer;