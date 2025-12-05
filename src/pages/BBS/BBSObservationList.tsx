import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Search,
  Calendar,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  X,
  Building,
  FileText,
  Users,
  Settings
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { bbsService, BBSReport } from '../../services/bbs/bbsService';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { reportService } from '../../services/bbs/reportService';

interface Filters {
  status: string;
  type: string;
  severity: string;
  plantIds: string[];
  dateRange: {
    start: string;
    end: string;
  };
  areas: string[];
  search: string;
  observer: string;
  timeRange: '7d' | '30d' | '90d' | '12m' | 'custom';
}

const BBSObservationList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { plants } = useAppSelector((state) => state.plant);
  const { currentCompany } = useAppSelector((state) => state.company);
  
  const [reports, setReports] = useState<BBSReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [availableAreas, setAvailableAreas] = useState<any[]>([]);
  const [availableObservers, setAvailableObservers] = useState<any[]>([]);

  const [filters, setFilters] = useState<Filters>({
    status: '',
    type: '',
    severity: '',
    plantIds: user?.role === 'plant_head' ? [user.plantId] : [],
    dateRange: {
      start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    areas: [],
    search: '',
    observer: '',
    timeRange: '30d'
  });

  const downloadAllReports = async (format: 'pdf' | 'excel') => {
  try {
    if (format === 'excel') {
      // Download all reports as Excel
      reportService.downloadExcel(reports, currentCompany);
    }

    if (format === 'pdf') {
      // Generate and download combined PDF
      const summaryData = {
        generatedAt: new Date(),
        reports,
        stats: {
          total: reports.length,
          open: reports.filter(r => r.status === 'open').length,
          closed: reports.filter(r => r.status === 'closed').length,
          unsafeActs: reports.filter(r => r.observationType === 'unsafe_act').length,
          unsafeConditions: reports.filter(r => r.observationType === 'unsafe_condition').length,
          safeBehaviors: reports.filter(r => r.observationType === 'safe_behavior').length,
        }
      };

      reportService.downloadCombinedPDF(summaryData, currentCompany);
    }
  } catch (error) {
    console.error('Download error:', error);
  }
};


  // Get available plants based on user role
  const getAvailablePlants = () => {
    if (user?.role === 'company_owner') {
      return plants;
    } else if (user?.role === 'plant_head') {
      return plants.filter(plant => plant._id === user.plantId);
    }
    return plants.filter(plant => plant._id === user?.plantId);
  };

  // Get areas from selected plants
  useEffect(() => {
    const selectedPlants = getAvailablePlants().filter(plant => 
      filters.plantIds.length === 0 || filters.plantIds.includes(plant._id)
    );
    
    const areas = selectedPlants.flatMap(plant => 
      plant.areas?.map(area => ({ ...area, plantName: plant.name })) || []
    );
    
    setAvailableAreas(areas);
  }, [filters.plantIds, plants, user]);

  // Update date range when time range changes
  useEffect(() => {
    if (filters.timeRange !== 'custom') {
      const end = new Date();
      let start = new Date();
      
      switch (filters.timeRange) {
        case '7d':
          start = subDays(end, 7);
          break;
        case '30d':
          start = subDays(end, 30);
          break;
        case '90d':
          start = subDays(end, 90);
          break;
        case '12m':
          start = subMonths(end, 12);
          break;
      }
      
      setFilters(prev => ({
        ...prev,
        dateRange: {
          start: format(start, 'yyyy-MM-dd'),
          end: format(end, 'yyyy-MM-dd')
        }
      }));
    }
  }, [filters.timeRange]);

  useEffect(() => {
    fetchReports();
  }, [currentPage]);

  useEffect(() => {
    fetchReports();
    setCurrentPage(1);
  }, [filters]);

  const fetchReports = async () => {
    if (!user?.companyId) return;
    
    try {
      setFilterLoading(true);
      
      const queryParams = {
        page: currentPage,
        limit: 10,
        plantIds: filters.plantIds.join(','),
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        areas: filters.areas.join(','),
        types: filters.type,
        status: filters.status,
        severity: filters.severity,
        search: filters.search,
        observer: filters.observer
      };

      // Remove empty parameters
      Object.keys(queryParams).forEach(key => {
        if (!queryParams[key]) delete queryParams[key];
      });

      const response = await bbsService.getBBSReports(user.companyId, queryParams);
      
      setReports(response.reports);
      setTotalPages(response.totalPages);
      setTotal(response.total);

      // Extract unique observers for filter
      const observers = response.reports.reduce((acc, report) => {
        if (report.observer && !acc.find(obs => obs._id === report.observer._id)) {
          acc.push(report.observer);
        }
        return acc;
      }, []);
      setAvailableObservers(observers);

    } catch (error) {
      console.error('Error fetching BBS reports:', error);
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  };

  const handleFilterChange = (filterType: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      type: '',
      severity: '',
      plantIds: user?.role === 'plant_head' ? [user.plantId] : [],
      dateRange: {
        start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
      },
      areas: [],
      search: '',
      observer: '',
      timeRange: '30d'
    });
    setCurrentPage(1);
  };

  // const downloadAllReports = async (format: 'excel' | 'pdf') => {
  //   try {
  //     // Implementation for download functionality
  //     const queryParams = {
  //       plantIds: filters.plantIds.join(','),
  //       startDate: filters.dateRange.start,
  //       endDate: filters.dateRange.end,
  //       areas: filters.areas.join(','),
  //       types: filters.type,
  //       status: filters.status,
  //       severity: filters.severity,
  //       search: filters.search,
  //       observer: filters.observer,
  //       download: format
  //     };

  //     // Remove empty parameters
  //     Object.keys(queryParams).forEach(key => {
  //       if (!queryParams[key]) delete queryParams[key];
  //     });

  //     // Create download URL
  //     const params = new URLSearchParams(queryParams);
  //     const url = `${import.meta.env.VITE_API_URL}/bbs/${user?.companyId}/download?${params.toString()}`;
      
  //     // Trigger download
  //     window.open(url, '_blank');
  //   } catch (error) {
  //     console.error('Download error:', error);
  //   }
  // };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'approved':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending_closure':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending_closure':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'reassigned':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'safe_behavior':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'unsafe_act':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'unsafe_condition':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading && reports.length === 0) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            BBS Observations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage behavioral safety observations and track actions
            {user?.role !== 'company_owner' && (
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {user?.role.replace('_', ' ').toUpperCase()} VIEW
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="secondary"
            icon={Filter}
            className={showFilters ? 'bg-blue-100 text-blue-600' : ''}
          >
            Filters {total > 0 && `(${total})`}
          </Button>
          
          <Button
            onClick={fetchReports}
            variant="secondary"
            icon={RefreshCw}
            disabled={filterLoading}
          >
            Refresh
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => downloadAllReports('excel')}
              variant="secondary"
              icon={Download}
              size="sm"
            >
              Excel
            </Button>
            <Button
              onClick={() => downloadAllReports('pdf')}
              variant="secondary"
              icon={FileText}
              size="sm"
            >
              PDF
            </Button>
          </div>
          
          <Button
            as={Link}
            to="/bbs/observations/new"
            variant="primary"
            icon={Plus}
          >
            New Observation
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filter Observations
            </h3>
            <div className="flex items-center space-x-2">
              <Button onClick={resetFilters} variant="secondary" size="sm">
                Reset All
              </Button>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Search by report number, description..."
                />
              </div>
            </div>

            {/* Plant Selection - Only for company owner */}
            {user?.role === 'company_owner' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plants
                </label>
                <select
                  multiple
                  value={filters.plantIds}
                  onChange={(e) => handleFilterChange('plantIds', Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  size={4}
                >
                  {getAvailablePlants().map((plant) => (
                    <option key={plant._id} value={plant._id}>
                      {plant.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Range
              </label>
              <select
                value={filters.timeRange}
                onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="12m">Last 12 Months</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {filters.timeRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="approved">Approved</option>
                <option value="pending_closure">Pending Closure</option>
                <option value="closed">Closed</option>
                <option value="reassigned">Reassigned</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observation Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="unsafe_act">Unsafe Act</option>
                <option value="unsafe_condition">Unsafe Condition</option>
                <option value="safe_behavior">Safe Behavior</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Areas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Areas
              </label>
              <select
                multiple
                value={filters.areas}
                onChange={(e) => handleFilterChange('areas', Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                size={4}
              >
                {availableAreas.map((area) => (
                  <option key={`${area.plantName}-${area.name}`} value={area.name}>
                    {area.name} ({area.plantName})
                  </option>
                ))}
              </select>
            </div>

            {/* Observer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observer
              </label>
              <select
                value={filters.observer}
                onChange={(e) => handleFilterChange('observer', e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">All Observers</option>
                {availableObservers.map((observer) => (
                  <option key={observer._id} value={observer._id}>
                    {observer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {filterLoading && (
            <div className="mt-4 flex items-center justify-center">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Applying filters...
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Results Summary */}
      {!loading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {reports.length} of {total} observations
            {filters.search && ` matching "${filters.search}"`}
          </p>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {filters.status && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                Status: {filters.status}
              </span>
            )}
            {filters.type && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                Type: {filters.type.replace('_', ' ')}
              </span>
            )}
            {filters.severity && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                Severity: {filters.severity}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <motion.div
            key={report._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {report.reportNumber}
                    </h3>
                    {getStatusIcon(report.status)}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                      {report.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(report.observationType)}`}>
                      {report.observationType.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(report.severity)}`}>
                      {report.severity.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {report.description}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        {format(new Date(report.observationDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{report.plantId?.name}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{report.observer?.name}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{report.location?.area}</span>
                    </div>
                  </div>

                  {/* Corrective Actions Summary */}
                  {report.correctiveActions && report.correctiveActions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-4 text-xs">
                        <span className="text-gray-500">
                          Actions: {report.correctiveActions.length}
                        </span>
                        <span className="text-green-600">
                          Completed: {report.correctiveActions.filter(a => a.status === 'completed').length}
                        </span>
                        <span className="text-yellow-600">
                          Pending: {report.correctiveActions.filter(a => a.status === 'pending').length}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    as={Link}
                    to={`/bbs/observations/${report._id}`}
                    variant="secondary"
                    size="sm"
                    icon={Eye}
                  >
                    View
                  </Button>
                  
                  {/* Role-based action buttons */}
                  {(report.status === 'open' && ['hod', 'plant_head', 'safety_incharge'].includes(user?.role || '')) && (
                    <Button
                      as={Link}
                      to={`/bbs/observations/${report._id}/review`}
                      variant="primary"
                      size="sm"
                    >
                      Review
                    </Button>
                  )}
                  
                  {(report.status === 'approved' && report.correctiveActions?.some(action => action.assignedTo?._id === user?._id)) && (
                    <Button
                      as={Link}
                      to={`/bbs/observations/${report._id}/complete`}
                      variant="warning"
                      size="sm"
                    >
                      Complete
                    </Button>
                  )}
                  
                  {(report.status === 'pending_closure' && ['safety_incharge', 'plant_head'].includes(user?.role || '')) && (
                    <Button
                      as={Link}
                      to={`/bbs/observations/${report._id}/approve`}
                      variant="success"
                      size="sm"
                    >
                      Approve Closure
                    </Button>
                  )}

                  {/* Edit button for report owner or authorized roles */}
                  {((report.observer?._id === user?._id && report.status === 'open') || 
                    ['plant_head', 'safety_incharge'].includes(user?.role || '')) && (
                    <Button
                      as={Link}
                      to={`/bbs/observations/${report._id}/edit`}
                      variant="secondary"
                      size="sm"
                      icon={Edit}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && reports.length === 0 && (
        <Card className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No observations found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filters.search || filters.status || filters.type ? 
              'Try adjusting your filters or search terms.' :
              'Start by creating your first BBS observation report.'
            }
          </p>
          <div className="flex justify-center space-x-3">
            {(filters.search || filters.status || filters.type) && (
              <Button onClick={resetFilters} variant="secondary">
                Clear Filters
              </Button>
            )}
            <Button
              as={Link}
              to="/bbs/observations/new"
              variant="primary"
              icon={Plus}
            >
              Create Observation
            </Button>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages} ({total} total observations)
          </div>
          <nav className="flex items-center justify-center space-x-2">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="secondary"
              size="sm"
            >
              Previous
            </Button>
            
            {/* Page numbers */}
            {[...Array(Math.min(totalPages, 5))].map((_, index) => {
              const pageNumber = Math.max(1, currentPage - 2) + index;
              if (pageNumber > totalPages) return null;
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === pageNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              variant="secondary"
              size="sm"
            >
              Next
            </Button>
          </nav>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && reports.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <LoadingSpinner />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading observations...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BBSObservationList;