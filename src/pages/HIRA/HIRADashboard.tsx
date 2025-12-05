import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  FileText,
  Users,
  CheckCircle,
  Clock,
  Plus,
  Bolt,
  XCircle,
  UserCheck,
  Target,
  Building2,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Activity,
  PieChart,
  ArrowUp,
  ArrowDown,
  Eye,
  Settings,
  Bell,
  Search
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchHIRAStats } from '../../store/slices/hiraSlice';
import { fetchPlants } from '../../store/slices/plantSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { format } from 'date-fns';
import Chart from 'react-apexcharts';
import { downloadDashboardPDF } from '../../services/downloadDashboard';

interface RiskDistributionItem {
  name: string;
  count: number;
}

interface RiskTrendItem {
  month: string;
  high: number;
  moderate: number;
  low: number;
}

interface HIRAStats {
  totalAssessments: number;
  inProgressAssessments: number;
  completedAssessments: number;
  approvedAssessments: number;
  assignedAssessments: number;
  closedAssessments: number;
  highRiskItems: number;
  openActions: number;
  overdueActions: number;
  inProgressActions: number;
  completedActions: number;
  avgClosureTime: string;
  recentAssessments: any[];
  charts: {
    riskDistribution: RiskDistributionItem[];
    riskTrend: RiskTrendItem[];
    statusDistribution: any[];
    plantSummary: any[];
    assessorPerformance: any[];
    hazardFrequency: any[];
    significanceSummary: any[];
  };
}

const HIRADashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats, isLoading, error } = useAppSelector((state) => state.hira) as {
    stats: HIRAStats | null;
    isLoading: boolean;
    error: string | null;
  };

  const { plants } = useAppSelector((state) => state.plant);

  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedPlant, setSelectedPlant] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('assessments');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [exportLoading, setExportLoading] = useState(false);

  const fetchData = useCallback(() => {
    if (user?.companyId) {
      const plantIdFilter = user?.role === 'superadmin' ? selectedPlant : (user?.plant?._id || 'all');

      dispatch(fetchHIRAStats({
        companyId: user.companyId,
        period: selectedPeriod,
        plantId: plantIdFilter,
      })).then(() => {
        setLastUpdated(new Date());
      });
    }
  }, [dispatch, user, selectedPeriod, selectedPlant]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (user?.role === "superadmin") {
      dispatch(fetchPlants());
    } else if (user?.plant?._id) {
      setSelectedPlant(user.plant._id);
    }
  }, [dispatch, user]);

  const refreshData = () => {
    fetchData();
  };

  

  const statCards = useMemo(() => ([
    {
      title: 'Total Assessments',
      value: stats?.totalAssessments || 0,
      icon: FileText,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      // change: '+12%',
      // changeType: 'increase' as const,
      description: `Total assessments in ${selectedPeriod}`,
      path: '/hira/assessments'
    },
    {
      title: 'In Progress',
      value: stats?.inProgressAssessments || 0,
      icon: Clock,
      color: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      // change: '-5%',
      // changeType: 'decrease' as const,
      description: 'Currently being completed',
      path: '/hira/assessments?status=in_progress'
    },
    {
      title: 'High Risk Items',
      value: stats?.highRiskItems || 0,
      icon: AlertTriangle,
      color: 'bg-gradient-to-r from-red-500 to-red-600',
      // change: '+8%',
      // changeType: 'increase' as const,
      description: 'Requiring immediate attention',
      path: '/hira/assessments?riskLevel=high'
    },
    {
      title: 'Actions Open',
      value: stats?.openActions || 0,
      icon: Target,
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      // change: '+3%',
      // changeType: 'increase' as const,
      description: 'Action items pending closure',
      // path: '/hira/assessments/actions?status=open'
    },
    {
      title: 'Avg Closure Time',
      value: `${stats?.avgClosureTime || '0'} days`,
      icon: Activity,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      // change: '-2 days',
      // changeType: 'decrease' as const,
      description: 'Average time to close',
      // path: '/hira/analytics'
    },
    {
      title: 'Approved',
      value: stats?.approvedAssessments || 0,
      icon: CheckCircle,
      color: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      // change: '+15%',
      // changeType: 'increase' as const,
      description: 'Ready for action planning',
      path: '/hira/assessments?status=approved'
    },
    {
      title: 'Actions Overdue',
      value: stats?.overdueActions || 0,
      icon: XCircle,
      color: 'bg-gradient-to-r from-pink-500 to-pink-600',
      // change: '+2',
      // changeType: 'increase' as const,
      description: 'Action items past due date',
      // path: '/hira/actions?status=overdue'
    },
    {
      title: 'Closed',
      value: stats?.closedAssessments || 0,
      icon: FileText,
      color: 'bg-gradient-to-r from-gray-500 to-gray-600',
      // change: '+20%',
      // changeType: 'increase' as const,
      description: 'Fully completed and archived',
      path: '/hira/assessments?status=closed'
    }
  ]), [stats, selectedPeriod]);

  // Chart configurations
  const riskDistributionChart = useMemo(() => {
    const data = stats?.charts?.riskDistribution || [];
    return {
      options: {
        chart: {
          type: 'donut' as const,
          toolbar: { show: false },
        },
        colors: ['#DC2626', '#EA580C', '#CA8A04', '#16A34A', '#2563EB'],
        labels: data.map(item => item.name),
        legend: {
          position: 'bottom' as const,
        },
        dataLabels: {
          enabled: true,
          formatter: (val: number) => `${val.toFixed(0)}%`
        },
        responsive: [{
          breakpoint: 480,
          options: {
            chart: { width: 200 },
            legend: { position: 'bottom' }
          }
        }]
      },
      series: data.map(item => item.count)
    };
  }, [stats?.charts?.riskDistribution]);

  const riskTrendChart = useMemo(() => {
    const trendData = stats?.charts?.riskTrend || [];
    const processedData = trendData.reduce((acc: any, curr) => {
      const month = curr.month;
      if (!acc[month]) {
        acc[month] = { month, high: 0, moderate: 0, low: 0 };
      }
      if (curr.risk === 'High' || curr.risk === 'Very High') {
        acc[month].high += curr.count || 0;
      } else if (curr.risk === 'Moderate') {
        acc[month].moderate += curr.count || 0;
      } else {
        acc[month].low += curr.count || 0;
      }
      return acc;
    }, {});

    const chartData = Object.values(processedData) as any[];

    return {
      options: {
        chart: {
          type: 'bar' as const,
          stacked: true,
          toolbar: { show: true },
        },
        colors: ['#DC2626', '#F59E0B', '#10B981'],
        xaxis: {
          categories: chartData.map(d => d.month)
        },
        legend: {
          position: 'top' as const,
        },
        responsive: [{
          breakpoint: 600,
          options: {
            plotOptions: {
              bar: { horizontal: false }
            }
          }
        }]
      },
      series: [
        {
          name: 'High Risk',
          data: chartData.map(d => d.high)
        },
        {
          name: 'Moderate Risk',
          data: chartData.map(d => d.moderate)
        },
        {
          name: 'Low Risk',
          data: chartData.map(d => d.low)
        }
      ]
    };
  }, [stats?.charts?.riskTrend]);

  const actionSummary = useMemo(() => {
    const overdue = stats?.overdueActions || 0;
    const open = stats?.openActions || 0;
    const inProgress = stats?.inProgressActions || 0;
    const completed = stats?.completedActions || 0;
    const total = open + inProgress + completed + overdue;

    return {
      overdue,
      open,
      inProgress,
      completed,
      total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [stats]);

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading HIRA Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"
        >
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  HIRA Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Hazard Identification & Risk Assessment Analytics
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <select
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                disabled={isLoading}
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>

              {user?.role === "superadmin" && (
                <select
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={selectedPlant}
                  onChange={(e) => setSelectedPlant(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="all">All Plants</option>
                  {plants.map((plant: any) => (
                    <option key={plant._id} value={plant._id}>{plant.name}</option>
                  ))}
                </select>
              )}

              <Button
                variant="ghost"
                icon={RefreshCw}
                onClick={refreshData}
                disabled={isLoading}
                size="sm"
                className={isLoading ? 'animate-spin' : ''}
              />
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button className='bg-gray-900 hover:bg-gray-600 text-white py-2 px-4 rounded-lg dark:bg-gray-800 dark:hover:bg-gray-700' 
              onClick={() =>
    downloadDashboardPDF(stats, {
      statusChart: document.getElementById("statusChart")?.toDataURL("image/png"),
      riskChart: document.getElementById("riskChart")?.toDataURL("image/png"),
      hazardChart: document.getElementById("hazardChart")?.toDataURL("image/png"),
    })
  }
>
                Export
              </button>
            </div>

            {/* New Assessment Button */}
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <Button
                as={Link}
                to="/hira/create"
                variant="primary"
                icon={Plus}
                className="w-full sm:w-auto"
              >
                New Assessment
              </Button>
            )}
          </div>
        </motion.div>

        {/* Loading/Error States */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 dark:text-red-200">Error loading dashboard: {error}</span>
            </div>
          </motion.div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="cursor-pointer"
            >
              <Link to={stat.path}>
                <Card className="p-6 overflow-hidden relative transition-all hover:shadow-xl border-l-4 border-transparent hover:border-blue-500 dark:border-transparent dark:hover:border-blue-600">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                      </p>
                      
                    
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${stat.color} shadow-lg`}>
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Risk Trend Chart */}
          <div className="xl:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Risk Trends Over Time
                </h2>
                
              </div>

              <div className="h-80">
                {riskTrendChart.series[0]?.data?.length > 0 ? (
                  <Chart
                    options={riskTrendChart.options}
                    series={riskTrendChart.series}
                    type="bar"
                    height="100%"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No trend data available</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Risk Distribution Chart */}
          <div>
            <Card className="p-6 h-full">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Risk Distribution
              </h2>

              <div className="h-80 flex items-center justify-center">
                {riskDistributionChart.series.length > 0 ? (
                  <Chart
                    options={riskDistributionChart.options}
                    series={riskDistributionChart.series}
                    type="donut"
                    height="100%"
                  />
                ) : (
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No distribution data</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Secondary Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Assessments */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Recent Assessments
              </h2>
              <Link
                to="/hira/assessments"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {stats?.recentAssessments?.slice(0, 5).map((assessment: any, index: number) => (
                <motion.div
                  key={assessment._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer group"
                  onClick={() => window.location.href = `/hira/assessments/${assessment._id}`}
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {assessment.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {assessment.plantId?.name || 'N/A'}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {assessment.assessor?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium capitalize ${
                      assessment.status === 'approved'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : assessment.status === 'completed'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : assessment.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {assessment.status.replace('_', ' ')}
                    </span>
                  </div>
                </motion.div>
              )) || (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent assessments available</p>
                </div>
              )}
            </div>
          </Card>

          {/* Action Items Overview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Action Items Overview
              </h2>
              {/* <Link
                to="/hira/actions"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                Manage actions
              </Link> */}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                    <div>
                      <div className="text-2xl font-bold text-red-600">{actionSummary.overdue}</div>
                      <div className="text-sm text-red-700 dark:text-red-300">Overdue</div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-8 w-8 text-yellow-500" />
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{actionSummary.open}</div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">Open</div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-8 w-8 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{actionSummary.inProgress}</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">In Progress</div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">{actionSummary.completed}</div>
                      <div className="text-sm text-green-700 dark:text-green-300">Completed</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Completion Rate</h4>
                    <p className="text-2xl font-bold text-purple-600">{actionSummary.completionRate}%</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Actions</div>
                    <div className="flex items-center text-blue-600 text-sm justify-end">
                      <Target className="h-4 w-4 mr-1" />
                      {actionSummary.total}
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${actionSummary.completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Bolt className="h-5 w-5 mr-2" />
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <Button
                as={Link}
                to="/hira/create"
                variant="primary"
                icon={Plus}
                className="w-full justify-start text-left h-auto py-4"
              >
                <div>
                  <div className="font-medium">Create Assessment</div>
                  <div className="text-xs opacity-75">Start new HIRA process</div>
                </div>
              </Button>
            )}

            <Button
              as={Link}
              to="/hira/assessments?status=completed"
              variant="secondary"
              icon={CheckCircle}
              className="w-full justify-start text-left h-auto py-4"
            >
              <div>
                <div className="font-medium">Pending Approvals</div>
                <div className="text-xs opacity-75">{stats?.completedAssessments || 0} waiting</div>
              </div>
            </Button>

            <Button
              as={Link}
              to="/hira/assessments?status=actions_assigned"
              variant="secondary"
              icon={UserCheck}
              className="w-full justify-start text-left h-auto py-4"
            >
              <div>
                <div className="font-medium">My Actions</div>
                <div className="text-xs opacity-75">View assigned items</div>
              </div>
            </Button>

            {/* <Button
              as={Link}
              to="/hira/reports"
              variant="secondary"
              icon={FileText}
              className="w-full justify-start text-left h-auto py-4"
            >
              <div>
                <div className="font-medium">Generate Reports</div>
                <div className="text-xs opacity-75">Analytics & insights</div>
              </div>
            </Button> */}
          </div>
        </Card>

        {/* Footer Info */}
        {/* <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Last updated: {lastUpdated ? format(lastUpdated, 'MMM dd, yyyy HH:mm:ss') : 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Building2 className="h-4 w-4" />
                <span>{plants.length} plants monitored</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{stats?.charts?.assessorPerformance?.length || 0} assessors</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2 sm:mt-0">
              Data refreshes every 5 minutes
            </div>
          </div>
        </Card> */}
      </div>
    </div>
  );
};

export default HIRADashboard;