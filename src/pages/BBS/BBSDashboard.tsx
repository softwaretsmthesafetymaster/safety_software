import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Bot,
  BookOpen,
  Gamepad2
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
  Line
} from 'recharts';
import { useAppSelector } from '../../hooks/redux';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { bbsService, BBSStats } from '../../services/bbs/bbsService';
import { aiService } from '../../services/bbs/aiService';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const BBSDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { plants } = useAppSelector((state) => state.plant);
  const { currentCompany } = useAppSelector((state) => state.company);
  
  const [stats, setStats] = useState<BBSStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPlant, timeRange]);

  const fetchDashboardData = async () => {
    if (!user?.companyId) return;
    
    try {
      setLoading(true);
      const dashboardStats = await bbsService.getBBSStats(user.companyId, selectedPlant);
      setStats(dashboardStats);
      
      // Generate chart data
      generateChartData(dashboardStats);
      fetchAIData();
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIData = async () => {
    if (!user?.companyId) return;
    
    try {
      
      const insights = await aiService.generateSafetyInsights(stats?.recentReports || []);
      setAiInsights(insights);
    } catch (error) {
      console.error('Error fetching AI data:', error);
    } finally {
      setLoading(false);
    }
  };
  const generateChartData = (data: BBSStats) => {
    // Mock trend data - in real app, this would come from backend
    const trendData = [
      { month: 'Jan', observations: 12, actions: 10 },
      { month: 'Feb', observations: 15, actions: 13 },
      { month: 'Mar', observations: 8, actions: 8 },
      { month: 'Apr', observations: 20, actions: 18 },
      { month: 'May', observations: 25, actions: 22 },
      { month: 'Jun', observations: 18, actions: 16 }
    ];
    
    setChartData(trendData);
  };

  const statCards = [
    {
      title: 'Total Observations',
      value: stats?.total || 0,
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Open Items',
      value: stats?.open || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      change: '-8%',
      changeType: 'positive'
    },
    {
      title: 'Closed Items',
      value: stats?.closed || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Safe Behaviors',
      value: stats?.safeBehaviors || 0,
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
      change: '+22%',
      changeType: 'positive'
    }
  ];

  const pieData = [
    { name: 'Unsafe Acts', value: stats?.unsafeActs || 0, color: '#DC2626' },
    { name: 'Unsafe Conditions', value: stats?.unsafeConditions || 0, color: '#EA580C' },
    { name: 'Safe Behaviors', value: stats?.safeBehaviors || 0, color: '#059669' }
  ];

  if (loading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            BBS Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Behavioral Based Safety insights and analytics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Company Owner Plant Filter */}
          {user?.role === 'company_owner' && (
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Plants</option>
              {plants.map((plant) => (
                <option key={plant._id} value={plant._id}>
                  {plant.name}
                </option>
              ))}
            </select>
          )}
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

      {/* AI Insights */}
      {aiInsights && (
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <div className="flex items-center mb-4">
            <Bot className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Safety Insights
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by advanced analytics and machine learning
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Safety Trend</h3>
              <div className={`flex items-center space-x-2 ${
                aiInsights.trend === 'improving' ? 'text-green-600' :
                aiInsights.trend === 'declining' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {aiInsights.trend === 'improving' ? <TrendingUp className="h-5 w-5" /> :
                 aiInsights.trend === 'declining' ? <TrendingDown className="h-5 w-5" /> :
                 <Clock className="h-5 w-5" />}
                <span className="font-medium">{aiInsights.trend.charAt(0).toUpperCase() + aiInsights.trend.slice(1)}</span>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Key Focus Areas</h3>
              <ul className="text-sm space-y-1">
                {aiInsights.keyAreas.slice(0, 3).map((area: string, index: number) => (
                  <li key={index} className="text-gray-600 dark:text-gray-400">• {area}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Priority Actions</h3>
              <ul className="text-sm space-y-1">
                {aiInsights.recommendations.slice(0, 2).map((rec: string, index: number) => (
                  <li key={index} className="text-gray-600 dark:text-gray-400">• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
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
                    {stat.value}
                  </p>
                  <div className={`flex items-center mt-2 ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.changeType === 'positive' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    <span className="text-sm font-medium">{stat.change}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Observation Trends */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Observation Trends
            </h2>
            <div className="flex space-x-2">
              {['7d', '30d', '90d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-3 py-1 text-xs rounded-full ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="observations" 
                stroke="#2563EB" 
                strokeWidth={2}
                name="Observations"
              />
              <Line 
                type="monotone" 
                dataKey="actions" 
                stroke="#059669" 
                strokeWidth={2}
                name="Actions"
              />
            </LineChart>
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
            <BookOpen className="h-8 w-8 text-green-600 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Safety Coaching
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Access coaching modules and training materials
          </p>
          <Button as={Link} to="/bbs/coaching" variant="secondary" className="w-full">
            Start Coaching
          </Button>
        </Card>

        <Card className="p-6 text-center">
          <div className="bg-purple-100 dark:bg-purple-900/20 rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <Gamepad2 className="h-8 w-8 text-purple-600 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Safety Games
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Engage with interactive safety learning games
          </p>
          <Button as={Link} to="/bbs/games" variant="secondary" className="w-full">
            Play Games
          </Button>
        </Card>
      </div>

      {/* Recent Observations */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Observations
          </h2>
          <Button as={Link} to="/bbs/observations" variant="secondary" size="sm">
            View All
          </Button>
        </div>
        
        {stats?.recentReports && stats.recentReports.length > 0 ? (
          <div className="space-y-4">
            {stats.recentReports.map((report) => (
              <div key={report._id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
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
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {report.plantId?.name} • {report.observer?.name} • {format(new Date(report.createdAt), 'MMM dd')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
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
              No observations found. Start by creating your first observation.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BBSDashboard;