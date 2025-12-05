import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import Card from '../../../components/UI/Card';

interface CalendarViewProps {
  incidents: any[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ incidents }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getIncidentsForDate = (date: Date) => {
    return incidents.filter(incident => 
      isSameDay(new Date(incident.dateTime), date)
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mb-8"
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Incident Calendar
            </h3>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white min-w-[120px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h4>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {daysInMonth.map(day => {
            const dayIncidents = getIncidentsForDate(day);
            const hasIncidents = dayIncidents.length > 0;
            
            return (
              <div
                key={day.toString()}
                className="relative p-2 h-20 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                title={hasIncidents ? `${dayIncidents.length} incidents` : undefined}
              >
                <span className="text-sm text-gray-900 dark:text-white">
                  {format(day, 'd')}
                </span>
                
                {hasIncidents && (
                  <div className="absolute bottom-1 left-1 right-1">
                    <div className="flex flex-wrap gap-1">
                      {dayIncidents.slice(0, 3).map((incident, index) => (
                        <div
                          key={incident._id}
                          className={`w-2 h-2 rounded-full ${getSeverityColor(incident.severity)}`}
                          title={`${incident.incidentNumber} - ${incident.severity} - ${incident.description.substring(0, 50)}...`}
                        />
                      ))}
                      {dayIncidents.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{dayIncidents.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Tooltip on hover */}
                {hasIncidents && (
                  <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded-lg p-2 bottom-full left-0 mb-2 w-64">
                    {dayIncidents.map(incident => (
                      <div key={incident._id} className="mb-1">
                        <div className="font-medium">{incident.incidentNumber}</div>
                        <div className="text-gray-300">{incident.severity} - {incident.description.substring(0, 30)}...</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center mt-4 space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Critical</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">High</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Medium</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Low</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default CalendarView;