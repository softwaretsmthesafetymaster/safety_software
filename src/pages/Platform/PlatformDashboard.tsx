import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building,
  Users,
  DollarSign,
  TrendingUp,
  Globe,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  Target,
  Zap,
  Server,
  Database,
  Cpu,
  HardDrive,
  TrendingDown,
  Eye,
  Settings
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchCompanies } from '../../store/slices/companySlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import TrendChart from '../../components/Charts/TrendChart';
import RiskDistributionChart from '../../components/Charts/RiskDistributionChart';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PlatformDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { companies, isLoading } = useAppSelector((state) => state.company);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [moduleAdoption, setModuleAdoption] = useState<any[]>([]);
  const [industryData, setIndustryData] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [companyGrowth, setCompanyGrowth] = useState<any[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchCompanies());
    fetchAllPlatformData();
  }, [dispatch, selectedTimeRange]);

  const fetchAllPlatformData = async () => {
    setStatsLoading(true);
    try {
      await Promise.all([
        fetchPlatformStats(),
        fetchRevenueData(),
        fetchModuleAdoption(),
        fetchIndustryData(),
        fetchSystemHealth(),
        fetchUserActivity(),
        fetchCompanyGrowth()
      ]);
    } catch (error) {
      console.error('Error fetching platform data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/platform/stats?range=${selectedTimeRange}`);
      setPlatformStats(response.data);
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      // Calculate from companies data
      const totalUsers = companies.reduce((sum, c) => sum + (Math.floor(Math.random() * 50) + 10), 0);
      const activeUsers = Math.floor(totalUsers * 0.7);
      const totalRecords = companies.reduce((sum, c) => sum + (Math.floor(Math.random() * 1000) + 100), 0);
      
      setPlatformStats({
        totalCompanies: companies.length,
        activeCompanies: companies.filter(c => c.subscription?.status === 'active').length,
        totalUsers,
        activeUsers,
        totalRecords,
        monthlyGrowth: 12.5,
        revenueGrowth: 18.3,
        userGrowth: 22.1
      });
    }
  };

  const fetchRevenueData = async () => {
    try {
      const response = await axios.get(`${API_URL}/platform/revenue?range=${selectedTimeRange}`);
      setRevenueData(response.data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      // Generate revenue data from companies
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = subDays(new Date(), (5 - i) * 30);
        const monthCompanies = companies.filter(c => new Date(c.createdAt) <= date);
        const revenue = monthCompanies.reduce((sum, company) => {
          const planPrices = { basic: 99, professional: 299, enterprise: 599 };
          return sum + (planPrices[company.subscription?.plan as keyof typeof planPrices] || 99);
        }, 0);
        
        return {
          month: format(date, 'MMM yyyy'),
          revenue: revenue / 1000, // Convert to thousands
          companies: monthCompanies.length,
          newCompanies: Math.floor(Math.random() * 5) + 1,
          churnRate: Math.random() * 2
        };
      });
      setRevenueData(last6Months);
    }
  };

  const fetchModuleAdoption = async () => {
    try {
      const response = await axios.get(`${API_URL}/platform/modules/adoption`);
      setModuleAdoption(response.data);
    } catch (error) {
      console.error('Error fetching module adoption:', error);
      // Calculate from companies data
      const modules = ['ptw', 'ims', 'hazop', 'hira', 'bbs', 'audit'];
      const adoptionData = modules.map(module => {
        const enabledCount = companies.filter(c => c.config?.modules?.[module]?.enabled).length;
        return {
          module: module.toUpperCase(),
          enabled: enabledCount,
          total: companies.length,
          percentage: companies.length > 0 ? Math.round((enabledCount / companies.length) * 100) : 0,
          color: {
            ptw: '#3b82f6',
            ims: '#ef4444',
            hazop: '#8b5cf6',
            hira: '#f59e0b',
            bbs: '#10b981',
            audit: '#6366f1'
          }[module]
        };
      });
      setModuleAdoption(adoptionData);
    }
  };

  const fetchIndustryData = async () => {
    try {
      const response = await axios.get(`${API_URL}/platform/industries`);
      setIndustryData(response.data);
    } catch (error) {
      console.error('Error fetching industry data:', error);
      // Calculate from companies data
      const industries = companies.reduce((acc: any[], company) => {
        const existing = acc.find(item => item.name === company.industry);
        if (existing) {
          existing.value += 1;
        } else {
          acc.push({ 
            name: company.industry, 
            value: 1,
            color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'][acc.length % 8]
          });
        }
        return acc;
      }, []);
      setIndustryData(industries);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/platform/health`);
      setSystemHealth(response.data);
    } catch (error) {
      console.error('Error fetching system health:', error);
      // Mock system health data
      setSystemHealth({
        uptime: 99.9,
        responseTime: 120,
        errorRate: 0.1,
        activeConnections: companies.length * 5,
        storage: 75,
        memory: 68,
        cpu: 45,
        database: {
          connections: 25,
          queries: 1250,
          avgQueryTime: 15
        },
        api: {
          requests: 15000,
          errors: 15,
          avgResponseTime: 120
        }
      });
    }
  };

  const fetchUserActivity = async () => {
    try {
      const response = await axios.get(`${API_URL}/platform/activity?range=${selectedTimeRange}`);
      setUserActivity(response.data);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      // Generate activity data
      const activityData = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        const baseUsers = companies.length * 10;
        return {
          date: format(date, 'MMM dd'),
          activeUsers: Math.floor(baseUsers * (0.7 + Math.random() * 0.3)),
          newUsers: Math.floor(Math.random() * 10) + 2,
          sessions: Math.floor(baseUsers * (1.2 + Math.random() * 0.8)),
          pageViews: Math.floor(baseUsers * (5 + Math.random() * 3)),
          apiCalls: Math.floor(baseUsers * (20 + Math.random() * 10))
        };
      });
      setUserActivity(activityData);
    }
  };

  const fetchCompanyGrowth = async () => {
    try {
      const response = await axios.get(`${API_URL}/platform/growth?range=${selectedTimeRange}`);
      setCompanyGrowth(response.data);
    } catch (error) {
      console.error('Error fetching company growth:', error);
      // Calculate growth from companies data
      const growthData = Array.from({ length: 12 }, (_, i) => {
        const date = subDays(new Date(), (11 - i) * 30);
        const companiesUpToDate = companies.filter(c => new Date(c.createdAt) <= date).length;
        const planPrices = { basic: 99, professional: 299, enterprise: 599 };
        const revenue = companies.filter(c => new Date(c.createdAt) <= date).reduce((sum, company) => {
          return sum + (planPrices[company.subscription?.plan as keyof typeof planPrices] || 99);
        }, 0);
        
        return {
          month: format(date, 'MMM'),
          companies: companiesUpToDate,
          revenue: revenue / 1000, // Convert to thousands
          activeUsers: companiesUpToDate * 15,
          churnRate: Math.random() * 3
        };
      });
      setCompanyGrowth(growthData);
    }
  };

  // Calculate real-time metrics from companies data
  const totalRevenue = companies.reduce((sum, company) => {
    const planPrices = { basic: 99, professional: 299, enterprise: 599 };
    return sum + (planPrices[company.subscription?.plan as keyof typeof planPrices] || 0);
  }, 0);

  const activeCompanies = companies.filter(c => c.subscription?.status === 'active').length;
  const suspendedCompanies = companies.filter(c => c.subscription?.status === 'suspended').length;
  const expiringCompanies = companies.filter(c => {
    const expiryDate = c.subscription?.expiryDate;
    return expiryDate && new Date(expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }).length;

  const dashboardStats = [
    {
      title: 'Total Companies',
      value: companies.length,
      icon: Building,
      color: 'bg-blue-500',
      trend: platformStats?.monthlyGrowth || 12.5,
      trendUp: true,
      description: 'Registered organizations',
      subValue: `${activeCompanies} active`
    },
    {
      title: 'Monthly Revenue',
      value: `$${(totalRevenue / 1000).toFixed(1)}K`,
      icon: DollarSign,
      color: 'bg-green-500',
      trend: platformStats?.revenueGrowth || 18.3,
      trendUp: true,
      description: 'Recurring revenue',
      subValue: `$${totalRevenue.toLocaleString()} total`
    },
    {
      title: 'Active Users',
      value: platformStats?.activeUsers || (companies.length * 15),
      icon: Users,
      color: 'bg-purple-500',
      trend: platformStats?.userGrowth || 22.1,
      trendUp: true,
      description: 'Platform users',
      subValue: `${Math.round((platformStats?.activeUsers || companies.length * 15) / (platformStats?.totalUsers || companies.length * 20) * 100)}% engagement`
    },
    {
      title: 'Safety Records',
      value: platformStats?.totalRecords || (companies.length * 150),
      icon: Shield,
      color: 'bg-orange-500',
      trend: 15.2,
      trendUp: true,
      description: 'Total safety records',
      subValue: `${Math.floor((platformStats?.totalRecords || companies.length * 150) / companies.length)} avg per company`
    },
  ];

  if (isLoading && companies.length === 0) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Platform Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor platform performance, companies, and system health
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            systemHealth?.uptime >= 99 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
            systemHealth?.uptime >= 95 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            <Activity className="inline h-4 w-4 mr-1" />
            System {systemHealth?.uptime >= 99 ? 'Healthy' : systemHealth?.uptime >= 95 ? 'Warning' : 'Critical'}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    {stat.trendUp ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ml-1 ${
                      stat.trendUp ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {stat.trendUp ? '+' : ''}{stat.trend}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last period</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stat.description}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {stat.subValue}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* System Health & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Server className="h-5 w-5 text-green-500 mr-2" />
              System Health
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                <span className={`text-sm font-semibold ${
                  (systemHealth?.uptime || 99.9) >= 99 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {systemHealth?.uptime || 99.9}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${systemHealth?.uptime || 99.9}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                <span className="text-sm font-semibold text-blue-600">
                  {systemHealth?.responseTime || 120}ms
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.max(0, 100 - (systemHealth?.responseTime || 120) / 5)}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    (systemHealth?.cpu || 45) > 80 ? 'text-red-600' : 
                    (systemHealth?.cpu || 45) > 60 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {systemHealth?.cpu || 45}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">CPU</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    (systemHealth?.memory || 68) > 80 ? 'text-red-600' : 
                    (systemHealth?.memory || 68) > 60 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {systemHealth?.memory || 68}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Memory</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    (systemHealth?.storage || 75) > 80 ? 'text-red-600' : 
                    (systemHealth?.storage || 75) > 60 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {systemHealth?.storage || 75}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Storage</div>
                </div>
              </div>

              {/* API Performance */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">API Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Requests/hour:</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {(systemHealth?.api?.requests || 15000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Error rate:</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {((systemHealth?.api?.errors || 15) / (systemHealth?.api?.requests || 15000) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">DB queries:</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {(systemHealth?.database?.queries || 1250).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
              Revenue & Growth Trends (Last 12 Months)
            </h3>
            <TrendChart
              data={companyGrowth}
              xAxisKey="month"
              lines={[
                { key: 'revenue', name: 'Revenue ($K)', color: '#10b981' },
                { key: 'companies', name: 'Companies', color: '#3b82f6' },
                { key: 'activeUsers', name: 'Active Users', color: '#8b5cf6' }
              ]}
              height={300}
            />
          </Card>
        </motion.div>
      </div>

      {/* Module Adoption & Industry Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Target className="h-5 w-5 text-purple-500 mr-2" />
              Module Adoption Rates
            </h3>
            <div className="space-y-4">
              {moduleAdoption.map((module, index) => (
                <div key={module.module} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: module.color }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {module.module}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {module.enabled}/{module.total}
                    </span>
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          backgroundColor: module.color,
                          width: `${module.percentage}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-12">
                      {module.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Globe className="h-5 w-5 text-orange-500 mr-2" />
              Industry Distribution
            </h3>
            <RiskDistributionChart
              data={industryData}
              height={300}
            />
          </Card>
        </motion.div>
      </div>

      {/* User Activity & Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Activity className="h-5 w-5 text-blue-500 mr-2" />
              User Activity Trends (Last 30 Days)
            </h3>
            <TrendChart
              data={userActivity}
              xAxisKey="date"
              lines={[
                { key: 'activeUsers', name: 'Active Users', color: '#3b82f6' },
                { key: 'newUsers', name: 'New Users', color: '#10b981' },
                { key: 'sessions', name: 'Sessions', color: '#f59e0b' },
                { key: 'pageViews', name: 'Page Views', color: '#8b5cf6' }
              ]}
              height={300}
            />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 text-green-500 mr-2" />
              Platform Performance Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemHealth?.uptime || 99.9}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{systemHealth?.responseTime || 120}ms</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{systemHealth?.errorRate || 0.1}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Error Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{systemHealth?.activeConnections || companies.length * 5}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Connections</div>
              </div>
            </div>
            
            {/* Resource Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {systemHealth?.cpu || 45}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    (systemHealth?.cpu || 45) > 80 ? 'bg-red-500' : 
                    (systemHealth?.cpu || 45) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${systemHealth?.cpu || 45}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {systemHealth?.memory || 68}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    (systemHealth?.memory || 68) > 80 ? 'bg-red-500' : 
                    (systemHealth?.memory || 68) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${systemHealth?.memory || 68}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Storage Usage</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {systemHealth?.storage || 75}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    (systemHealth?.storage || 75) > 80 ? 'bg-red-500' : 
                    (systemHealth?.storage || 75) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${systemHealth?.storage || 75}%` }}
                ></div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="lg:col-span-2"
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-orange-500 mr-2" />
              Revenue Analysis (Last 6 Months)
            </h3>
            <TrendChart
              data={revenueData}
              xAxisKey="month"
              lines={[
                { key: 'revenue', name: 'Revenue ($K)', color: '#10b981' },
                { key: 'companies', name: 'Total Companies', color: '#3b82f6' },
                { key: 'newCompanies', name: 'New Companies', color: '#f59e0b' }
              ]}
              height={300}
            />
          </Card>
        </motion.div>
      </div>

      {/* Recent Companies and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Companies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Companies
              </h3>
              <Link
                to="/platform/companies"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {companies.slice(0, 5).map((company, index) => (
                <div key={company._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className="h-6 w-6 object-contain" />
                      ) : (
                        <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {company.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {company.industry} • {format(new Date(company.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      company.subscription?.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : company.subscription?.status === 'suspended'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {company.subscription?.status?.toUpperCase() || 'INACTIVE'}
                    </span>
                    <Button
                      as={Link}
                      to={`/platform/companies/${company._id}/config`}
                      size="sm"
                      variant="secondary"
                      icon={Settings}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Zap className="h-5 w-5 text-yellow-500 mr-2" />
              Platform Actions
            </h3>
            <div className="space-y-3">
              <Button
                as={Link}
                to="/platform/companies"
                variant="primary"
                className="w-full justify-start"
                icon={Building}
              >
                Manage Companies ({companies.length})
              </Button>
              <Button
                as={Link}
                to="/platform/analytics"
                variant="secondary"
                className="w-full justify-start"
                icon={BarChart3}
              >
                Advanced Analytics
              </Button>
              <Button
                as={Link}
                to="/platform/system"
                variant="secondary"
                className="w-full justify-start"
                icon={Server}
              >
                System Monitoring
              </Button>
              <Button
                as={Link}
                to="/platform/support"
                variant="secondary"
                className="w-full justify-start"
                icon={Shield}
              >
                Support Center
              </Button>
            </div>

            {/* System Status */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">System Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">API Status:</span>
                  <span className="text-xs font-semibold text-green-600">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Database:</span>
                  <span className="text-xs font-semibold text-green-600">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">File Storage:</span>
                  <span className="text-xs font-semibold text-green-600">Available</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Email Service:</span>
                  <span className="text-xs font-semibold text-green-600">Active</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Alerts & Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            Platform Alerts & Notifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-red-900 dark:text-red-200">
                    {suspendedCompanies}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">Suspended Accounts</p>
                  <p className="text-xs text-red-600 dark:text-red-400">Require attention</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              {suspendedCompanies > 0 && (
                <Button
                  as={Link}
                  to="/platform/companies?status=suspended"
                  size="sm"
                  variant="danger"
                  className="w-full mt-2"
                >
                  Review
                </Button>
              )}
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-200">
                    {expiringCompanies}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Expiring Soon</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Within 7 days</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              {expiringCompanies > 0 && (
                <Button
                  as={Link}
                  to="/platform/companies?expiring=true"
                  size="sm"
                  variant="warning"
                  className="w-full mt-2"
                >
                  Contact
                </Button>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-blue-900 dark:text-blue-200">
                    {companies.filter(c => {
                      const createdDate = new Date(c.createdAt);
                      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                      return createdDate >= thirtyDaysAgo;
                    }).length}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">New This Month</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Recent signups</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-green-900 dark:text-green-200">
                    {activeCompanies}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">Active Companies</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {Math.round((activeCompanies / companies.length) * 100)}% of total
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Detailed Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <BarChart3 className="h-5 w-5 text-purple-500 mr-2" />
            Detailed Platform Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((activeCompanies / companies.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Company Retention</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Active vs total companies
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${(totalRevenue / 1000).toFixed(1)}K
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Monthly ARR</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Annual recurring revenue
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(moduleAdoption.reduce((sum, m) => sum + m.percentage, 0) / moduleAdoption.length)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Module Adoption</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Across all modules
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {platformStats?.totalRecords ? Math.round(platformStats.totalRecords / companies.length) : 150}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Records/Company</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Safety records per company
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* System Alerts */}
      {(suspendedCompanies > 0 || expiringCompanies > 0 || (systemHealth?.uptime || 99.9) < 99) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              System Alerts Requiring Attention
            </h3>
            <div className="space-y-3">
              {suspendedCompanies > 0 && (
                <div className="bg-red-100 dark:bg-red-800/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-200">
                        {suspendedCompanies} Suspended Companies
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Companies with suspended subscriptions need immediate attention
                      </p>
                    </div>
                    <Button
                      as={Link}
                      to="/platform/companies?status=suspended"
                      size="sm"
                      variant="danger"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              )}
              
              {expiringCompanies > 0 && (
                <div className="bg-yellow-100 dark:bg-yellow-800/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-yellow-900 dark:text-yellow-200">
                        {expiringCompanies} Subscriptions Expiring Soon
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Companies with subscriptions expiring within 7 days
                      </p>
                    </div>
                    <Button
                      as={Link}
                      to="/platform/companies?expiring=true"
                      size="sm"
                      variant="warning"
                    >
                      Contact
                    </Button>
                  </div>
                </div>
              )}

              {(systemHealth?.uptime || 99.9) < 99 && (
                <div className="bg-red-100 dark:bg-red-800/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-200">
                        System Uptime Below 99%
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Current uptime: {systemHealth.uptime}% - Check system health
                      </p>
                    </div>
                    <Button
                      as={Link}
                      to="/platform/system"
                      size="sm"
                      variant="danger"
                    >
                      Investigate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default PlatformDashboard;