import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Users,
  BarChart3,
  PieChart,
  Activity,
  Zap, // For High Risk
  Lock, // For Closed
  BookOpen // For Draft
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchPermitStats, fetchPermits } from '../../store/slices/permitSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { format, subMonths, getMonth, getYear } from 'date-fns';

// Helper function to format month data for the chart
const formatMonthlyTrendData = (monthlyData, monthsCount = 6) => {
  const currentMonth = new Date();
  const dataMap = new Map();

  // Populate map with data from backend
  monthlyData.forEach(item => {
    // Assuming item.month is in 'MMM yyyy' format, but it's safer to rely on actual date logic if possible
    // For now, we'll parse the 'Dec 2025' format
    const [monthName, year] = item.month.split(' ');
    const date = new Date(`${monthName} 01, ${year}`);
    const key = format(date, 'MMM yyyy');
    dataMap.set(key, { 
      month: key, 
      active: item.active || 0, 
      completed: item.completed || 0,
      permits: item.total || 0, // Assuming 'total' is the sum of all activities/permits for the month
    });
  });

  // Generate the last 6 months structure
  const lastSixMonths = [];
  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = subMonths(currentMonth, i);
    const key = format(date, 'MMM yyyy');
    
    // Use data from the map if available, otherwise default to 0
    const data = dataMap.get(key) || {
      month: key,
      permits: 0,
      active: 0,
      completed: 0,
    };
    
    // If data is from the map, ensure it's structured correctly
    if (dataMap.has(key)) {
       lastSixMonths.push(data);
    } else {
       lastSixMonths.push(data);
    }
  }
  
  return lastSixMonths;
};


const PermitDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  // Destructure relevant stats fields for easier use
  const { stats, permits, isLoading } = useAppSelector((state) => state.permit);
  
  // Destructure stats for readability and safety
  const { 
    total = 0, 
    active = 0, 
    pending = 0, 
    expired = 0, 
    closed = 0, 
    draft = 0, 
    highRisk = 0, 
    thisMonth = 0, 
    lastMonth = 0,
    monthlyData = [],
    growth = "0"
  } = stats || {};


  useEffect(() => {
    const loadDashboardData = async () => {
      if (user?.companyId) {
        try {
          // Fetch stats and recent permits
          await Promise.all([
            dispatch(fetchPermitStats(user.companyId)),
            dispatch(fetchPermits({
              companyId: user.companyId,
              limit: 10,
              sortBy: 'createdAt',
              sortOrder: 'desc'
            }))
          ]);
        } catch (error) {
          toast.error('Failed to load dashboard data');
        }
      }
    };

    loadDashboardData();
  }, [dispatch, user?.companyId]);

  // Calculate permit type distribution from stats.typeDistribution if available, fallback to recent permits
  const permitTypeData = React.useMemo(() => {
    if (stats?.typeDistribution && stats.typeDistribution.length > 0) {
      const totalCount = stats.typeDistribution.reduce((sum, item) => sum + item.count, 0);
      return stats.typeDistribution.map(item => ({
        type: item.type.replace('_', ' ').toUpperCase(),
        count: item.count,
        percentage: totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : '0.0'
      }));
    }

    // Fallback to calculation from recent permits (original logic)
    if (!permits || permits.length === 0) return [];

    const typeCount: { [key: string]: number } = {};
    permits.forEach((permit) => {
      permit.types?.forEach((type: string) => {
        const displayType = type.replace('_', ' ').toUpperCase();
        typeCount[displayType] = (typeCount[displayType] || 0) + 1;
      });
    });

    return Object.entries(typeCount).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / permits.length) * 100).toFixed(1)
    }));
  }, [permits, stats?.typeDistribution]);

  // Status distribution data with colors (using stats.statusDistribution if available)
  const statusData = React.useMemo(() => {
    if (stats?.statusDistribution && stats.statusDistribution.length > 0) {
        const colorMap = {
            'submitted': '#f59e0b', // Pending/Submitted
            'closed': '#6b7280', // Closed
            'rejected': '#ef4444', // Rejected/Expired
            'active': '#10b981', // Active
            // Add other statuses as needed
        };
        const iconMap = {
             'submitted': Clock,
             'closed': FileText,
             'rejected': XCircle,
             'active': CheckCircle,
        };

        return stats.statusDistribution.map(item => ({
            name: item.name.charAt(0).toUpperCase() + item.name.slice(1), // Capitalize first letter
            value: item.value,
            color: colorMap[item.name] || '#3b82f6', // Default blue
            icon: iconMap[item.name] || FileText
        }));
    }
    
    // Fallback using direct stats counts (original logic)
    return [
      { name: 'Active', value: active, color: '#10b981', icon: CheckCircle },
      { name: 'Pending', value: pending, color: '#f59e0b', icon: Clock },
      { name: 'Expired', value: expired, color: '#ef4444', icon: XCircle },
      { name: 'Closed', value: closed, color: '#6b7280', icon: FileText },
    ];
  }, [stats]);


  // Monthly trend data (using backend monthlyData)
  const monthlyTrendData = React.useMemo(() => {
    // Format the backend data for the last 6 months
    return formatMonthlyTrendData(monthlyData);
  }, [monthlyData]);

  // Function to calculate trend for summary cards
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { trend: current > 0 ? '+100%' : '0%', trendUp: current > 0 };
    const percentage = ((current - previous) / previous) * 100;
    const sign = percentage >= 0 ? '+' : '';
    const trendUp = percentage >= 0;
    return { trend: `${sign}${percentage.toFixed(0)}%`, trendUp };
  };
  
  // Trend for total permits (This Month vs Last Month)
  const totalPermitTrend = calculateTrend(thisMonth, lastMonth);
  // Trend for high risk (assuming growth is for High Risk for now as per provided data structure)
  // NOTE: In a real app, 'growth' should be mapped to the metric it represents. Assuming it's the general 'Total' permit growth vs last period.
  const overallTrendValue = parseFloat(growth);
  const overallTrend = {
    trend: `${overallTrendValue >= 0 ? '+' : ''}${overallTrendValue.toFixed(1)}%`,
    trendUp: overallTrendValue >= 0,
  };


  // Updated Dashboard stats cards
  const dashboardStats = React.useMemo(() => [
    {
      title: 'Total Permits',
      value: total,
      icon: FileText,
      color: 'bg-blue-500',
      trend: overallTrend.trend,
      trendUp: overallTrend.trendUp,
      description: 'All-time total permits'
    },
    {
      title: 'This Month',
      value: thisMonth,
      icon: Calendar,
      color: 'bg-indigo-500',
      trend: totalPermitTrend.trend,
      trendUp: totalPermitTrend.trendUp,
      description: 'Permits created this month vs last'
    },
    {
      title: 'Active Permits',
      value: active,
      icon: CheckCircle,
      color: 'bg-green-500',
      trend: '+0%', // Dynamic trend unavailable in provided stats.active
      trendUp: true,
      description: 'Currently active work'
    },
    {
      title: 'Pending Approval',
      value: pending,
      icon: Clock,
      color: 'bg-yellow-500',
      trend: '+0%', // Dynamic trend unavailable in provided stats.pending
      trendUp: true,
      description: 'Awaiting approval'
    },
    // New cards based on backend data:
    {
      title: 'High Risk',
      value: highRisk,
      icon: Zap,
      color: 'bg-red-600',
      trend: '+0%', // Dynamic trend unavailable
      trendUp: true,
      description: 'Permits flagged as high risk'
    },
    {
      title: 'Closed Permits',
      value: closed,
      icon: Lock,
      color: 'bg-gray-500',
      trend: '+0%', // Dynamic trend unavailable
      trendUp: false,
      description: 'Permits successfully closed'
    },
    {
      title: 'Draft Permits',
      value: draft,
      icon: BookOpen,
      color: 'bg-purple-500',
      trend: '-0%', // Dynamic trend unavailable
      trendUp: false,
      description: 'Incomplete drafts saved'
    },
    {
      title: 'Expired Permits',
      value: expired,
      icon: XCircle,
      color: 'bg-red-500',
      trend: '-0%', // Dynamic trend unavailable
      trendUp: false,
      description: 'Requires attention'
    },
  ], [stats, totalPermitTrend, overallTrend]);

  // Priority actions based on permit status
  const priorityActions = React.useMemo(() => {
    const actions = [];
    
    if (highRisk > 0) {
        actions.push({
            message: `${highRisk} high-risk permits active`,
            type: 'error',
            action: 'Review High Risk',
            link: '/ptw/permits?highRisk=true',
            icon: Zap
        });
    }

    if (expired > 0) {
      actions.push({
        message: `${expired} permits have expired`,
        type: 'error',
        action: 'Review Expired',
        link: '/ptw/permits?status=expired',
        icon: XCircle
      });
    }

    if (pending > 0) {
      actions.push({
        message: `${pending} permits pending approval`,
        type: 'warning',
        action: 'Review Pending',
        link: '/ptw/permits?status=submitted',
        icon: Clock
      });
    }
    
    return actions;
  }, [expired, pending, highRisk]);

  if (isLoading && !stats) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Permit to Work Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and monitor work permits across your facility
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link to="/ptw/permits">
            <Button variant="secondary" icon={FileText}>
              View All Permits
            </Button>
          </Link>

          <Link to="/ptw/permits/new">
            <Button variant="primary" icon={Plus}>
              New Permit
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid - Changed to 4 columns for 8 cards or more */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex flex-col flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stat.description}
                  </p>
                  
                </div>
                <div className={`p-3 rounded-lg ${stat.color} ml-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends - Updated to use backend monthlyData */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Monthly Permit Trends
              </h3>
              
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                {/* Total Permits Trend */}
                <Area
                  type="monotone"
                  dataKey="permits"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.4}
                  name="Total Permits"
                />
                {/* Active Permits Trend (using backend active data) */}
                <Area
                  type="monotone"
                  dataKey="active"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Active Permits"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Status Distribution
              </h3>
            </div>
            <div className="flex items-center justify-between">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="60%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                 <div className="w-full text-center py-12">No status data to display.</div>
              )}
              
              <div className="flex flex-col space-y-2">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.name}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Permit Types Distribution */}
      {permitTypeData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Permit Types Distribution (Last 10 Permits)
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={permitTypeData} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="type"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <YAxis />
                <Tooltip
                  formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, 'Count']}
                  labelFormatter={(label) => `Type: ${label}`}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* Recent Permits and Priority Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Permits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Recent Permits
              </h3>
              <Link
                to="/ptw/permits"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {permits?.slice(0, 6).map((permit) => (
                <div key={permit._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <Link
                      to={`/ptw/permits/${permit._id}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {permit.permitNumber}
                    </Link>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-48">
                      {permit.workDescription}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        permit.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        permit.status === 'approved' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        permit.status === 'submitted' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        permit.status === 'expired' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        permit.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {permit.status}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(permit.createdAt), 'MMM dd')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {permit.workers?.length || 0}
                    </span>
                  </div>
                </div>
              ))}
              
              {(!permits || permits.length === 0) && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No permits found
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Priority Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              Priority Actions
            </h3>
            <div className="space-y-3">
              {priorityActions.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      item.type === 'error' ? 'bg-red-400' :
                      item.type === 'warning' ? 'bg-yellow-400' :
                      'bg-blue-400'
                    }`} />
                    <div className="flex items-center space-x-2">
                      <item.icon className={`h-4 w-4 ${
                        item.type === 'error' ? 'text-red-500' :
                        item.type === 'warning' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`} />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {item.message}
                      </span>
                    </div>
                  </div>
                  <Link to={item.link}>
                    <Button
                      size="sm"
                      variant={
                        item.type === 'error' ? 'danger' :
                        item.type === 'warning' ? 'secondary' :
                        'primary'
                      }
                    >
                      {item.action}
                    </Button>
                  </Link>
                </div>
              ))}
              {priorityActions.length === 0 && (
                 <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No high-priority actions currently required.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PermitDashboard;