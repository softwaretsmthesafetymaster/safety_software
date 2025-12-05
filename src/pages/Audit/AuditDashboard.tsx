import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  Target,
  Calendar,
  Users,
  Activity,
  CheckSquare,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Building2
} from 'lucide-react';
import Card from '../../components/UI/Card';
import { format, subMonths } from 'date-fns';

// Components
import ComplianceMatrix from './Charts/ComplianceMatrix';
import ClauseComplianceChart from './Charts/ClauseComplianceChart';
import MonthlyTrendChart from './Charts/MonthlyTrendChart';
import CategoryRadarChart from './Charts/CategoryRadarChart';
import ComplianceHeatmap from './Charts/ComplianceHeatmap';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import ErrorMessage from '../../components/UI/ErrorMessage';

// Hooks and Services
import { useAuditData } from '../../hooks/useAuditData';
import { auditService, AuditFilters } from '../../services/audit/auditService';
import { useAppSelector } from '../../hooks/redux';
import { Link } from 'react-router-dom';


function App() {
  const { user } = useAppSelector((state) => state.auth);
  const companyId = user?.companyId
  
  const [filters, setFilters] = useState<AuditFilters>({
    dateFrom: format(subMonths(new Date(), 12), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState('12months');

  const { data, isLoading, error, refetchAll } = useAuditData(companyId, filters);
  console.log("data:",data)
  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    const months = timeframe === '3months' ? 3 : timeframe === '6months' ? 6 : 12;
    setFilters({
      ...filters,
      dateFrom: format(subMonths(new Date(), months), 'yyyy-MM-dd'),
      dateTo: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const handleExportData = async () => {
    try {
      const blob = await auditService.exportDashboardData(companyId, filters, 'excel');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `safety-audit-dashboard-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const stats = useMemo(() => {
    if (!data.dashboardStats) return null;
    return data.dashboardStats;
  }, [data.dashboardStats]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <ErrorMessage 
          message="Failed to load dashboard data. Please check your connection and try again."
          onRetry={refetchAll}
          className="min-h-[400px]"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Building2 className="h-8 w-8 mr-3 text-blue-600" />
              Safety Audit Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Department & Clause Conformance Analytics</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={refetchAll}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <select 
              value={selectedTimeframe}
              onChange={(e) => handleTimeframeChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
            </select>
            <button 
              onClick={handleExportData}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-4">
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All Status</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filters.standard || ''}
            onChange={(e) => handleFilterChange('standard', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All Standards</option>
            <option value="BIS14489">BIS 14489</option>
            <option value="FireSafety">Fire Safety</option>
            <option value="ElectricalSafety">Electrical Safety</option>
            <option value="ISO45001">ISO 45001</option>
            <option value="PSM">PSM</option>
            <option value="AISafety">AI Safety</option>
          </select>

          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All Types</option>
            <option value="internal">Internal</option>
            <option value="external">External</option>
            <option value="regulatory">Regulatory</option>
            <option value="management">Management</option>
            <option value="process">Process</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner className="min-h-[400px]" size="lg" />
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Audits</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.total || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Compliance</p>
                  <p className="text-3xl font-bold text-green-600">
                    {Math.round(stats?.avgCompliance || 0)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Observations</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {stats?.observations?.total || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {stats?.inProgress || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Audit Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Audit Status Overview
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Planned</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.planned || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.inProgress || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.completed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Closed</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.closed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.total || 0}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Observations Status
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Open</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.observations?.open || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Assigned</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.observations?.assigned || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.observations?.completed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.observations?.approved || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>


          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Trends */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Monthly Trends
              </h3>
              {data.monthlyTrends && data.monthlyTrends.length > 0 ? (
                <MonthlyTrendChart data={data.monthlyTrends} type="combined" height={350} />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-500">
                  No trend data available
                </div>
              )}
            </div>

            {/* Category Radar */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-green-600" />
                Category Analysis
              </h3>
              {data.categoryAnalysis && data.categoryAnalysis.length > 0 ? (
                <CategoryRadarChart data={data.categoryAnalysis} height={350} />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-500">
                  No category data available
                </div>
              )}
            </div>
          </div>

          {/* Department Compliance */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Department-wise Compliance
            </h3>
            {data.departmentCompliance && data.departmentCompliance.length > 0 ? (
              <ComplianceMatrix data={data.departmentCompliance} height={400} />
            ) : (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                No department compliance data available
              </div>
            )}
          </div>

          {/* Clause Analysis */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckSquare className="h-5 w-5 mr-2 text-purple-600" />
              Clause-wise Non-Conformances
            </h3>
            {data.clauseCompliance && data.clauseCompliance.length > 0 ? (
              <ClauseComplianceChart data={data.clauseCompliance} height={450} />
            ) : (
              <div className="h-[450px] flex items-center justify-center text-gray-500">
                No clause compliance data available
              </div>
            )}
          </div>

          {/* Compliance Heatmap */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-red-600" />
              Department vs Clause Compliance Matrix
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Heat map showing non-conformances by department and clause (0 = compliant, higher numbers = more issues)
            </p>
            {data.complianceHeatmap && data.complianceHeatmap.data.length > 0 ? (
              <ComplianceHeatmap 
                data={data.complianceHeatmap.data} 
                clauseHeaders={data.complianceHeatmap.clauseHeaders} 
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No heatmap data available
              </div>
            )}
          </div>

          {/* Recent Audits Summary */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-600" />
              Recent Audit Summary
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Audit Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compliance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Observations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.recentAudits?.map((audit: any) => (
                    <tr key={audit._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {audit.auditNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {audit.plantId?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(audit.scheduledDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (audit.summary?.compliancePercentage || 0) >= 90 
                            ? 'bg-green-100 text-green-800'
                            : (audit.summary?.compliancePercentage || 0) >= 75
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {audit.summary?.compliancePercentage || 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {audit.observations?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          audit.status === 'completed' || audit.status === 'closed' 
                            ? 'bg-green-100 text-green-800'
                            : audit.status === 'in_progress' 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {audit.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                         to={`/audit/audits/${audit._id}`}
                         className="text-blue-600 hover:text-blue-900 flex items-center transition-colors">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {(!data.recentAudits || data.recentAudits.length === 0) && (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent audits available</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;