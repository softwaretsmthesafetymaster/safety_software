import api from './apiService';

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

export interface CoachingModule {
  _id: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  isActive: boolean;
  createdBy: any;
  createdAt: string;
  updatedAt: string;
}

export interface VideoLibrary {
  _id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  duration: string;
  category: string;
  tags: string[];
  thumbnailUrl?: string;
  isActive: boolean;
  createdBy: any;
  createdAt: string;
}

export interface VideoAssignment {
  _id: string;
  videoId: string;
  userId: string;
  assignedBy: any;
  dueDate?: string;
  status: 'assigned' | 'watched' | 'completed';
  watchProgress: number;
  completedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface Game {
  _id: string;
  title: string;
  description: string;
  type: 'quiz' | 'scenario' | 'matching' | 'puzzle';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  points: number;
  isActive: boolean;
  questions?: QuizQuestion[];
  scenarios?: GameScenario[];
  createdBy: any;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  _id: string;
  question: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
    points?: number;
  }>;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  gameId: string;
  createdBy: any;
  createdAt: string;
}

export interface GameScenario {
  _id: string;
  title: string;
  description: string;
  situation: string;
  options: Array<{
    text: string;
    outcome: string;
    points: number;
    isOptimal: boolean;
  }>;
  gameId: string;
  createdBy: any;
  createdAt: string;
}

export interface GameScore {
  _id: string;
  userId: string;
  gameId: string;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  answers: any[];
  completedAt: string;
  game: Game;
  user: any;
}

export interface UserProgress {
  _id: string;
  userId: string;
  moduleId: string;
  progress: number;
  completed: boolean;
  completedAt?: string;
  timeSpent: number;
  lastAccessedAt: string;
  module: CoachingModule;
}

export const bbsService = {
  // BBS Reports
  async getBBSReports(companyId: string, params?: any) {
    const response = await api.get(`/bbs/${companyId}`, { params });
    return response.data;
  },

  async getBBSById(companyId: string, id: string) {
    const response = await api.get(`/bbs/${companyId}/${id}`);
    return response.data.report;
  },

  async createBBSReport(companyId: string, data: any) {
    const response = await api.post(`/bbs/${companyId}`, data);
    return response.data.report;
  },

  async updateBBSReport(companyId: string, id: string, data: any) {
    const response = await api.patch(`/bbs/${companyId}/${id}`, data);
    return response.data.report;
  },

  async reviewBBSReport(companyId: string, id: string, data: any) {
    const response = await api.post(`/bbs/${companyId}/${id}/review`, data);
    return response.data.report;
  },

  async completeBBSAction(companyId: string, id: string, data: any) {
    const response = await api.post(`/bbs/${companyId}/${id}/complete`, data);
    return response.data.report;
  },

  async closeBBSReport(companyId: string, id: string, data: any) {
    const response = await api.post(`/bbs/${companyId}/${id}/close`, data);
    return response.data.report;
  },

  async getBBSStats(companyId: string, plantId?: string) {
    const params = plantId ? { plantId } : {};
    const response = await api.get(`/bbs/${companyId}/stats/dashboard`, { params });
    return response.data.stats;
  },

  async uploadFiles(files: FileList) {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.urls;
  },

  // Coaching Modules
  async getCoachingModules(companyId: string) {
    const response = await api.get(`/bbs/${companyId}/coaching/modules`);
    return response.data.modules;
  },

  async createCoachingModule(companyId: string, data: any) {
    const response = await api.post(`/bbs/${companyId}/coaching/modules`, data);
    return response.data.module;
  },

  async updateCoachingModule(companyId: string, moduleId: string, data: any) {
    const response = await api.patch(`/bbs/${companyId}/coaching/modules/${moduleId}`, data);
    return response.data.module;
  },

  async deleteCoachingModule(companyId: string, moduleId: string) {
    const response = await api.delete(`/bbs/${companyId}/coaching/modules/${moduleId}`);
    return response.data;
  },

  async assignModuleToUser(companyId: string, moduleId: string, userId: string, dueDate?: string) {
    const response = await api.post(`/bbs/${companyId}/coaching/modules/${moduleId}/assign`, {
      userId,
      dueDate
    });
    return response.data;
  },

  async getUserProgress(companyId: string, userId: string) {
    const response = await api.get(`/bbs/${companyId}/coaching/progress/${userId}`);
    return response.data.progress;
  },

  async updateUserProgress(companyId: string, moduleId: string, progressData: any) {
    const response = await api.patch(`/bbs/${companyId}/coaching/modules/${moduleId}/progress`, progressData);
    return response.data;
  },

  // Video Library
  async getVideoLibrary(companyId: string) {
   
    const response = await api.get(`/bbs/${companyId}/videos`);
    return response.data.videos;
  },

  async createVideo(companyId: string, data: any) {
    const response = await api.post(`/bbs/${companyId}/videos`, data);
    return response.data.video;
  },

  async updateVideo(companyId: string, videoId: string, data: any) {
    const response = await api.patch(`/bbs/${companyId}/videos/${videoId}`, data);
    return response.data.video;
  },

  async deleteVideo(companyId: string, videoId: string) {
    const response = await api.delete(`/bbs/${companyId}/videos/${videoId}`);
    return response.data;
  },

  async assignVideoToUser(companyId: string, videoId: string, userId: string, dueDate?: string) {
    const response = await api.post(`/bbs/${companyId}/videos/${videoId}/assign`, {
      userId,
      dueDate
    });
    return response.data;
  },

  async getAssignedVideos(companyId: string, userId: string) {
   
    const response = await api.get(`/bbs/${companyId}/videos/assigned/${userId}`);
    
    return response.data;
  },

  async updateVideoProgress(companyId: string, videoId: string, progressData: any) {
    
    const response = await api.patch(`/bbs/${companyId}/videos/${videoId}/progress`, progressData);
    return response.data;
  },

  // Games
  async getGames(companyId: string) {
    const response = await api.get(`/bbs/${companyId}/games`);
    return response.data;
  },

  async createGame(companyId: string, data: any) {
    const response = await api.post(`/bbs/${companyId}/games`, data);
    return response.data;
  },

  async updateGame(companyId: string, gameId: string, data: any) {
    const response = await api.patch(`/bbs/${companyId}/games/${gameId}`, data);
    return response.data;
  },

  async deleteGame(companyId: string, gameId: string) {
    const response = await api.delete(`/bbs/${companyId}/games/${gameId}`);
    return response.data;
  },

  async getQuizQuestions(companyId: string, gameId: string) {
    const response = await api.get(`/bbs/${companyId}/games/${gameId}/questions`);
    return response.data;
  },

  async createQuizQuestion(companyId: string, gameId: string, data: any) {
    const response = await api.post(`/bbs/${companyId}/games/${gameId}/questions`, data);
    return response.data;
  },

  async updateQuizQuestion(companyId: string, gameId: string, questionId: string, data: any) {
    const response = await api.patch(`/bbs/${companyId}/games/${gameId}/questions/${questionId}`, data);
    return response.data;
  },

  async deleteQuizQuestion(companyId: string, gameId: string, questionId: string) {
    const response = await api.delete(`/bbs/${companyId}/games/${gameId}/questions/${questionId}`);
    return response.data;
  },

  async uploadQuizExcel(companyId: string, gameId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/bbs/${companyId}/games/${gameId}/questions/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async getGameScenarios(companyId: string, gameId: string) {
    const response = await api.get(`/bbs/${companyId}/games/${gameId}/scenarios`);
    return response.data;
  },

  async createGameScenario(companyId: string, gameId: string, data: any) {
    const response = await api.post(`/bbs/${companyId}/games/${gameId}/scenarios`, data);
    return response.data;
  },

  async submitGameScore(companyId: string, gameId: string, scoreData: any) {
    const response = await api.post(`/bbs/${companyId}/games/${gameId}/score`, scoreData);
    return response.data;
  },

  async getLeaderboard(companyId: string, gameId?: string) {
    const params = gameId ? { gameId } : {};
    const response = await api.get(`/bbs/${companyId}/games/leaderboard`, { params });
    return response.data;
  },

  async getUserAchievements(companyId: string, userId: string) {
    const response = await api.get(`/bbs/${companyId}/achievements/${userId}`);
    return response.data;
  },

  async getUserGameStats(companyId: string, userId: string) {
    const response = await api.get(`/bbs/${companyId}/games/stats/${userId}`);
    return response.data;
  }
};