import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Building,
  MapPin,
  Shield,
  Target,
  Search,
  RefreshCw,
  ChevronDown,
  Eye,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchIncidentStats, fetchIncidents } from '../../store/slices/incidentSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
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
  Line,
  ComposedChart,
  Legend
} from 'recharts';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  parseISO, 
  isWithinInterval, 
  getDaysInMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subWeeks,
  addWeeks
} from 'date-fns';

// Types
interface Incident {
  _id: string;
  incidentNumber: string;
  dateTime: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  status: 'open' | 'investigating' | 'pending_closure' | 'closed';
  plantId?: {
    _id: string;
    name: string;
  };
  investigation?: {
    timeLimit: number;
    assignedAt: string;
  }
}

interface IncidentState {
  stats: {
    total: number;
    open: number;
    investigating: number;
    closed: number;
  } | null;
  incidents: Incident[] | null;
  isLoading: boolean;
}

// Calendar Component
const CalendarView: React.FC<{ incidents: Incident[] | null, currentDate: Date, onDateChange: (date: Date) => void }> = ({ 
  incidents, 
  currentDate, 
  onDateChange 
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  
  // Get calendar data
  const calendarData = useMemo(() => {
    if (!incidents) return { days: [], weekDays: [] };
    
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    const days = [];
    let day = calendarStart;
    
    while (day <= calendarEnd) {
      const dayIncidents = incidents.filter(incident =>
        isSameDay(parseISO(incident.dateTime), day)
      );
      
      days.push({
        date: new Date(day),
        incidents: dayIncidents,
        isCurrentMonth: isSameMonth(day, currentDate),
        isToday: isToday(day),
        isSelected: selectedDate ? isSameDay(day, selectedDate) : false
      });
      
      day = addDays(day, 1);
    }
    
    // Week view data
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dayIncidents = incidents.filter(incident =>
        isSameDay(parseISO(incident.dateTime), date)
      );
      
      return {
        date,
        incidents: dayIncidents,
        isToday: isToday(date),
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false
      };
    });
    
    return { days, weekDays };
  }, [incidents, currentDate, selectedDate]);
  
  const navigateCalendar = (direction: 'prev' | 'next') => {
    if (calendarView === 'month') {
      onDateChange(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else {
      onDateChange(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed': return 'bg-green-100 text-green-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'pending_closure': return 'bg-purple-100 text-purple-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {format(currentDate, calendarView === 'month' ? 'MMMM yyyy' : "'Week of' MMM dd, yyyy")}
          </h2>
          <div className="flex items-center space-x-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigateCalendar('prev')}
              icon={ChevronLeft}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDateChange(new Date())}
            >
              Today
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigateCalendar('next')}
              icon={ChevronRight}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setCalendarView('month')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                calendarView === 'month'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setCalendarView('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                calendarView === 'week'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <Card className="p-6">
        {calendarView === 'month' ? (
          <div>
            {/* Month View Header */}
            <div className="grid grid-cols-7 gap-px mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Month View Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              {calendarData.days.map((day, index) => (
                <div
                  key={index}
                  className={`bg-white dark:bg-gray-800 min-h-[120px] p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    day.isSelected ? 'ring-2 ring-blue-500' : ''
                  } ${!day.isCurrentMonth ? 'opacity-50' : ''}`}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      day.isToday ? 'bg-blue-500 text-white px-2 py-1 rounded-full' : 
                      'text-gray-900 dark:text-white'
                    }`}>
                      {format(day.date, 'd')}
                    </span>
                    {day.incidents.length > 0 && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        {day.incidents.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {day.incidents.slice(0, 3).map((incident, idx) => (
                      <Link
                        key={incident._id}
                        to={`/ims/incidents/${incident._id}`}
                        className="block"
                      >
                        <div className={`text-xs p-1 rounded truncate hover:bg-opacity-80 ${getSeverityColor(incident.severity)} text-white`}>
                          {incident.incidentNumber}
                        </div>
                      </Link>
                    ))}
                    {day.incidents.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{day.incidents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Week View */
          <div>
            {/* Week View Header */}
            <div className="grid grid-cols-7 gap-4 mb-4">
              {calendarData.weekDays.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {format(day.date, 'EEE')}
                  </div>
                  <div className={`text-lg font-bold mt-1 ${
                    day.isToday ? 'bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto' : 
                    'text-gray-900 dark:text-white'
                  }`}>
                    {format(day.date, 'd')}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Week View Grid */}
            <div className="grid grid-cols-7 gap-4">
              {calendarData.weekDays.map((day, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 min-h-[200px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => setSelectedDate(day.date)}
                >
                  <div className="space-y-2">
                    {day.incidents.map((incident) => (
                      <Link
                        key={incident._id}
                        to={`/ims/incidents/${incident._id}`}
                        className="block"
                      >
                        <div className={`p-2 rounded-lg ${getSeverityColor(incident.severity)} text-white text-sm`}>
                          <div className="font-medium truncate">{incident.incidentNumber}</div>
                          <div className="text-xs opacity-90 truncate">{incident.description}</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(incident.status)}`}>
                              {incident.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs opacity-90">
                              {format(parseISO(incident.dateTime), 'HH:mm')}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
      
      {/* Selected Date Details */}
      {selectedDate && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Incidents for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          <div className="space-y-3">
            {calendarData.days
              .find(day => isSameDay(day.date, selectedDate))?.incidents
              .map((incident) => (
                <Link
                  key={incident._id}
                  to={`/ims/incidents/${incident._id}`}
                  className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {incident.incidentNumber}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {incident.severity}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-white mt-1">{incident.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{format(parseISO(incident.dateTime), 'HH:mm')}</span>
                        {incident.plantId && (
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {incident.plantId.name}
                          </span>
                        )}
                        <span>{incident.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(incident.status)}`}>
                      {incident.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              )) || (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No incidents recorded for this date.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

const IncidentDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { plants } = useAppSelector((state: any) => state.plant); 
  const { user } = useAppSelector((state: any) => state.auth); 
  const { stats, incidents, isLoading }: IncidentState = useAppSelector((state: any) => state.incident); 
 
  // Filter states
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    customStartDate: '',
    customEndDate: '',
    severity: '',
    type: '',
    status: '',
    plantId: '',
    areaId: '',
    assignedTo: ''
  });

  const [selectedPlants, setSelectedPlants] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'dashboard' | 'calendar'>('dashboard');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.companyId) {
      const queryParams = {
        companyId: user.companyId,
        ...filters,
        plants: user.role === 'company_owner' ? selectedPlants.join(',') : undefined
      };
      
      dispatch(fetchIncidentStats(queryParams));
      dispatch(fetchIncidents({ 
        ...queryParams,
        limit: 100
      }));
    }
  }, [dispatch, user?.companyId, filters, selectedPlants]);

  // Process data for charts
  const processedData = useMemo(() => {
    if (!incidents || incidents.length === 0) {
      return {
        severityData: [],
        monthlyTrends: [],
        typeData: [],
        statusData: [],
        plantData: [],
        areaData: [],
        dailyIncidents: [],
        investigationData: [],
        closureTime: []
      };
    }

    // Severity distribution
    const severityData = incidents.reduce((acc: any[], incident) => {
      const existing = acc.find(item => item.name?.toLowerCase() === incident.severity);
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
    }, []);
    // Monthly trends (last 6 months)
    const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthIncidents = incidents.filter(incident =>
        isWithinInterval(parseISO(incident.dateTime), { start: monthStart, end: monthEnd })
      );

      return {
        month: format(date, 'MMM yyyy'),
        total: monthIncidents.length,
        critical: monthIncidents.filter(i => i.severity === 'critical').length,
        high: monthIncidents.filter(i => i.severity === 'high').length,
        medium: monthIncidents.filter(i => i.severity === 'medium').length,
        low: monthIncidents.filter(i => i.severity === 'low').length,
        open: monthIncidents.filter(i => i.status === 'open').length,
        investigating: monthIncidents.filter(i => i.status === 'investigating').length,
        closed: monthIncidents.filter(i => i.status === 'closed').length
      };
    });

    // Type distribution
    const typeData = incidents.reduce((acc: any[], incident) => {
      const existing = acc.find(item => item.type?.toLowerCase() === incident.type);
      const typeName = incident.type.replace('_', ' ').toUpperCase();
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ type: typeName, count: 1 });
      }
      return acc;
    }, []);

    // Status distribution
    const statusData = incidents.reduce((acc: any[], incident) => {
      const existing = acc.find(item => item.name?.toLowerCase() === incident.status);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({
          name: incident.status.replace('_', ' ').toUpperCase(),
          value: 1,
          color: incident.status === 'closed' ? '#10b981' :
                incident.status === 'investigating' ? '#3b82f6' :
                incident.status === 'open' ? '#f59e0b' : '#6b7280'
        });
      }
      return acc;
    }, []);

    // Plant-wise data (for company owners)
    const plantData = incidents.reduce((acc: any[], incident) => {
      if (incident.plantId) {
        const plantName = incident.plantId.name || 'Unknown Plant';
        const existing = acc.find(item => item.plant === plantName);
        if (existing) {
          existing.incidents += 1;
          existing.critical += incident.severity === 'critical' ? 1 : 0;
          existing.open += incident.status === 'open' ? 1 : 0;
        } else {
          acc.push({
            plant: plantName,
            incidents: 1,
            critical: incident.severity === 'critical' ? 1 : 0,
            open: incident.status === 'open' ? 1 : 0
          });
        }
      }
      return acc;
    }, []);

    return {
      severityData,
      monthlyTrends,
      typeData,
      statusData,
      plantData,
      areaData: [],
      dailyIncidents: [],
      investigationData: [],
      closureTime: []
    };
  }, [incidents]);

  // Enhanced dashboard stats
  const dashboardStats = useMemo(() => {
    const totalIncidents = stats?.total || 0;
    const openIncidents = stats?.open || 0;
    const investigating = stats?.investigating || 0;
    const closedThisMonth = stats?.closed || 0;
    const criticalIncidents = incidents?.filter(i => i.severity === 'critical').length || 0;
    const overdueInvestigations = incidents?.filter(i => 
      i.status === 'investigating' && 
      i.investigation?.timeLimit && 
      i.investigation?.assignedAt &&
      new Date(i.investigation.assignedAt).getTime() + (i.investigation.timeLimit * 60 * 60 * 1000) < Date.now()
    ).length || 0;

    return [
      {
        title: 'Total Incidents',
        value: totalIncidents,
        icon: AlertTriangle,
        color: 'bg-red-500',
        description: 'vs last month',
        details: `${incidents?.filter(i => i.severity === 'critical').length || 0} critical, ${incidents?.filter(i => i.severity === 'high').length || 0} high severity`
      },
      {
        title: 'Open Incidents',
        value: openIncidents,
        icon: Clock,
        color: 'bg-yellow-500',
        description: 'pending investigation',
        details: `${incidents?.filter(i => i.status === 'open' && i.severity === 'critical').length || 0} critical open`
      },
      {
        title: 'Under Investigation',
        value: investigating,
        icon: Users,
        color: 'bg-blue-500',
        description: 'active investigations',
        details: `${overdueInvestigations} overdue`
      },
      {
        title: 'Closed This Month',
        value: closedThisMonth,
        icon: CheckCircle,
        color: 'bg-green-500',
        description: 'completed',
        // details: `Avg closure: 3.2 days`
      },
      {
        title: 'Critical Incidents',
        value: criticalIncidents,
        icon: Shield,
        color: 'bg-red-600',
        description: 'high priority',
        details: 'Requires immediate action'
      },
      {
        title: 'Safety Score',
        value: Math.max(0, 100 - (criticalIncidents * 10) - (openIncidents * 2)),
        icon: Target,
        color: 'bg-emerald-500',
        description: 'safety performance',
        details: 'Based on incident metrics'
      }
    ];
  }, [stats, incidents]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePlantSelection = (plantId: string) => {
    if (selectedPlants.includes(plantId)) {
      setSelectedPlants(prev => prev.filter(id => id !== plantId));
    } else {
      setSelectedPlants(prev => [...prev, plantId]);
    }
  };

  const clearFilters = () => {
    setFilters({
      dateRange: 'last30days',
      customStartDate: '',
      customEndDate: '',
      severity: '',
      type: '',
      status: '',
      plantId: '',
      areaId: '',
      assignedTo: ''
    });
    setSelectedPlants([]);
  };

  const exportData = () => {
    if (!incidents) return;
    
    // Create CSV content
    const headers = ['Incident Number', 'Date', 'Description', 'Severity', 'Type', 'Status', 'Plant'];
    const csvContent = [
      headers.join(','),
      ...incidents.map(incident => [
        incident.incidentNumber,
        format(parseISO(incident.dateTime), 'yyyy-MM-dd HH:mm'),
        `"${incident.description.replace(/"/g, '""')}"`,
        incident.severity,
        incident.type.replace('_', ' '),
        incident.status.replace('_', ' '),
        incident.plantId?.name || 'N/A'
      ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidents_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (viewMode === 'calendar') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Incident Calendar
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View incidents by date and schedule
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              icon={Filter}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <Button variant="secondary" icon={Download} onClick={exportData}>
              Export
            </Button>
            <Link to="/ims/incidents">
              <Button variant="secondary" icon={Eye}>
                View All
              </Button>
            </Link>
            <Link to="/ims/incidents/new">
              <Button variant="primary" icon={Plus}>
                Report Incident
              </Button>
            </Link>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setViewMode('dashboard')}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <BarChart3 className="h-4 w-4 mr-2 inline-block" />
            Dashboard
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
          >
            <Calendar className="h-4 w-4 mr-2 inline-block" />
            Calendar
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="last7days">Last 7 days</option>
                    <option value="last30days">Last 30 days</option>
                    <option value="last90days">Last 90 days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Severity
                  </label>
                  <select
                    value={filters.severity}
                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="">All Severities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="pending_closure">Pending Closure</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button variant="secondary" onClick={clearFilters} className="w-full">
                    Clear All
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        <CalendarView 
          incidents={incidents} 
          currentDate={calendarDate} 
          onDateChange={setCalendarDate} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Incident Management Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive safety incident tracking and analysis
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            icon={Filter}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          <Button variant="secondary" icon={Download} onClick={exportData}>
            Export
          </Button>
          <Link to="/ims/incidents">
            <Button variant="secondary" icon={Eye}>
              View All
            </Button>
          </Link>
          <Link to="/ims/incidents/new">
            <Button variant="primary" icon={Plus}>
              Report Incident
            </Button>
          </Link>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setViewMode('dashboard')}
          className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
        >
          <BarChart3 className="h-4 w-4 mr-2 inline-block" />
          Dashboard
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className="px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <Calendar className="h-4 w-4 mr-2 inline-block" />
          Calendar
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="last7days">Last 7 days</option>
                  <option value="last30days">Last 30 days</option>
                  <option value="last90days">Last 90 days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Severity
                </label>
                <select
                  value={filters.severity}
                  onChange={(e) => handleFilterChange('severity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="">All Severities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="">All Types</option>
                  <option value="injury">Injury</option>
                  <option value="near_miss">Near Miss</option>
                  <option value="property_damage">Property Damage</option>
                  <option value="environmental">Environmental</option>
                  <option value="security">Security</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="pending_closure">Pending Closure</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Plant Selection (for company owners) */}
              {user?.role === 'company_owner' && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Plants
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                      onChange={(e) => handlePlantSelection(e.target.value)}
                      value=""
                    >
                      <option value="" disabled>Select Plants...</option>
                      {plants?.map((plant: any) => (
                        <option key={plant._id} value={plant._id}>
                          {plant.name}
                        </option>
                      ))}
                    </select>
                    {/* Display selected plants as pills */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedPlants.map(plantId => {
                        const plant = plants?.find((p: any) => p._id === plantId);
                        return (
                          <span
                            key={plantId}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full cursor-pointer"
                            onClick={() => handlePlantSelection(plantId)}
                          >
                            {plant ? plant.name : plantId} ×
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button variant="secondary" onClick={clearFilters} className="w-full">
                  Clear All
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Plant Summary (for company owners) */}
      {user?.role === 'company_owner' && processedData.plantData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Plant Performance Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {processedData.plantData.map((plant, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white">{plant.plant}</h4>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Incidents:</span>
                    <span className="font-medium">{plant.incidents}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Critical:</span>
                    <span className="font-medium text-red-600">{plant.critical}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Open:</span>
                    <span className="font-medium text-yellow-600">{plant.open}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {dashboardStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card hover className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.description}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  {stat.details}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Incident Trends
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={processedData.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#3b82f6" name="Total Incidents" />
              <Line type="monotone" dataKey="critical" stroke="#dc2626" strokeWidth={2} name="Critical" />
              <Line type="monotone" dataKey="closed" stroke="#10b981" strokeWidth={2} name="Closed" />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {/* Severity Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Severity Distribution
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <RechartsPieChart>
              <Pie
                data={processedData.severityData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="value"
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
              >
                {processedData.severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Types */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Incident Types
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processedData.typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <YAxis type="number" />
              <XAxis dataKey="type" type="category" width={140} /> 
              <Tooltip />
              <Bar dataKey="count" fill="#0b8cf5ff" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={processedData.statusData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {processedData.statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" />
            </RechartsPieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Incidents & Critical Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents */}
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
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {incidents && incidents.length > 0 ? (
              incidents.slice(0, 10).map((incident) => (
                <div key={incident._id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className={`p-2 rounded-full flex-shrink-0 ${
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
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                      </span>
                      {incident.plantId && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {incident.plantId.name}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(incident.dateTime), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                    incident.status === 'closed' ? 'bg-green-100 text-green-800' :
                    incident.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {incident.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No recent incidents found.</p>
            )}
          </div>
        </Card>

        {/* Critical Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Critical Actions Required
          </h3>
          <div className="space-y-4">
            {/* Critical Incidents */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-red-900 dark:text-red-200">
                    {incidents?.filter(i => i.severity === 'critical').length || 0}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">Critical incidents</p>
                  <p className="text-xs text-red-600 dark:text-red-400">Require immediate attention</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            
            {/* Overdue Investigations */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-200">
                    {incidents?.filter(i => 
                      i.status === 'investigating' && 
                      i.investigation?.timeLimit && 
                      i.investigation?.assignedAt &&
                      new Date(i.investigation.assignedAt).getTime() + (i.investigation.timeLimit * 60 * 60 * 1000) < Date.now()
                    ).length || 0}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Overdue investigations</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Past deadline</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            
            {/* Pending Closure */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-blue-900 dark:text-blue-200">
                    {incidents?.filter(i => i.status === 'pending_closure').length || 0}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Pending closure</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Awaiting final review</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            {/* Safety Score */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-green-900 dark:text-green-200">
                    {Math.max(0, 100 - (incidents?.filter(i => i.severity === 'critical').length * 10) - (incidents?.filter(i => i.status === 'open').length * 2)) || 0}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">Safety Score</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Current performance</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default IncidentDashboard;