import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bbsService } from '../../services/bbs/bbsService';

// Import types
export interface BBSReport {
  _id: string;
  reportNumber: string;
  companyId: string;
  plantId: any;
  areaId: string;
  observer: any;
  observationDate: string;
  location: {
    area: string;
    specificLocation: string;
  };
  observedPersons: Array<{
    name: string;
    designation: string;
    department: string;
  }>;
  observationType: 'unsafe_act' | 'unsafe_condition' | 'safe_behavior';
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  immediateAction?: string;
  rootCause?: string;
  correctiveActions: Array<{
    _id: string;
    action: string;
    assignedTo: any;
    dueDate: string;
    priority: string;
    status: 'pending' | 'in_progress' | 'completed';
    completedDate?: string;
    completionEvidence?: string;
    effectivenessRating?: number;
  }>;
  feedback: {
    given: boolean;
    method?: string;
    response?: string;
  };
  photos: Array<{
    url: string;
    description: string;
  }>;
  reviewedBy?: any;
  reviewedAt?: string;
  reviewComments?: string;
  reviewDecision?: 'approve' | 'reassign';
  reassignReason?: string;
  completedBy?: any;
  completedAt?: string;
  lessonsLearned?: string;
  status: 'open' | 'approved' | 'pending_closure' | 'closed' | 'reassigned';
  createdAt: string;
  updatedAt: string;
}

export interface BBSStats {
  total: number;
  open: number;
  closed: number;
  approved: number;
  pending_closure: number;
  reassigned: number;
  unsafeActs: number;
  unsafeConditions: number;
  safeBehaviors: number;
  recentReports: BBSReport[];
  monthlyTrends: Array<{
    month: string;
    observations: number;
    actions: number;
  }>;
}

interface BBSState {
  reports: BBSReport[];
  currentReport: BBSReport | null;
  stats: BBSStats | null;
  videoLibrary: any[];
  assignedVideos: any[];
  games: any[];
  userGameStats: any;
  leaderboard: any[];
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  total: number;
}

const initialState: BBSState = {
  reports: [],
  currentReport: null,
  stats: null,
  videoLibrary: [],
  assignedVideos: [],
  games: [],
  userGameStats: null,
  leaderboard: [],
  isLoading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  total: 0
};

// Async thunks
export const fetchBBSReports = createAsyncThunk(
  'bbs/fetchReports',
  async ({ companyId, params }: { companyId: string; params?: any }) => {
    return await bbsService.getBBSReports(companyId, params);
  }
);

export const fetchBBSById = createAsyncThunk(
  'bbs/fetchById',
  async ({ companyId, id }: { companyId: string; id: string }) => {
    return await bbsService.getBBSById(companyId, id);
  }
);

export const createBBSReport = createAsyncThunk(
  'bbs/create',
  async ({ companyId, reportData }: { companyId: string; reportData: any }) => {
    return await bbsService.createBBSReport(companyId, reportData);
  }
);

export const updateBBSReport = createAsyncThunk(
  'bbs/update',
  async ({ companyId, id, data }: { companyId: string; id: string; data: any }) => {
    return await bbsService.updateBBSReport(companyId, id, data);
  }
);

export const reviewBBSReport = createAsyncThunk(
  'bbs/review',
  async ({ companyId, id, data }: { companyId: string; id: string; data: any }) => {
    return await bbsService.reviewBBSReport(companyId, id, data);
  }
);

export const completeBBSAction = createAsyncThunk(
  'bbs/complete',
  async ({ companyId, id, data }: { companyId: string; id: string; data: any }) => {
    return await bbsService.completeBBSAction(companyId, id, data);
  }
);

export const closeBBSReport = createAsyncThunk(
  'bbs/close',
  async ({ companyId, id, data }: { companyId: string; id: string; data: any }) => {
    return await bbsService.closeBBSReport(companyId, id, data);
  }
);

export const fetchBBSStats = createAsyncThunk(
  'bbs/fetchStats',
  async ({ companyId, plantId }: { companyId: string; plantId?: string }) => {
    return await bbsService.getBBSStats(companyId, plantId);
  }
);

// Video Library thunks
export const fetchVideoLibrary = createAsyncThunk(
  'bbs/fetchVideoLibrary',
  async (companyId: string) => {
    const response = await bbsService.getVideoLibrary(companyId);
    
    return response;
  }
);

export const createVideo = createAsyncThunk(
  'bbs/createVideo',
  async ({ companyId, data }: { companyId: string; data: any }) => {
    const response = await bbsService.createVideo(companyId, data);
    return response.video;
  }
);

export const updateVideo = createAsyncThunk(
  'bbs/updateVideo',
  async ({ companyId, videoId, data }: { companyId: string; videoId: string; data: any }) => {
    const response = await bbsService.updateVideo(companyId, videoId, data);
    return response.video;
  }
);

export const deleteVideo = createAsyncThunk(
  'bbs/deleteVideo',
  async ({ companyId, videoId }: { companyId: string; videoId: string }) => {
    await bbsService.deleteVideo(companyId, videoId);
    return videoId;
  }
);

export const assignVideoToUser = createAsyncThunk(
  'bbs/assignVideoToUser',
  async ({ companyId, videoId, userId, dueDate }: { companyId: string; videoId: string; userId: string; dueDate?: string }) => {
    const response = await bbsService.assignVideoToUser(companyId, videoId, userId, dueDate);
    return response.assignment;
  }
);

export const fetchAssignedVideos = createAsyncThunk(
  'bbs/fetchAssignedVideos',
  async ({ companyId, userId }: { companyId: string; userId: string }) => {
    
    const response = await bbsService.getAssignedVideos(companyId, userId);
    return response.assignments;
  }
);

export const updateVideoProgress = createAsyncThunk(
  'bbs/updateVideoProgress',
  async ({ companyId, videoId, progressData }: { companyId: string; videoId: string; progressData: any }) => {
    const response = await bbsService.updateVideoProgress(companyId, videoId, progressData);
    return response.assignment;
  }
);

// Games thunks
export const fetchGames = createAsyncThunk(
  'bbs/fetchGames',
  async (companyId: string) => {
    const response = await bbsService.getGames(companyId);
    return response.games;
  }
);

export const createGame = createAsyncThunk(
  'bbs/createGame',
  async ({ companyId, data }: { companyId: string; data: any }) => {
    const response = await bbsService.createGame(companyId, data);
    return response.game;
  }
);

export const updateGame = createAsyncThunk(
  'bbs/updateGame',
  async ({ companyId, gameId, data }: { companyId: string; gameId: string; data: any }) => {
    const response = await bbsService.updateGame(companyId, gameId, data);
    return response.game;
  }
);

export const deleteGame = createAsyncThunk(
  'bbs/deleteGame',
  async ({ companyId, gameId }: { companyId: string; gameId: string }) => {
    await bbsService.deleteGame(companyId, gameId);
    return gameId;
  }
);

export const getQuizQuestions = createAsyncThunk(
  'bbs/getQuizQuestions',
  async ({ companyId, gameId }: { companyId: string; gameId: string }) => {
    const response = await bbsService.getQuizQuestions(companyId, gameId);
    return response;
  }
);

export const createQuizQuestion = createAsyncThunk(
  'bbs/createQuizQuestion',
  async ({ companyId, gameId, data }: { companyId: string; gameId: string; data: any }) => {
    const response = await bbsService.createQuizQuestion(companyId, gameId, data);
    return response.question;
  }
);

export const uploadQuizExcel = createAsyncThunk(
  'bbs/uploadQuizExcel',
  async ({ companyId, gameId, file }: { companyId: string; gameId: string; file: File }) => {
    const response = await bbsService.uploadQuizExcel(companyId, gameId, file);
    return response;
  }
);

export const submitGameScore = createAsyncThunk(
  'bbs/submitGameScore',
  async ({ companyId, gameId, scoreData }: { companyId: string; gameId: string; scoreData: any }) => {
    const response = await bbsService.submitGameScore(companyId, gameId, scoreData);
    return response;
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'bbs/fetchLeaderboard',
  async ({ companyId, gameId }: { companyId: string; gameId?: string }) => {
    const response = await bbsService.getLeaderboard(companyId, gameId);
    return response.leaderboard;
  }
);

export const fetchUserGameStats = createAsyncThunk(
  'bbs/fetchUserGameStats',
  async ({ companyId, userId }: { companyId: string; userId: string }) => {
    const response = await bbsService.getUserGameStats(companyId, userId);
   
    return response.stats;
  }
);

const bbsSlice = createSlice({
  name: 'bbs',
  initialState,
  reducers: {
    clearCurrentReport: (state) => {
      state.currentReport = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch reports
      .addCase(fetchBBSReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBBSReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports = action.payload.reports;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.total = action.payload.total;
      })
      .addCase(fetchBBSReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch reports';
      })
      
      // Fetch by ID
      .addCase(fetchBBSById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBBSById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentReport = action.payload;
      })
      .addCase(fetchBBSById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch report';
      })
      
      // Create report
      .addCase(createBBSReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBBSReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports.unshift(action.payload);
      })
      .addCase(createBBSReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create report';
      })
      
      // Update report
      .addCase(updateBBSReport.fulfilled, (state, action) => {
        state.currentReport = action.payload;
        const index = state.reports.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.reports[index] = action.payload;
        }
      })
      
      // Review report
      .addCase(reviewBBSReport.fulfilled, (state, action) => {
        state.currentReport = action.payload;
        const index = state.reports.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.reports[index] = action.payload;
        }
      })
      
      // Complete action
      .addCase(completeBBSAction.fulfilled, (state, action) => {
        state.currentReport = action.payload;
        const index = state.reports.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.reports[index] = action.payload;
        }
      })
      
      // Close report
      .addCase(closeBBSReport.fulfilled, (state, action) => {
        state.currentReport = action.payload;
        const index = state.reports.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.reports[index] = action.payload;
        }
      })
      
      // Fetch stats
      .addCase(fetchBBSStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      
      // Video Library
      .addCase(fetchVideoLibrary.fulfilled, (state, action) => {
        state.videoLibrary = action.payload;
      })
      .addCase(createVideo.fulfilled, (state, action) => {
        state.videoLibrary.unshift(action.payload);
      })
      .addCase(updateVideo.fulfilled, (state, action) => {
        const index = state.videoLibrary.findIndex(v => v._id === action.payload._id);
        if (index !== -1) {
          state.videoLibrary[index] = action.payload;
        }
      })
      .addCase(deleteVideo.fulfilled, (state, action) => {
        state.videoLibrary = state.videoLibrary.filter(v => v._id !== action.payload);
      })
      
      // Assigned Videos
      .addCase(fetchAssignedVideos.fulfilled, (state, action) => {
        state.assignedVideos = action.payload;
      })
      .addCase(updateVideoProgress.fulfilled, (state, action) => {
        const index = state.assignedVideos.findIndex(a => a._id === action.payload._id);
        if (index !== -1) {
          state.assignedVideos[index] = action.payload;
        }
      })
      
      // Games
      .addCase(fetchGames.fulfilled, (state, action) => {
        state.games = action.payload;
      })
      .addCase(createGame.fulfilled, (state, action) => {
        state.games.unshift(action.payload);
      })
      .addCase(updateGame.fulfilled, (state, action) => {
        const index = state.games.findIndex(g => g._id === action.payload._id);
        if (index !== -1) {
          state.games[index] = action.payload;
        }
      })
      .addCase(deleteGame.fulfilled, (state, action) => {
        state.games = state.games.filter(g => g._id !== action.payload);
      })
      
      // Leaderboard
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboard = action.payload;
      })
      
      // User Game Stats
      .addCase(fetchUserGameStats.fulfilled, (state, action) => {
        state.userGameStats = action.payload;
      });
  }
});

export const { clearCurrentReport, clearError } = bbsSlice.actions;
export default bbsSlice.reducer;