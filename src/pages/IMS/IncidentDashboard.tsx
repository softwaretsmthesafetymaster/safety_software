import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  Calendar
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchIncidentStats, fetchIncidents } from '../../store/slices/incidentSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format } from 'date-fns';

const IncidentDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats, incidents } = useAppSelector((state) => state.incident);

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchIncidentStats(user.companyId));
      dispatch(fetchIncidents({ companyId: user.companyId, limit: 5 }));
    }
  }, [dispatch, user?.companyId]);

  // Calculate real severity data from incidents
  const severityData = incidents?.reduce((acc: any[], incident) => {
    const existing = acc.find(item => item.name === incident.severity);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ 
        name: incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1), 
        value: 1,
        color: incident.severity === 'critical' ? '#dc2626' :
               incident.severity === 'high' ? '#ef4444' :
               incident.severity === 'medium' ? '#f59e0b' : '#10b981'
      });
    }
    return acc;
  }, []) || [];

  // Calculate monthly trends from incidents
  const monthlyTrends = incidents?.reduce((acc: any[], incident) => {
    const month = format(new Date(incident.dateTime), 'MMM');
    const existing = acc.find(item => item.month === month);
    
    if (existing) {
      existing.incidents += 1;
      if (incident.status === 'investigating') existing.investigations += 1;
      if (incident.status === 'closed') existing.closed += 1;
    } else {
      acc.push({
        month,
        incidents: 1,
        investigations: incident.status === 'investigating' ? 1 : 0,
        closed: incident.status === 'closed' ? 1 : 0
      });
    }
    return acc;
  }, []) || [];

  // Calculate type distribution from incidents
  const typeData = incidents?.reduce((acc: any[], incident) => {
    const existing = acc.find(item => item.type === incident.type);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ 
        type: incident.type.replace('_', ' ').toUpperCase(), 
        count: 1 
      });
    }
    return acc;
  }, []) || [];

  const dashboardStats = [
    {
      title: 'Total Incidents',
      value: stats?.total || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: '-8%',
      trendUp: false,
      description: 'vs last month'
    },
    {
      title: 'Open Incidents',
      value: stats?.open || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      trend: '+5%',
      trendUp: true,
      description: 'pending investigation'
    },
    {
      title: 'Under Investigation',
      value: stats?.investigating || 0,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true,
      description: 'active investigations'
    },
    {
      title: 'Closed This Month',
      value: stats?.closed || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      trend: '+15%',
      trendUp: true,
      description: 'completed investigations'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Incident Management Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track, investigate, and manage safety incidents
          </p>
        </div>
        <div className="flex items-center space-x-3">
  <Link to="/ims/incidents">
    <Button variant="secondary" icon={AlertTriangle}>
      View All Incidents
    </Button>
  </Link>

  <Link to="/ims/incidents/new">
    <Button variant="primary" icon={Plus}>
      Report Incident
    </Button>
  </Link>
</div>
      </div>

      {/* Stats Grid */}
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
                    <span className="text-sm text-gray-500 ml-1">{stat.description}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Monthly Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2} name="New Incidents" />
                <Line type="monotone" dataKey="investigations" stroke="#3b82f6" strokeWidth={2} name="Under Investigation" />
                <Line type="monotone" dataKey="closed" stroke="#10b981" strokeWidth={2} name="Closed" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Severity Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Severity Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Incident Types & Recent Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Incident Types
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Recent Incidents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Incidents
              </h3>
              <Link
                to="/ims/incidents"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {incidents?.slice(0, 5).map((incident, index) => (
                <div key={incident._id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className={`p-2 rounded-full ${
                    incident.severity === 'critical' ? 'bg-red-100 text-red-600' :
                    incident.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                    incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/ims/incidents/${incident._id}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {incident.incidentNumber}
                    </Link>
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {incident.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {incident.severity}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(incident.dateTime), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    incident.status === 'closed' ? 'bg-green-100 text-green-800' :
                    incident.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {incident.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Critical Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Critical Actions Required
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-red-900 dark:text-red-200">3</p>
                  <p className="text-sm text-red-700 dark:text-red-300">Critical incidents</p>
                  <p className="text-xs text-red-600 dark:text-red-400">Require immediate attention</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-200">5</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Overdue investigations</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Past deadline</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-blue-900 dark:text-blue-200">8</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Pending actions</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Corrective measures needed</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default IncidentDashboard;