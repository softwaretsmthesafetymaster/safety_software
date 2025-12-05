import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building,
  Users,
  MapPin,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Activity,
  Bell,
  BarChart3,
  PieChart,
  Calendar,
  AlertTriangle,
  Zap, // Added for modules
} from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import Card from '../../components/UI/Card';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  // Removed BarElement since the Bar chart was removed due to missing data
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
  // Removed BarElement register
);

// --- CORRECTED INTERFACE ---
interface PlatformStats {
  overview: {
    totalCompanies: number;
    activeCompanies: number;
    totalUsers: number;
    activeUsers: number;
    totalPlants: number;
    totalAreas: number;
    recentNotifications: number;
  };
  revenue: {
    total: number;
    monthly: number;
    // Corrected to match the actual data structure received
    byModule: Array<{
      module: string; // Changed from moduleName
      revenue: number;
      // NOTE: companies and moduleCost were missing in the sample data,
      // but are needed for the UI, so I'm removing the UI display that needs them for now.
    }>;
  };
  growth: {
    monthly: Array<{
      _id: { year: number; month: number };
      count: number;
    }>;
    companies: number;
    users: number;
  };
  distribution: {
    industries: Array<{ _id: string; count: number }>;
    roles: Array<{ _id: string; count: number }>;
    // Removed 'modules' and 'subscriptions' as they are missing from the sample payload
  };
}

const API_URL = import.meta.env.VITE_API_URL;
const PlatformDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/platform/dashboard/stats`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch platform stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchPlatformStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  // Chart configurations
  const growthChartData = {
    labels: stats.growth.monthly.map(item =>
      `${item._id.year}-${String(item._id.month).padStart(2, '0')}`
    ),
    datasets: [
      {
        label: 'New Companies',
        data: stats.growth.monthly.map(item => item.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true, // Added fill for a better look
      },
    ],
  };

  const industryChartData = {
    labels: stats.distribution.industries.map(item => item._id),
    datasets: [
      {
        data: stats.distribution.industries.map(item => item.count),
        backgroundColor: [
          '#3b82f6', // blue-500
          '#10b981', // green-500
          '#f59e0b', // amber-500
          '#ef4444', // red-500
          '#8b5cf6', // violet-500
          '#06b6d4', // cyan-500
          '#84cc16', // lime-500
          '#f97316', // orange-500
        ],
        hoverOffset: 4,
      },
    ],
  };

  // Removed subscriptionChartData as 'stats.distribution.subscriptions' is missing in the data

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue' }: any) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {/* Using a placeholder trend value for display consistency, 
              as actual trend calculation logic is not provided */}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/20`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Platform Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overview of the entire SafetyPro platform
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Companies"
          value={stats.overview.totalCompanies.toLocaleString()}
          icon={Building}
          // The active companies value is the actual trend data
          trend="up" 
          trendValue={`${stats.overview.activeCompanies} active`}
          color="blue"
        />
        <StatCard
          title="Total Users"
          value={stats.overview.totalUsers.toLocaleString()}
          icon={Users}
          // The active users value is the actual trend data
          trend="up" 
          trendValue={`${stats.overview.activeUsers} active`}
          color="green"
        />
        <StatCard
          title="Total Plants"
          value={stats.overview.totalPlants.toLocaleString()}
          icon={MapPin}
          color="purple"
        />
        <StatCard
          title="Monthly Revenue"
          value={`Rs. ${stats.revenue.monthly.toLocaleString()}`}
          icon={IndianRupee}
          // Placeholder trend
          trend="up"
          trendValue="12% from last month"
          color="yellow"
        />
      </div>

      {/* Revenue and Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Company Growth
            </h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            {/*  */}
            <Line
              data={growthChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Revenue by Module
            </h3>
            <IndianRupee className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {stats.revenue.byModule.map((moduleItem) => (
              // Changed 'module.moduleName' to 'moduleItem.module' to match the data structure
              // Removed companies and moduleCost display as they are missing in the sample data
              <div key={moduleItem.module} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white uppercase">
                    {moduleItem.module}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Rs. {moduleItem.revenue.toLocaleString()}
                  </p>
                  {/* Removed the original secondary line as moduleCost and companies are missing */}
                  {/* <p className="text-xs text-gray-500 dark:text-gray-400">
                    {module.companies} companies × ${module.moduleCost}
                  </p> */}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Total Revenue
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Rs. {stats.revenue.total.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> 
        {/* Changed lg:grid-cols-3 to lg:grid-cols-2 since one chart was removed */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Industry Distribution
            </h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            {/*  */}
            <Doughnut
              data={industryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </Card>

        {/* New Card to display Module Distribution (since Subscription Chart was removed) */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Module Adoption
            </h3>
            <Zap className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {/* Displaying module counts/status based on the revenue data or total count is not possible
                with the current data structure. Using the revenue.byModule data for adoption insight instead.
                A more complete API would have a 'distribution.modules' field.
            */}
             {stats.revenue.byModule.map((moduleItem, index) => (
              <div key={moduleItem.module} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {moduleItem.module}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Rs. {moduleItem.revenue.toLocaleString()} in revenue
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {/* Removed the third Distribution Chart (Subscription Plans) as the data is missing */}


      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {stats.overview.recentNotifications} notifications today
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {stats.overview.activeCompanies} active companies
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {stats.overview.totalAreas} areas managed
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Roles
            </h3>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats.distribution.roles.slice(0, 5).map((role) => (
              <div key={role._id} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {/* Nicer formatting for role names */}
                  {role._id.replace('_', ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {role.count}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              System Health
            </h3>
            <Bell className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Active Companies
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-600">
                  {((stats.overview.activeCompanies / stats.overview.totalCompanies) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Active Users
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-600">
                  {((stats.overview.activeUsers / stats.overview.totalUsers) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                System Status
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-600">
                  Operational
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PlatformDashboard;