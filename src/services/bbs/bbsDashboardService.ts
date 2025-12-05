import api from './apiService';

export interface BBSStats {
  total: number;
  open: number;
  closed: number;
  unsafeActs: number;
  unsafeConditions: number;
  safeBehaviors: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalChange: string;
  openChange: string;
  closedChange: string;
  safeBehaviorsChange: string;
  recentReports?: any[];
}

export interface BBSReport {
  _id: string;
  reportNumber: string;
  observationType: 'unsafe_act' | 'unsafe_condition' | 'safe_behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'approved' | 'pending_closure' | 'closed';
  description: string;
  observationDate: string;
  location: {
    area: string;
    specificLocation: string;
  };
  observer: {
    _id: string;
    name: string;
    email: string;
  };
  plantId: {
    _id: string;
    name: string;
    code: string;
  };
  correctiveActions: any[];
  createdAt: string;
  updatedAt: string;
}

class BBSService {
  async getBBSStats(companyId: string, filters: any = {}): Promise<BBSStats> {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        queryParams.append(key, value as string);
      }
    });

    const response = await api.get(`/bbs/${companyId}/stats/dashboard?${queryParams.toString()}`);
    return response.data.stats;
  }

  async getBBSTrends(companyId: string, filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        queryParams.append(key, value as string);
      }
    });

    const response = await api.get(`/bbs/${companyId}/trends?${queryParams.toString()}`);
    return response.data;
  }

  async getRecentReports(companyId: string, filters: any = {}): Promise<BBSReport[]> {
    const queryParams = new URLSearchParams({
      limit: '10',
      ...filters
    });

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        queryParams.set(key, value as string);
      }
    });

    const response = await api.get(`/bbs/${companyId}?${queryParams.toString()}`);
    return response.data.reports;
  }

  async getBBSReports(companyId: string, filters: any = {}): Promise<{
    reports: BBSReport[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const queryParams = new URLSearchParams(filters);
    const response = await api.get(`/bbs/${companyId}?${queryParams.toString()}`);
    return response.data;
  }

  async getBBSReport(companyId: string, reportId: string): Promise<BBSReport> {
    const response = await api.get(`/bbs/${companyId}/${reportId}`);
    return response.data.report;
  }

  async createBBSReport(companyId: string, data: any): Promise<BBSReport> {
    const response = await api.post(`/bbs/${companyId}`, data);
    return response.data.report;
  }

  async updateBBSReport(companyId: string, reportId: string, data: any): Promise<BBSReport> {
    const response = await api.patch(`/bbs/${companyId}/${reportId}`, data);
    return response.data.report;
  }

  async reviewBBSReport(companyId: string, reportId: string, data: any): Promise<BBSReport> {
    const response = await api.post(`/bbs/${companyId}/${reportId}/review`, data);
    return response.data.report;
  }

  async completeBBSAction(companyId: string, reportId: string, data: any): Promise<BBSReport> {
    const response = await api.post(`/bbs/${companyId}/${reportId}/complete`, data);
    return response.data.report;
  }

  async closeBBSReport(companyId: string, reportId: string, data: any): Promise<BBSReport> {
    const response = await api.post(`/bbs/${companyId}/${reportId}/close`, data);
    return response.data.report;
  }
}

export const bbsService = new BBSService();