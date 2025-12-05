import api from '../bbs/apiService';

export interface AuditFilters {
  companyId?: string;
  plantId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  standard?: string;
  type?: string;
}

export interface DashboardStats {
  totalAudits: number;
  avgCompliance: number;
  totalObservations: number;
  departmentsAudited: number;
  statusBreakdown: {
    planned: number;
    inProgress: number;
    completed: number;
    closed: number;
  };
  observationBreakdown: {
    open: number;
    assigned: number;
    in_progress: number;
    completed: number;
    approved: number;
    rejected: number;
  };
  recentAudits: any[];
}

export interface ComplianceData {
  department: string;
  total: number;
  major: number;
  minor: number;
  compliance: number;
  plantId: string;
  plantName: string;
  totalQuestions: number;
  answeredQuestions: number;
}

export interface ClauseData {
  clause: string;
  element: string;
  total: number;
  major: number;
  minor: number;
  compliance: number;
  standard: string;
  totalQuestions: number;
  answeredQuestions: number;
}

export interface MonthlyTrendData {
  month: string;
  year: number;
  observations: number;
  compliance: number;
  audits: number;
  majorFindings: number;
  minorFindings: number;
  totalQuestions: number;
  answeredQuestions: number;
}

export interface CategoryData {
  category: string;
  observations: number;
  compliance: number;
  maxValue: number;
  totalQuestions: number;
  answeredQuestions: number;
}

export interface HeatmapData {
  department: string;
  plantId: string;
  clauses: { [key: string]: number };
}

export const auditService = {
  // Get dashboard statistics
  getDashboardStats: async (companyId: string, filters?: AuditFilters): Promise<DashboardStats> => {
    const response = await api.get(`/audits/${companyId}/stats/dashboard`, { params: filters });
    return response.data.stats;
  },

  // Get all audits with filters
  getAudits: async (companyId: string, filters?: AuditFilters) => {
    const response = await api.get(`/audits/${companyId}`, { params: filters });
    return response.data;
  },

  // Get department compliance data
  getDepartmentCompliance: async (companyId: string, filters?: AuditFilters): Promise<ComplianceData[]> => {
    const response = await api.get(`/audits/${companyId}/analytics/department-compliance`, { params: filters });
    return response.data;
  },

  // Get clause compliance data
  getClauseCompliance: async (companyId: string, filters?: AuditFilters): Promise<ClauseData[]> => {
    const response = await api.get(`/audits/${companyId}/analytics/clause-compliance`, { params: filters });
    return response.data;
  },

  // Get monthly trends
  getMonthlyTrends: async (companyId: string, filters?: AuditFilters): Promise<MonthlyTrendData[]> => {
    const response = await api.get(`/audits/${companyId}/analytics/monthly-trends`, { params: filters });
    return response.data;
  },

  // Get category analysis
  getCategoryAnalysis: async (companyId: string, filters?: AuditFilters): Promise<CategoryData[]> => {
    const response = await api.get(`/audits/${companyId}/analytics/category-analysis`, { params: filters });
    return response.data;
  },

  // Get compliance heatmap data
  getComplianceHeatmap: async (companyId: string, filters?: AuditFilters): Promise<{
    data: HeatmapData[];
    clauseHeaders: string[];
  }> => {
    const response = await api.get(`/audits/${companyId}/analytics/compliance-heatmap`, { params: filters });
    return response.data;
  },

  // Get recent audits
  getRecentAudits: async (companyId: string, limit: number = 10) => {
    const response = await api.get(`/audits/${companyId}`, { params: { limit, page: 1 } });
    return response.data.audits;
  },

  // Export dashboard data
  exportDashboardData: async (companyId: string, filters?: AuditFilters, format: 'excel' | 'pdf' = 'excel') => {
    const response = await api.get(`/audits/${companyId}/export/dashboard`, {
      params: { ...filters, format },
      responseType: 'blob'
    });
    return response.data;
  }
};