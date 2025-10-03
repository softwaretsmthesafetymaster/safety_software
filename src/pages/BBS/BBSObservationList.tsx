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
  TrendingUp
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { bbsService, BBSReport } from '../../services/bbs/bbsService';
import { reportService } from '../../services/bbs/reportService';
import { aiService } from '../../services/bbs/aiService';
import { format } from 'date-fns';

interface Filters {
  status: string;
  type: string;
  severity: string;
  plantId: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

const BBSObservationList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { plants } = useAppSelector((state) => state.plant);
  const { currentCompany } = useAppSelector((state) => state.company);
  
  const [reports, setReports] = useState<BBSReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [filters, setFilters] = useState<Filters>({
    status: '',
    type: '',
    severity: '',
    plantId: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  useEffect(() => {
    fetchReports();
  }, [currentPage, filters]);

  useEffect(() => {
    if (reports.length > 0) {
      generateAIInsights();
    }
  }, [reports]);

  const fetchReports = async () => {
    if (!user?.companyId) return;
    
    try {
      setLoading(true);
      const response = await bbsService.getBBSReports(user.companyId, {
        page: currentPage,
        limit: 10,
        ...filters
      });
      
      setReports(response.reports);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching BBS reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async () => {
    try {
      const insights = await aiService.generateSafetyInsights(reports);
      setAiInsights(insights);
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      severity: '',
      plantId: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const downloadAllReports = async (format: 'pdf' | 'excel') => {
    try {
      if (format === 'excel') {
        reportService.downloadExcel(reports, currentCompany);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

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

  if (loading && reports.length === 0) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            BBS Observations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage behavioral safety observations and track actions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            icon={Download}
            onClick={() => downloadAllReports('excel')}
          >
            Export
          </Button>
          <Button
            variant="secondary"
            icon={Filter}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
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

      {/* AI Insights */}
      {aiInsights && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Safety Insights
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Trend Analysis</h4>
              <p className={`text-sm px-3 py-1 rounded-full inline-flex items-center ${
                aiInsights.trend === 'improving' ? 'bg-green-100 text-green-800' :
                aiInsights.trend === 'declining' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {aiInsights.trend.charAt(0).toUpperCase() + aiInsights.trend.slice(1)}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Key Focus Areas</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400">
                {aiInsights.keyAreas.slice(0, 3).map((area: string, index: number) => (
                  <li key={index}>• {area}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Top Recommendation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {aiInsights.recommendations[0]}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Filter Observations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Search reports..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plant
              </label>
              <select
                value={filters.plantId}
                onChange={(e) => handleFilterChange('plantId', e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">All Plants</option>
                {plants.map((plant) => (
                  <option key={plant._id} value={plant._id}>
                    {plant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="secondary" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Reports List */}
      <div className="grid grid-cols-1 gap-4">
        {reports.map((report) => (
          <motion.div
            key={report._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {report.reportNumber}
                    </h3>
                    {getStatusIcon(report.status)}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(report.observationType)}`}>
                      {report.observationType.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      report.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      report.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      report.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {report.severity.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {report.description}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(report.observationDate), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {report.plantId?.name}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {report.observer?.name}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {report.location.area}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    as={Link}
                    to={`/bbs/observations/${report._id}`}
                    variant="secondary"
                    size="sm"
                    icon={Eye}
                  >
                    View
                  </Button>
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
                  {(report.status === 'approved' && report.correctiveActions?.some(action => action.assignedTo?._id === user?.id)) && (
                    <Button
                      as={Link}
                      to={`/bbs/observations/${report._id}/complete`}
                      variant="success"
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
            Start by creating your first BBS observation report.
          </p>
          <Button
            as={Link}
            to="/bbs/observations/new"
            variant="primary"
            icon={Plus}
          >
            Create Observation
          </Button>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex items-center space-x-2">
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === index + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default BBSObservationList;