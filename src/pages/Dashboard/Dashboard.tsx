// Dashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Search,
  Building,
  Shield,
  Target,
  Eye,
  CheckSquare,
  ArrowRight,
  Calendar,
  BarChart3,
  Activity,
  Zap,
  MapPin,
  Bell,
  TrendingDown
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchDashboardStats } from '../../store/slices/dashboardSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, RadialBarChart, RadialBar
} from 'recharts';
import { format, subDays } from 'date-fns';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const KPICard: React.FC<any> = React.memo(({ kpi }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
    <Card hover className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.title}</p>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {typeof kpi.value === 'number' ? kpi.value : kpi.value}
            {kpi.suffix || ''}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.description}</p>
        </div>
        <div className={`p-3 rounded-lg ${kpi.color}`}>
          <kpi.icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  </motion.div>
));

const ModuleStatCard: React.FC<any> = React.memo(({ stat }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
    <Card hover className="p-6 cursor-pointer">
      <Link to={stat.href} className="block">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">/ {stat.total}</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.description}</p>
          </div>
          <div className={`p-3 rounded-lg ${stat.color}`}>
            <stat.icon className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {stat.trendUp ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm ml-1 ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>{stat.trend}</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>
      </Link>
    </Card>
  </motion.div>
));

export const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(s => s.auth);
  const {
    permitStats, incidentStats, hazopStats, hiraStats, bbsStats, auditStats, notifications, loading
  } = useAppSelector((s) => s.dashboard);
  const { currentCompany } = useAppSelector((s) => s.company);

  // Keep the plant selector local (like original)
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30d');

  // Fetch everything via single thunk
  useEffect(() => {
    if (!user?.companyId) return;
    dispatch(fetchDashboardStats({ companyId: user.companyId, plantId: selectedPlant }));
  }, [dispatch, user?.companyId, selectedPlant]);

  // ---------------------
  // memoized derived data
  // ---------------------
  const enabledModules = currentCompany?.config?.modules || {};

  const safetyPerformanceData = useMemo(() => {
    // Build 6 month series using available monthly arrays, fallback to 0 (no random)
    const months = [
      format(subDays(new Date(), 150), 'MMM'),
      format(subDays(new Date(), 120), 'MMM'),
      format(subDays(new Date(), 90), 'MMM'),
      format(subDays(new Date(), 60), 'MMM'),
      format(subDays(new Date(), 30), 'MMM'),
      format(new Date(), 'MMM')
    ];

    const getVal = (arr: any, idx: number, key = 'count') => (arr && Array.isArray(arr) && arr[idx] ? arr[idx][key] || 0 : 0);

    return months.map((m, i) => ({
      month: m,
      permits: getVal(permitStats?.monthlyData, i),
      incidents: getVal(incidentStats?.monthlyData, i),
      observations: getVal(bbsStats?.monthlyData, i),
      audits: getVal(auditStats?.monthlyData, i),
      compliance: (auditStats?.monthlyCompliance && auditStats.monthlyCompliance[i]) || (typeof auditStats?.avgCompliance === 'number' ? Math.round(auditStats.avgCompliance) : 0)
    }));
  }, [permitStats, incidentStats, bbsStats, auditStats]);

  const riskDistributionData = useMemo(() => {
    const arr = [
      { name: 'Very High', value: (hiraStats?.veryHighRisk || 0) + (hazopStats?.veryHighRisk || 0), color: '#dc2626' },
      { name: 'High', value: (hiraStats?.highRisk || 0) + (hazopStats?.highRisk || 0) + (incidentStats?.highSeverity || 0), color: '#ef4444' },
      { name: 'Medium', value: (hiraStats?.mediumRisk || 0) + (hazopStats?.mediumRisk || 0) + (incidentStats?.mediumSeverity || 0), color: '#f59e0b' },
      { name: 'Low', value: (hiraStats?.lowRisk || 0) + (hazopStats?.lowRisk || 0) + (incidentStats?.lowSeverity || 0), color: '#10b981' }
    ];
    return arr.filter(i => i.value > 0);
  }, [hiraStats, hazopStats, incidentStats]);

  const modulePerformanceData = useMemo(() => {
    const computeCompletion = (total: number, closed: number) => (total > 0 ? Math.round((closed / total) * 100) : 0);
    const computeEfficiency = (metric?: number) => (typeof metric === 'number' ? Math.max(0, 100 - metric) : 85);

    const data = [
      { module: 'PTW', active: permitStats?.active || 0, total: permitStats?.total || 0, completion: computeCompletion(permitStats?.total || 0, permitStats?.closed || 0), efficiency: computeEfficiency(permitStats?.avgProcessingTime), completionLabel: 'Completion %', efficiencyLabel: 'Efficiency %' },
      { module: 'IMS', active: incidentStats?.investigating || 0, total: incidentStats?.total || 0, completion: computeCompletion(incidentStats?.total || 0, incidentStats?.closed || 0), efficiency: computeEfficiency(incidentStats?.avgInvestigationTime) },
      { module: 'HAZOP', active: hazopStats?.inProgress || 0, total: hazopStats?.total || 0, completion: computeCompletion(hazopStats?.total || 0, hazopStats?.completed || 0), efficiency: computeEfficiency(hazopStats?.avgStudyTime) },
      { module: 'HIRA', active: hiraStats?.inProgress || 0, total: hiraStats?.total || 0, completion: computeCompletion(hiraStats?.total || 0, hiraStats?.completed || 0), efficiency: computeEfficiency(hiraStats?.avgAssessmentTime) },
      { module: 'BBS', active: bbsStats?.open || 0, total: bbsStats?.total || 0, completion: computeCompletion(bbsStats?.total || 0, bbsStats?.closed || 0), efficiency: computeEfficiency(bbsStats?.avgResponseTime) },
      { module: 'Audit', active: auditStats?.inProgress || 0, total: auditStats?.total || 0, completion: computeCompletion(auditStats?.total || 0, auditStats?.completed || 0), efficiency: computeEfficiency(auditStats?.avgAuditTime) }
    ];
    // filter per enabled modules config (lowercase as in earlier messages)
    return data.filter(item => enabledModules[item.module.toLowerCase()]?.enabled ?? true);
  }, [permitStats, incidentStats, hazopStats, hiraStats, bbsStats, auditStats, enabledModules]);

  const safetyMetricsData = useMemo(() => ([
    { name: 'Compliance', value: auditStats?.avgCompliance || 0, fill: '#10b981' },
    { name: 'Incident Rate', value: Math.max(0, 100 - (incidentStats?.incidentRate || 0)), fill: '#3b82f6' },
    { name: 'Observation Quality', value: bbsStats?.qualityScore || 0, fill: '#f59e0b' },
    { name: 'Risk Control', value: Math.round(((hiraStats?.controlledRisks || 0) / Math.max(1, hiraStats?.totalRisks || 1)) * 100), fill: '#8b5cf6' }
  ]), [auditStats, incidentStats, bbsStats, hiraStats]);

  // KPIs
  const safetyKPIs = useMemo(() => ([
    { title: 'Days Without Incident', value: incidentStats?.daysSinceLastIncident || 0, target: 365, percentage: Math.min(100, ((incidentStats?.daysSinceLastIncident || 0) / 365) * 100), color: 'bg-green-500', icon: Shield, trend: incidentStats?.daysTrend || '+0 days', trendUp: true, description: 'Days since last incident' },
    { title: 'Safety Compliance', value: Math.round(auditStats?.avgCompliance || 0), target: 100, percentage: auditStats?.avgCompliance || 0, color: 'bg-blue-500', icon: CheckSquare, trend: auditStats?.complianceTrend || '+0%', trendUp: true, description: 'Average audit compliance' },
    { title: 'Risk Reduction', value: Math.round(((hiraStats?.lowRiskItems || 0) / Math.max(1, hiraStats?.totalRiskItems || 1)) * 100), target: 90, percentage: Math.round(((hiraStats?.lowRiskItems || 0) / Math.max(1, hiraStats?.totalRiskItems || 1)) * 100), color: 'bg-purple-500', icon: TrendingUp, trend: hiraStats?.riskTrend || '+0%', trendUp: true, description: 'Low risk percentage' },
    { title: 'Observation Rate', value: Math.round(bbsStats?.observationRate || 0), target: 100, percentage: bbsStats?.observationRate || 0, color: 'bg-orange-500', icon: Eye, trend: bbsStats?.rateTrend || '+0%', trendUp: true, description: 'Rate of observations' }
  ]), [incidentStats, auditStats, hiraStats, bbsStats]);

  // Module cards (moduleStats) - use company config for showing
  const moduleStats = useMemo(() => ([
    { title: 'Active Permits', value: permitStats?.active || 0, total: permitStats?.total || 0, icon: FileText, color: 'bg-blue-500', trend: permitStats?.trend || '+0%', trendUp: (permitStats?.trend || '').includes('+'), module: 'ptw', href: '/ptw', description: 'Currently active work permits' },
    { title: 'Open Incidents', value: incidentStats?.open || 0, total: incidentStats?.total || 0, icon: AlertTriangle, color: 'bg-red-500', trend: incidentStats?.trend || '+0%', trendUp: !((incidentStats?.trend || '').includes('-')), module: 'ims', href: '/ims', description: 'Incidents requiring attention' },
    { title: 'HAZOP Studies', value: hazopStats?.inProgress || 0, total: hazopStats?.total || 0, icon: Target, color: 'bg-purple-500', trend: hazopStats?.trend || '+0%', trendUp: (hazopStats?.trend || '').includes('+'), module: 'hazop', href: '/hazop', description: 'Active HAZOP studies' },
    { title: 'HIRA Assessments', value: hiraStats?.inProgressAssessments || 0, total: hiraStats?.totalAssessments || 0, icon: Target, color: 'bg-green-500', trend: hiraStats?.trend || '+0%', trendUp: (hiraStats?.trend || '').includes('+'), module: 'hira', href: '/hira', description: 'Risk assessments in progress' },
    { title: 'BBS Observations', value: bbsStats?.open || 0, total: bbsStats?.total || 0, icon: Eye, color: 'bg-yellow-500', trend: bbsStats?.trend || '+0%', trendUp: (bbsStats?.trend || '').includes('+'), module: 'bbs', href: '/bbs', description: 'Safety observations this month' },
    { title: 'Safety Audits', value: auditStats?.inProgress || 0, total: auditStats?.total || 0, icon: CheckSquare, color: 'bg-indigo-500', trend: auditStats?.trend || '+0%', trendUp: (auditStats?.trend || '').includes('+'), module: 'audit', href: '/audit', description: 'Ongoing safety audits' }
  ]).filter(s => enabledModules[s.module]?.enabled), [permitStats, incidentStats, hazopStats, hiraStats, bbsStats, auditStats, enabledModules]);

  // Notifications and recent activities
  const recentActivities = useMemo(() => (notifications || []).slice(0, 8).map(n => ({
    title: n.title,
    message: n.message,
    time: n.createdAt ? format(new Date(n.createdAt), 'MMM dd, HH:mm') : '',
    type: n.type,
    read: n.read,
    metadata: n.metadata
  })), [notifications]);

  // Upcoming tasks: build from real data arrays if present
  const upcomingTasks = useMemo(() => {
    const tasks: any[] = [];
    (permitStats?.expiringPermits || []).forEach((permit: any) => tasks.push({
      title: `Permit ${permit.permitNumber} expiring`,
      description: permit.workDescription || '',
      priority: 'high',
      dueTime: permit.schedule?.endDate ? format(new Date(permit.schedule.endDate), 'MMM dd, yyyy') : '',
      action: 'Review Permit',
      href: `/ptw/permits/${permit._id}`,
      module: 'ptw'
    }));
    (incidentStats?.overdueInvestigations || []).forEach((incident: any) => tasks.push({
      title: `Investigation overdue: ${incident.incidentNumber}`,
      description: incident.description || '',
      priority: 'critical',
      dueTime: 'Overdue',
      action: 'Complete Investigation',
      href: `/ims/incidents/${incident._id}/investigation`,
      module: 'ims'
    }));
    (auditStats?.scheduledAudits || []).forEach((a: any) => tasks.push({
      title: `Audit scheduled: ${a.title}`,
      description: a.scope || '',
      priority: 'medium',
      dueTime: a.scheduledDate ? format(new Date(a.scheduledDate), 'MMM dd, yyyy') : '',
      action: 'Start Audit',
      href: `/audit/audits/${a._id}`,
      module: 'audit'
    }));
    (bbsStats?.pendingActions || []).forEach((action: any) => tasks.push({
      title: `BBS Action due: ${action.reportNumber}`,
      description: action.action || '',
      priority: 'medium',
      dueTime: action.dueDate ? format(new Date(action.dueDate), 'MMM dd, yyyy') : '',
      action: 'Complete Action',
      href: `/bbs/observations/${action._id}/complete`,
      module: 'bbs'
    }));
    return tasks.slice(0, 6);
  }, [permitStats, incidentStats, auditStats, bbsStats]);

  // Safety performance summary values
  const safetySummary = useMemo(() => ({
    compliance: auditStats?.avgCompliance ? Math.round(auditStats.avgCompliance) : 0,
    incidentRate: incidentStats?.incidentRate || '0.00',
    observations: bbsStats?.total || 0,
    avgResponseTime: permitStats?.avgResponseTime || '0.0'
  }), [auditStats, incidentStats, bbsStats, permitStats]);

  // ---------------------
  // UI Rendering
  // ---------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Safety Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user?.name || 'User'}! Here's your comprehensive safety overview for {currentCompany?.name || 'Company'}.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select value={selectedTimeRange} onChange={(e) => setSelectedTimeRange(e.target.value)} className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
            <Shield className="inline h-4 w-4 mr-1" /> System Healthy
          </div>

          { (notifications || []).filter(n => !n.read)?.length > 0 && (
            <Link to="/notifications">
              <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm font-medium">
                <Bell className="inline h-4 w-4 mr-1" />
                {(notifications || []).filter(n => !n.read).length} Alerts
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* KPIs */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {safetyKPIs.map((kpi, idx) => <KPICard key={idx} kpi={kpi} />)}
      </div> */}

      {/* Module Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {moduleStats.map((stat, idx) => <ModuleStatCard key={stat.title} stat={stat} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Safety Performance Trends */}
        <motion.div initial="initial" animate="animate" variants={fadeUp}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Safety Performance Trends</h3>
              <div className="flex items-center space-x-2"><Activity className="h-5 w-5 text-blue-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Last 6 months</span></div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={safetyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="permits" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Permits" />
                <Area type="monotone" dataKey="incidents" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Incidents" />
                <Area type="monotone" dataKey="observations" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Observations" />
                <Area type="monotone" dataKey="audits" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Audits" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Risk Distribution */}
        <motion.div initial="initial" animate="animate" variants={fadeUp}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Risk Level Distribution</h3>
              <div className="flex items-center space-x-2"><Target className="h-5 w-5 text-orange-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Current risks</span></div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={riskDistributionData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                  {riskDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Module Performance & Safety Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial="initial" animate="animate" variants={fadeUp}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Module Performance</h3>
              <div className="flex items-center space-x-2"><BarChart3 className="h-5 w-5 text-green-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Completion & efficiency rates</span></div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modulePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="module" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completion" fill="#10b981" name="Completion %" />
                <Bar dataKey="efficiency" fill="#3b82f6" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div initial="initial" animate="animate" variants={fadeUp}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Safety Metrics Overview</h3>
              <div className="flex items-center space-x-2"><Shield className="h-5 w-5 text-green-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Performance indicators</span></div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={safetyMetricsData}>
                <RadialBar dataKey="value" cornerRadius={10} />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-4 mt-4">
              {safetyMetricsData.map((metric) => (
                <div key={metric.name} className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{metric.value}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{metric.name}</div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activities & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial="initial" animate="animate" variants={fadeUp}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activities</h3>
              <Link to="/notifications" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">View all</Link>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className={`p-2 rounded-full ${activity.type === 'success' ? 'bg-green-100 text-green-600' : activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : activity.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                  {!activity.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                </div>
              )) : <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent activities</p>}
            </div>
          </Card>
        </motion.div>

        <motion.div initial="initial" animate="animate" variants={fadeUp}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center"><Calendar className="h-5 w-5 text-orange-500 mr-2" /> Upcoming Tasks & Reminders</h3>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {upcomingTasks.length > 0 ? upcomingTasks.map((task, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className={`w-3 h-3 rounded-full mt-2 ${ task.priority === 'critical' ? 'bg-red-500' : task.priority === 'high' ? 'bg-orange-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500' }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{task.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs ${task.dueTime === 'Overdue' ? 'text-red-600 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>{task.dueTime}</span>
                      <Link to={task.href}>
                        <Button size="sm" variant={task.priority === 'critical' ? 'danger' : 'secondary'}>{task.action}</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No upcoming tasks</p>}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activities Combined & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial="initial" animate="animate" variants={fadeUp}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Items (All Modules)</h3>
              <Link to="/notifications" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">View all</Link>
            </div>
            <div className="space-y-4">
              {[
                ...(permitStats?.recentPermits || []).map((item: any) => ({ ...item, type: 'permit', module: 'PTW' })),
                ...(incidentStats?.recentIncidents || []).map((item: any) => ({ ...item, type: 'incident', module: 'IMS' })),
                ...(hazopStats?.recentStudies || []).map((item: any) => ({ ...item, type: 'hazop', module: 'HAZOP' })),
                ...(hiraStats?.recentAssessments || []).map((item: any) => ({ ...item, type: 'hira', module: 'HIRA' })),
                ...(bbsStats?.recentReports || []).map((item: any) => ({ ...item, type: 'bbs', module: 'BBS' })),
                ...(auditStats?.recentAudits || []).map((item: any) => ({ ...item, type: 'audit', module: 'Audit' }))
              ]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className={`p-2 rounded-lg ${ item.module === 'PTW' ? 'bg-blue-100 dark:bg-blue-900/20' : item.module === 'IMS' ? 'bg-red-100 dark:bg-red-900/20' : item.module === 'HAZOP' ? 'bg-purple-100 dark:bg-purple-900/20' : item.module === 'HIRA' ? 'bg-orange-100 dark:bg-orange-900/20' : item.module === 'BBS' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-indigo-100 dark:bg-indigo-900/20' }`}>
                      {item.module === 'PTW' && <FileText className="h-4 w-4 text-blue-600" />}
                      {item.module === 'IMS' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      {item.module === 'HAZOP' && <Search className="h-4 w-4 text-purple-600" />}
                      {item.module === 'HIRA' && <Target className="h-4 w-4 text-orange-600" />}
                      {item.module === 'BBS' && <Eye className="h-4 w-4 text-green-600" />}
                      {item.module === 'Audit' && <CheckSquare className="h-4 w-4 text-indigo-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.permitNumber || item.incidentNumber || item.studyNumber || item.assessmentNumber || item.reportNumber || item.auditNumber}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{item.module} • {format(new Date(item.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ item.status === 'active' || item.status === 'approved' ? 'bg-green-100 text-green-800' : item.status === 'open' || item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : item.status === 'closed' || item.status === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800' }`}>{item.status}</span>
                  </div>
                ))}
            </div>
          </Card>
        </motion.div>

        <motion.div initial="initial" animate="animate" variants={fadeUp}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Notifications</h3>
              <Link to="/notifications" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">View all</Link>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(notifications || []).slice(0, 5).map((notification: any) => (
                <div key={notification._id || notification.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className={`p-2 rounded-lg ${notification.type === 'error' ? 'bg-red-100 dark:bg-red-900/20' : notification.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20' : notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-blue-100 dark:bg-blue-900/20' }`}>
                    <Bell className={`h-4 w-4 ${notification.type === 'error' ? 'text-red-600' : notification.type === 'warning' ? 'text-yellow-600' : notification.type === 'success' ? 'text-green-600' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{notification.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.createdAt ? format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm') : ''}</p>
                  </div>
                  {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Summary */}
      <motion.div initial="initial" animate="animate" variants={fadeUp}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center"><BarChart3 className="h-5 w-5 text-green-500 mr-2" /> Safety Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{safetySummary.compliance}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Safety Compliance</div>
              <div className="text-xs text-green-600 mt-1">{auditStats?.complianceTrend || '+0%'} from last month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{safetySummary.incidentRate}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Incident Rate</div>
              <div className="text-xs text-green-600 mt-1">{incidentStats?.rateTrend || '-0%'} from last month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{safetySummary.observations}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Safety Observations</div>
              <div className="text-xs text-green-600 mt-1">{bbsStats?.trend || '+0%'} from last month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">{safetySummary.avgResponseTime}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time (hrs)</div>
              <div className="text-xs text-green-600 mt-1">{permitStats?.responseTrend || '-0%'} from last month</div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
