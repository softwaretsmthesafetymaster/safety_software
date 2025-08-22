import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Building,
  Shield,
  Target,
  Eye,
  CheckSquare,
  ArrowRight
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchPermitStats } from '../../store/slices/permitSlice';
import { fetchIncidentStats } from '../../store/slices/incidentSlice';
import { fetchHAZOPStats } from '../../store/slices/hazopSlice';
import { fetchHIRAStats } from '../../store/slices/hiraSlice';
import { fetchBBSStats } from '../../store/slices/bbsSlice';
import { fetchAuditStats } from '../../store/slices/auditSlice';
import Card from '../../components/UI/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats: permitStats } = useAppSelector((state) => state.permit);
  const { stats: incidentStats } = useAppSelector((state) => state.incident);
  const { stats: hazopStats } = useAppSelector((state) => state.hazop);
  const { stats: hiraStats } = useAppSelector((state) => state.hira);
  const { stats: bbsStats } = useAppSelector((state) => state.bbs);
  const { stats: auditStats } = useAppSelector((state) => state.audit);
  const { currentCompany } = useAppSelector((state) => state.company);

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchPermitStats(user.companyId));
      dispatch(fetchIncidentStats(user.companyId));
      dispatch(fetchHAZOPStats(user.companyId));
      dispatch(fetchHIRAStats(user.companyId));
      dispatch(fetchBBSStats(user.companyId));
      dispatch(fetchAuditStats(user.companyId));
    }
  }, [dispatch, user?.companyId]);

  // Get enabled modules from company config
  const enabledModules = currentCompany?.config?.modules || {};

  // KPI Dashboard Stats
  const kpiStats = [
    {
      title: 'Active Permits',
      value: permitStats?.active || 0,
      icon: FileText,
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true,
      module: 'ptw',
      href: '/ptw'
    },
    {
      title: 'Open Incidents',
      value: incidentStats?.open || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: '-5%',
      trendUp: false,
      module: 'ims',
      href: '/ims'
    },
    {
      title: 'HAZOP Studies',
      value: hazopStats?.total || 0,
      icon: Target,
      color: 'bg-purple-500',
      trend: '+8%',
      trendUp: true,
      module: 'hazop',
      href: '/hazop'
    },
    {
      title: 'HIRA Assessments',
      value: hiraStats?.total || 0,
      icon: Target,
      color: 'bg-green-500',
      trend: '+8%',
      trendUp: true,
      module: 'hira',
      href: '/hira'
    },
    {
      title: 'BBS Observations',
      value: bbsStats?.total || 0,
      icon: Eye,
      color: 'bg-yellow-500',
      trend: '+3%',
      trendUp: true,
      module: 'bbs',
      href: '/bbs'
    },
    {
      title: 'Safety Audits',
      value: auditStats?.total || 0,
      icon: CheckSquare,
      color: 'bg-indigo-500',
      trend: '+15%',
      trendUp: true,
      module: 'audit',
      href: '/audit'
    },
  ];

  // Filter stats based on enabled modules
  const visibleStats = kpiStats.filter(stat => enabledModules[stat.module]?.enabled);

  // Leading and Lagging Indicators
  const leadingIndicators = [
    {
      title: 'Safety Training Hours',
      value: '1,247',
      target: '1,500',
      percentage: 83,
      trend: '+15%',
      trendUp: true
    },
    {
      title: 'Safety Observations',
      value: bbsStats?.total || 0,
      target: '200',
      percentage: Math.min(((bbsStats?.total || 0) / 200) * 100, 100),
      trend: '+22%',
      trendUp: true
    },
    {
      title: 'Near Miss Reports',
      value: incidentStats?.byType?.find((t: any) => t._id === 'near_miss')?.count || 0,
      target: '50',
      percentage: 75,
      trend: '+8%',
      trendUp: true
    }
  ];

  const laggingIndicators = [
    {
      title: 'Lost Time Incidents',
      value: '0',
      target: '0',
      percentage: 100,
      trend: '0%',
      trendUp: true
    },
    {
      title: 'Total Recordable Incidents',
      value: incidentStats?.total || 0,
      target: '5',
      percentage: Math.max(100 - ((incidentStats?.total || 0) / 5) * 100, 0),
      trend: '-12%',
      trendUp: true
    },
    {
      title: 'Days Since Last Incident',
      value: '45',
      target: '365',
      percentage: 12,
      trend: '+45 days',
      trendUp: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user?.name}! Here's your safety overview.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
            <Shield className="inline h-4 w-4 mr-1" />
            System Healthy
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleStats.slice(0, 6).map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="p-6 cursor-pointer">
              <Link to={stat.href} className="block">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className={`h-4 w-4 ${
                      stat.trendUp ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <span className={`text-sm ml-1 ${
                      stat.trendUp ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {stat.trend}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              </Link>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Leading & Lagging Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leading Indicators */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
              Leading Indicators
            </h3>
            <div className="space-y-4">
              {leadingIndicators.map((indicator, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {indicator.title}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {indicator.value}/{indicator.target}
                      </span>
                      <span className={`text-xs ${indicator.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                        {indicator.trend}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${indicator.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Lagging Indicators */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Target className="h-5 w-5 text-blue-500 mr-2" />
              Lagging Indicators
            </h3>
            <div className="space-y-4">
              {laggingIndicators.map((indicator, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {indicator.title}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {indicator.value}/{indicator.target}
                      </span>
                      <span className={`text-xs ${indicator.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                        {indicator.trend}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        indicator.percentage >= 80 ? 'bg-green-500' :
                        indicator.percentage >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${indicator.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Module Quick Access */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Quick Access to Modules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(enabledModules).map(([moduleKey, moduleConfig]: [string, any]) => {
              if (!moduleConfig?.enabled) return null;
              
              const moduleInfo = {
                ptw: { name: 'Permit to Work', icon: FileText, color: 'bg-blue-500', href: '/ptw' },
                ims: { name: 'Incident Management', icon: AlertTriangle, color: 'bg-red-500', href: '/ims' },
                hazop: { name: 'HAZOP Studies', icon: Target, color: 'bg-purple-500', href: '/hazop' },
                hira: { name: 'HIRA Assessment', icon: Target, color: 'bg-green-500', href: '/hira' },
                bbs: { name: 'BBS Observations', icon: Eye, color: 'bg-yellow-500', href: '/bbs' },
                audit: { name: 'Safety Audits', icon: CheckSquare, color: 'bg-indigo-500', href: '/audit' }
              }[moduleKey];
          
              if (!moduleInfo) return null;
            
              return (
              <Link 
                to={moduleInfo.href} 
                key={moduleKey} 
                className="group flex items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              >
                <div className={`p-3 rounded-lg ${moduleInfo.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                  <moduleInfo.icon className="h-8 w-8" />
                  </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {moduleInfo.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Access {moduleInfo.name.toLowerCase()} module
                  </p>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </Link>
              );
            }
          )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
export default Dashboard;
