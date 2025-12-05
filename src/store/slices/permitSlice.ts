import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

interface Permit {
  _id: string;
  permitNumber: string;
  workDescription: string;
  types: string[];
  status: string;
  isHighRisk: boolean;
  schedule: {
    startDate: string;
    endDate: string;
    shift?: string;
  };
  location: {
    area: string;
    specificLocation: string;
  };
  contractor: {
    name: string;
    contact: string;
    license?: string;
  };
  workers: Array<{
    name: string;
    id: string;
    contact: string;
    medicalFitness: boolean;
    certifications: string[];
  }>;
  hazards: Array<{
    type: string;
    mitigation: string;
    severity: 'low' | 'medium' | 'high';
    probability: 'low' | 'medium' | 'high';
  }>;
  ppe: Array<{
    item: string;
    required: boolean;
  }>;
  safetyChecklist: Array<{
    item: string;
    checked: boolean;
    remarks: string;
    category: 'risk' | 'precaution' | 'ppe' | 'inspection' | 'rescue';
  }>;
  checklists: {
    riskAssociated: string[];
    precautions: string[];
    ppeRequired: string[];
    inspectionChecklist: string[];
    rescueTechniques: string[];
  };
  signatures: Array<{
    user: string;
    role: string;
    signature: string;
    signedAt: string;
    ipAddress?: string;
    deviceInfo?: string;
  }>;
  approvals: Array<{
    step: number;
    role: string;
    label: string;
    required: boolean;
    approver?: any;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
    timestamp?: string;
    conditions?: string[];
  }>;
  requestedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  plantId: {
    _id: string;
    name: string;
    code: string;
  };
  areaId: string;
  companyId: string;
  expiresAt?: string;
  activatedBy?: string;
  activatedAt?: string;
  documents: Array<{
    name: string;
    url: string;
    type: string;
    uploadedBy: string;
    uploadedAt: string;
  }>;
  closure?: {
    closureReason: string;
    workCompleted: boolean;
    safetyChecklistCompleted: boolean;
    equipmentReturned: boolean;
    areaCleared: boolean;
    closureEvidence: string;
    closurePhotos: string[];
    closureComments: string;
    submittedBy: string;
    submittedAt: string;
    approvedBy?: string;
    approvedAt?: string;
    actualEndTime?: string;
  };
  stopDetails?: {
    stopReason: string;
    safetyIssue: string;
    immediateActions: string;
    stopComments: string;
    stoppedBy: string;
    stoppedAt: string;
    resumeConditions: string[];
  };
  closureFlow: Array<{
    step: number;
    role: string;
    label: string;
    required: boolean;
    status: 'pending' | 'approved';
    approver?: string;
    timestamp?: string;
  }>;
  stopWorkRoles: Array<{
    role: string;
    label: string;
    userId?: string;
  }>;
  extensions: Array<{
    hours: number;
    reason: string;
    requestedBy: string;
    requestedAt: string;
    approvedBy?: string;
    approvedAt?: string;
    comments?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface PermitState {
  permits: Permit[];
  currentPermit: Permit | null;
  isLoading: boolean;
  error: string | null;
  stats: {
    total: number;
    active: number;
    pending: number;
    expired: number;
    closed: number;
    recentPermits: Permit[];
    monthlyData: any[];
  } | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
  checklists: {
    [permitType: string]: {
      riskAssociated: string[];
      precautions: string[];
      ppeRequired: string[];
      inspectionChecklist: string[];
      rescueTechniques: string[];
    };
  };
}

const initialState: PermitState = {
  permits: [],
  currentPermit: null,
  isLoading: false,
  error: null,
  stats: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
  },
  checklists: {}
};

// Async thunks
export const fetchPermits = createAsyncThunk(
  'permit/fetchAll',
  async ({ companyId, ...params }: { companyId: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`/permits/${companyId}?${queryParams}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch permits');
    }
  }
);

export const fetchPermitById = createAsyncThunk(
  'permit/fetchById',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/permits/${companyId}/${id}`);
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch permit');
    }
  }
);

export const fetchPermitChecklist = createAsyncThunk(
  'permit/fetchChecklist',
  async (permitType: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/permit/checklist/${permitType}`);
      return { permitType, checklist: response.data.checklist };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch checklist');
    }
  }
);

export const createPermit = createAsyncThunk(
  'permit/create',
  async ({ companyId, permitData }: { companyId: string; permitData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/permits/${companyId}`, permitData);
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create permit');
    }
  }
);

export const updatePermit = createAsyncThunk(
  'permit/update',
  async ({ companyId, id, data }: { companyId: string; id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/permits/${companyId}/${id}`, data);
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update permit');
    }
  }
);

export const submitPermit = createAsyncThunk(
  'permit/submit',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/permits/${companyId}/${id}/submit`, {});
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit permit');
    }
  }
);

export const approvePermit = createAsyncThunk(
  'permit/approve',
  async ({ companyId, id, decision, comments, conditions }: { 
    companyId: string; 
    id: string; 
    decision: string; 
    comments: string;
    conditions?: string[];
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/permits/${companyId}/${id}/approve`, { 
        decision, 
        comments,
        conditions 
      });
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process approval');
    }
  }
);

export const activatePermit = createAsyncThunk(
  'permit/activate',
  async ({ companyId, id }: { companyId: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/permits/${companyId}/${id}/activate`, {});
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to activate permit');
    }
  }
);

export const closePermit = createAsyncThunk(
  'permit/close',
  async ({ companyId, id, approvalDecision }: { companyId: string; id: string; approvalDecision: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/permits/${companyId}/${id}/close`, { 
        approvalDecision 
      },);
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to close permit');
    }
  }
);

export const stopPermit = createAsyncThunk(
  'permit/stop',
  async ({ companyId, id, stopData }: { companyId: string; id: string; stopData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/permits/${companyId}/${id}/stop`, { 
        stopData 
      });
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to stop permit');
    }
  }
);

export const extendPermit = createAsyncThunk(
  'permit/extend',
  async ({ companyId, id, extensionHours, extensionReason, comments }: { 
    companyId: string; 
    id: string; 
    extensionHours: number;
    extensionReason: string;
    comments?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/permits/${companyId}/${id}/extension`, { 
        extensionHours,
        extensionReason,
        comments 
      });
      return response.data.permit;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to extend permit');
    }
  }
);

export const fetchPermitStats = createAsyncThunk(
  'permit/fetchStats',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/permits/${companyId}/stats/dashboard`);
      return response.data.stats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);

const permitSlice = createSlice({
  name: 'permit',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPermit: (state) => {
      state.currentPermit = null;
    },
    setCurrentPermit: (state, action) => {
      state.currentPermit = action.payload;
    },
    updateChecklistsForPermit: (state, action) => {
      const { permitTypes, checklists } = action.payload;
      if (state.currentPermit) {
        // Merge checklists from all permit types
        const mergedChecklists = {
          riskAssociated: [] as string[],
          precautions: [] as string[],
          ppeRequired: [] as string[],
          inspectionChecklist: [] as string[],
          rescueTechniques: [] as string[]
        };

        permitTypes.forEach((type: string) => {
          const typeChecklist = checklists[type];
          if (typeChecklist) {
            mergedChecklists.riskAssociated.push(...typeChecklist.riskAssociated);
            mergedChecklists.precautions.push(...typeChecklist.precautions);
            mergedChecklists.ppeRequired.push(...typeChecklist.ppeRequired);
            mergedChecklists.inspectionChecklist.push(...typeChecklist.inspectionChecklist);
            mergedChecklists.rescueTechniques.push(...typeChecklist.rescueTechniques);
          }
        });

        // Remove duplicates
        Object.keys(mergedChecklists).forEach(key => {
          mergedChecklists[key as keyof typeof mergedChecklists] = 
            [...new Set(mergedChecklists[key as keyof typeof mergedChecklists])];
        });

        state.currentPermit.checklists = mergedChecklists;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch permits
      .addCase(fetchPermits.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPermits.fulfilled, (state, action) => {
        state.isLoading = false;
        state.permits = action.payload.permits;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          total: action.payload.total,
        };
      })
      .addCase(fetchPermits.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch permit by ID
      .addCase(fetchPermitById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPermitById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPermit = action.payload;
      })
      .addCase(fetchPermitById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch checklist
      .addCase(fetchPermitChecklist.fulfilled, (state, action) => {
        const { permitType, checklist } = action.payload;
        state.checklists[permitType] = checklist;
      })
      
      // Create permit
      .addCase(createPermit.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPermit.fulfilled, (state, action) => {
        state.isLoading = false;
        state.permits.unshift(action.payload);
        state.currentPermit = action.payload;
      })
      .addCase(createPermit.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update permit
      .addCase(updatePermit.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePermit.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.permits.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.permits[index] = action.payload;
        }
        if (state.currentPermit?._id === action.payload._id) {
          state.currentPermit = action.payload;
        }
      })
      .addCase(updatePermit.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Submit permit
      .addCase(submitPermit.fulfilled, (state, action) => {
        const index = state.permits.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.permits[index] = action.payload;
        }
        if (state.currentPermit?._id === action.payload._id) {
          state.currentPermit = action.payload;
        }
      })
      
      // Approve permit
      .addCase(approvePermit.fulfilled, (state, action) => {
        const index = state.permits.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.permits[index] = action.payload;
        }
        if (state.currentPermit?._id === action.payload._id) {
          state.currentPermit = action.payload;
        }
      })
      
      // Activate permit
      .addCase(activatePermit.fulfilled, (state, action) => {
        const index = state.permits.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.permits[index] = action.payload;
        }
        if (state.currentPermit?._id === action.payload._id) {
          state.currentPermit = action.payload;
        }
      })
      
      // Close permit
      .addCase(closePermit.fulfilled, (state, action) => {
        const index = state.permits.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.permits[index] = action.payload;
        }
        if (state.currentPermit?._id === action.payload._id) {
          state.currentPermit = action.payload;
        }
      })
      
      // Stop permit
      .addCase(stopPermit.fulfilled, (state, action) => {
        const index = state.permits.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.permits[index] = action.payload;
        }
        if (state.currentPermit?._id === action.payload._id) {
          state.currentPermit = action.payload;
        }
      })
      
      // Extend permit
      .addCase(extendPermit.fulfilled, (state, action) => {
        const index = state.permits.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.permits[index] = action.payload;
        }
        if (state.currentPermit?._id === action.payload._id) {
          state.currentPermit = action.payload;
        }
      })
      
      // Fetch stats
      .addCase(fetchPermitStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { 
  clearError, 
  clearCurrentPermit, 
  setCurrentPermit,
  updateChecklistsForPermit 
} = permitSlice.actions;

export default permitSlice.reducer;