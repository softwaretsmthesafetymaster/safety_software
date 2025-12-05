import { useQuery } from '@tanstack/react-query';
import { auditService, AuditFilters } from '../services/audit/auditService';

export const useAuditData = (companyId: string, filters?: AuditFilters) => {
  const dashboardStats = useQuery({
    queryKey: ['dashboardStats', companyId, filters],
    queryFn: () => auditService.getDashboardStats(companyId, filters),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const departmentCompliance = useQuery({
    queryKey: ['departmentCompliance', companyId, filters],
    queryFn: () => auditService.getDepartmentCompliance(companyId, filters),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const clauseCompliance = useQuery({
    queryKey: ['clauseCompliance', companyId, filters],
    queryFn: () => auditService.getClauseCompliance(companyId, filters),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const monthlyTrends = useQuery({
    queryKey: ['monthlyTrends', companyId, filters],
    queryFn: () => auditService.getMonthlyTrends(companyId, filters),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const categoryAnalysis = useQuery({
    queryKey: ['categoryAnalysis', companyId, filters],
    queryFn: () => auditService.getCategoryAnalysis(companyId, filters),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const complianceHeatmap = useQuery({
    queryKey: ['complianceHeatmap', companyId, filters],
    queryFn: () => auditService.getComplianceHeatmap(companyId, filters),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const recentAudits = useQuery({
    queryKey: ['recentAudits', companyId],
    queryFn: () => auditService.getRecentAudits(companyId, 10),
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  const isLoading = 
    dashboardStats.isLoading ||
    departmentCompliance.isLoading ||
    clauseCompliance.isLoading ||
    monthlyTrends.isLoading ||
    categoryAnalysis.isLoading ||
    complianceHeatmap.isLoading ||
    recentAudits.isLoading;

  const error = 
    dashboardStats.error ||
    departmentCompliance.error ||
    clauseCompliance.error ||
    monthlyTrends.error ||
    categoryAnalysis.error ||
    complianceHeatmap.error ||
    recentAudits.error;

  const refetchAll = () => {
    dashboardStats.refetch();
    departmentCompliance.refetch();
    clauseCompliance.refetch();
    monthlyTrends.refetch();
    categoryAnalysis.refetch();
    complianceHeatmap.refetch();
    recentAudits.refetch();
  };

  return {
    data: {
      dashboardStats: dashboardStats.data,
      departmentCompliance: departmentCompliance.data,
      clauseCompliance: clauseCompliance.data,
      monthlyTrends: monthlyTrends.data,
      categoryAnalysis: categoryAnalysis.data,
      complianceHeatmap: complianceHeatmap.data,
      recentAudits: recentAudits.data,
    },
    isLoading,
    error,
    refetchAll,
  };
};