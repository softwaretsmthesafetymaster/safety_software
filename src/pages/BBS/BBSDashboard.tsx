import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppDispatch } from '../../hooks/redux';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Building,
  Eye,
  Plus,
  Download,
  Filter,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Table,
  Map,
  BookOpen,
  Gamepad2,
  Settings,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';
import { useAppSelector } from '../../hooks/redux';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { bbsService, BBSStats } from '../../services/bbs/bbsDashboardService';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { getArea } from '../../store/slices/plantSlice';

interface DashboardFilters {
  plantIds: string[];
  dateRange: {
    start: string;
    end: string;
  };
  areas: string[];
  types: string[];
  timeRange: '7d' | '30d' | '90d' | '12m' | 'custom';
}

interface ChartData {
  trends: any[];
  typeDistribution: any[];
  severityDistribution: any[];
  monthlyTrends: any[];
  plantComparison: any[];
  areaAnalysis: any[];
  statusDistribution: any[];
}

const BBSDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { plants } = useAppSelector((state) => state.plant);
  const { currentCompany } = useAppSelector((state) => state.company);
  const dispatch = useAppDispatch();
  
  const [stats, setStats] = useState<BBSStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [availableAreas, setAvailableAreas] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  const [filters, setFilters] = useState<DashboardFilters>({
    plantIds: user?.role === 'plant_head' ? [user.plantId] : [],
    dateRange: {
      start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    areas: [],
    types: [],
    timeRange: '30d'
  });

  // Get available plants based on user role
  const getAvailablePlants = () => {
    if (user?.role === 'company_owner') {
      return plants;
    } else if (user?.role === 'plant_head') {
      return plants.filter(plant => plant._id === user.plantId);
    }
    return plants.filter(plant => plant._id === user?.plantId);
  };

 useEffect(() => {
  const loadAreas = async () => {
    if (filters.plantIds.length === 0) {
      setAvailableAreas([]);
      return;
    }

    const allAreas = [];
    // Fetch areas for each selected plant
    for (const plantId of filters.plantIds) {
      const res = await dispatch(
        getArea({ companyId: user?.companyId, plantId: plantId })
      ).unwrap();
      if (res) {
        allAreas.push(
          ...res.map((area: any) => ({ ...area}))
        );
      }
    }
    setAvailableAreas(allAreas);
  };

  loadAreas();
}, [filters.plantIds, user?.companyId, dispatch]);


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
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    if (!user?.companyId) return;
    
    try {
      setFilterLoading(true);
      
      const queryParams = {
        plantIds: filters.plantIds.join(','),
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        areas: filters.areas.join(','),
        types: filters.types.join(',')
      };

      // Remove empty parameters
      Object.keys(queryParams).forEach(key => {
        if (!queryParams[key]) delete queryParams[key];
      });

      const [dashboardStats, trendsData, recentData] = await Promise.all([
        bbsService.getBBSStats(user.companyId, queryParams),
        bbsService.getBBSTrends(user.companyId, queryParams),
        bbsService.getRecentReports(user.companyId, queryParams)
      ]);
      setStats(dashboardStats);
      setChartData(trendsData);
      setRecentReports(recentData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  };

  const handleFilterChange = (filterType: keyof DashboardFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      plantIds: user?.role === 'plant_head' ? [user.plantId] : [],
      dateRange: {
        start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
      },
      areas: [],
      types: [],
      timeRange: '30d'
    });
  };

  const statCards = [
    {
      title: 'Total Observations',
      value: stats?.total || 0,
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      change: stats?.totalChange || '+0%',
      changeType: stats?.totalChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Open Items',
      value: stats?.open || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      change: stats?.openChange || '+0%',
      changeType: stats?.openChange?.startsWith('-') ? 'positive' : 'negative'
    },
    {
      title: 'Closed Items',
      value: stats?.closed || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      change: stats?.closedChange || '+0%',
      changeType: stats?.closedChange?.startsWith('+') ? 'positive' : 'negative'
    },
    {
      title: 'Safe Behaviors',
      value: stats?.safeBehaviors || 0,
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
      change: stats?.safeBehaviorsChange || '+0%',
      changeType: stats?.safeBehaviorsChange?.startsWith('+') ? 'positive' : 'negative'
    }
  ];

  const pieData = [
    { name: 'Unsafe Acts', value: stats?.unsafeActs || 0, color: '#DC2626' },
    { name: 'Unsafe Conditions', value: stats?.unsafeConditions || 0, color: '#EA580C' },
    { name: 'Safe Behaviors', value: stats?.safeBehaviors || 0, color: '#059669' }
  ];

  const severityData = [
    { name: 'Critical', value: stats?.criticalCount || 0, color: '#991B1B' },
    { name: 'High', value: stats?.highCount || 0, color: '#DC2626' },
    { name: 'Medium', value: stats?.mediumCount || 0, color: '#EA580C' },
    { name: 'Low', value: stats?.lowCount || 0, color: '#65A30D' }
  ];

  if (loading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            BBS Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Behavioral Based Safety insights and analytics
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
            Filters
          </Button>
          
          <Button
            onClick={fetchDashboardData}
            variant="secondary"
            icon={RefreshCw}
            disabled={filterLoading}
          >
            Refresh
          </Button>
          
          <Button
            as={Link}
            to="/bbs/coaching"
            variant="secondary"
            icon={BookOpen}
          >
            Coaching
          </Button>
          
          <Button
            as={Link}
            to="/bbs/games"
            variant="secondary"
            icon={Gamepad2}
          >
            Games
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

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dashboard Filters
            </h3>
            <Button onClick={resetFilters} variant="secondary" size="sm">
              Reset All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  {plants.map((plant) => (
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
                  <option key={`${area.plantId.name}-${area.name}`} value={area.name}>
                    {area.name}  ({area?.plantId?.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Observation Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observation Types
              </label>
              <div className="space-y-2">
                {[
                  { value: 'unsafe_act', label: 'Unsafe Acts' },
                  { value: 'unsafe_condition', label: 'Unsafe Conditions' },
                  { value: 'safe_behavior', label: 'Safe Behaviors' }
                ].map(type => (
                  <label key={type.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.types.includes(type.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleFilterChange('types', [...filters.types, type.value]);
                        } else {
                          handleFilterChange('types', filters.types.filter(t => t !== type.value));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value.toLocaleString()}
                  </p>
                  {stat.change !== '+0%' && (
                    <div className={`flex items-center mt-2 ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.changeType === 'positive' ? 
                        <TrendingUp className="h-4 w-4 mr-1" /> : 
                        <TrendingDown className="h-4 w-4 mr-1" />
                      }
                      <span className="text-sm font-medium">{stat.change}</span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Observation Trends */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Observation Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData?.trends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="observations" 
                stackId="1"
                stroke="#2563EB" 
                fill="#3B82F6"
                fillOpacity={0.6}
                name="Observations"
              />
              <Area 
                type="monotone" 
                dataKey="actions" 
                stackId="1"
                stroke="#059669" 
                fill="#10B981"
                fillOpacity={0.6}
                name="Actions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Observation Types Distribution */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Observation Types
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Severity Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Trends */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Monthly Comparison
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData?.monthlyTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#3B82F6" name="Total Observations" />
              <Line type="monotone" dataKey="closed" stroke="#10B981" name="Closed" />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>

      

      {/* Recent Observations */}
      <Card className="p-6">
  {/* Card Header (Remains the same as it is already responsive) */}
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
      Recent Observations
    </h2>
    <Button as={Link} to="/bbs/observations" variant="secondary" size="sm">
      View All
    </Button>
  </div>

  {/* Reports List */}
  {recentReports && recentReports.length > 0 ? (
    <div className="space-y-4">
      {recentReports.map((report) => (
        <div 
          key={report._id} 
          // Default: Stacked (flex-col) on mobile. sm: Switches to horizontal flex.
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 space-y-3 sm:space-y-0"
        >
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 pr-0 sm:pr-4"> {/* min-w-0 prevents overflow */}
            
            {/* Report Badges (Report Number, Type, Severity) */}
            {/* Default: Flex wrap for smaller screens. */}
            <div className="flex flex-wrap items-center gap-2"> 
              <span className="font-medium text-gray-900 dark:text-white">
                {report.reportNumber}
              </span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                report.observationType === 'safe_behavior' ? 'bg-green-100 text-green-800' :
                report.observationType === 'unsafe_act' ? 'bg-red-100 text-red-800' :
                'bg-orange-100 text-orange-800'
              }`}>
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

            {/* Secondary Info (Plant, Location, Observer, Date) */}
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
              {report.plantId?.name} • {report.location?.area} • {report.observer?.name} • {format(new Date(report.observationDate), 'MMM dd, yyyy')}
            </p>

            {/* Description */}
            {/* Use line-clamp utility if available, otherwise substring is fine. */}
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              {report.description?.substring(0, 100)}...
            </p>
          </div>

          {/* Status and Action Buttons */}
          {/* Default: Flex wrap for smaller screens. sm: Switches to horizontal flex with minimal space. */}
          <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0 sm:ml-auto">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              report.status === 'closed' ? 'bg-green-100 text-green-800' :
              report.status === 'open' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {report.status.toUpperCase()}
            </span>
            <Button
              as={Link}
              to={`/bbs/observations/${report._id}`}
              variant="secondary"
              size="sm"
              icon={Eye}
            >
              View
            </Button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-8">
      <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-400">
        No observations found for the selected filters.
      </p>
    </div>
  )}
</Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <Plus className="h-8 w-8 text-blue-600 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Report Observation
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Submit a new behavioral safety observation
          </p>
          <Button as={Link} to="/bbs/observations/new" variant="primary" className="w-full">
            Create Report
          </Button>
        </Card>

        <Card className="p-6 text-center">
          <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-green-600 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Analytics & Reports
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            View detailed analytics and generate reports
          </p>
          <Button as={Link} to="/bbs/analytics" variant="secondary" className="w-full">
            View Analytics
          </Button>
        </Card>

        <Card className="p-6 text-center">
          <div className="bg-purple-100 dark:bg-purple-900/20 rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-purple-600 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Safety Resources
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Access coaching materials and learning resources
          </p>
          <Button as={Link} to="/bbs/coaching" variant="secondary" className="w-full">
            Learn More
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default BBSDashboard;