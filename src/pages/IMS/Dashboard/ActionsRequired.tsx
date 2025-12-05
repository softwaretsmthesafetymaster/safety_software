import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Users, Calendar, ExternalLink } from 'lucide-react';
import { format, isPast } from 'date-fns';
import Card from '../../../components/UI/Card';

interface ActionsRequiredProps {
  stats: any;
  incidents: any[];
}

const ActionsRequired: React.FC<ActionsRequiredProps> = ({ stats, incidents }) => {
  // Calculate critical actions
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status !== 'closed').length;
  const overdueInvestigations = incidents.filter(i => {
    if (i.status !== 'investigating' || !i.investigation?.assignedAt || !i.investigation?.timeLimit) return false;
    const dueDate = new Date(new Date(i.investigation.assignedAt).getTime() + (i.investigation.timeLimit * 60 * 60 * 1000));
    return isPast(dueDate);
  }).length;
  
  const pendingActions = incidents.reduce((count, incident) => {
    return count + (incident.correctiveActions?.filter((action: any) => action.status === 'pending').length || 0);
  }, 0);

  const upcomingDeadlines = incidents.reduce((count, incident) => {
    const upcoming = incident.correctiveActions?.filter((action: any) => {
      if (action.status === 'completed' || !action.dueDate) return false;
      const dueDate = new Date(action.dueDate);
      const today = new Date();
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
    }).length || 0;
    return count + upcoming;
  }, 0);

  const actionItems = [
    {
      title: 'Critical Incidents',
      count: criticalIncidents,
      description: 'Require immediate attention',
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-900 dark:text-red-200',
      subtitleColor: 'text-red-700 dark:text-red-300',
      link: '/ims/incidents?severity=critical&status=!closed'
    },
    {
      title: 'Overdue Investigations',
      count: overdueInvestigations,
      description: 'Past SLA deadline',
      icon: Clock,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      textColor: 'text-orange-900 dark:text-orange-200',
      subtitleColor: 'text-orange-700 dark:text-orange-300',
      link: '/ims/incidents?status=investigating'
    },
    {
      title: 'Pending Actions',
      count: pendingActions,
      description: 'Corrective measures needed',
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-900 dark:text-blue-200',
      subtitleColor: 'text-blue-700 dark:text-blue-300',
      link: '/ims/incidents?status=actions_assigned'
    },
    {
      title: 'Upcoming Deadlines',
      count: upcomingDeadlines,
      description: 'Due within 7 days',
      icon: Calendar,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      textColor: 'text-purple-900 dark:text-purple-200',
      subtitleColor: 'text-purple-700 dark:text-purple-300',
      link: '/ims/incidents?status=actions_assigned'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1 }}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Actions Required
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actionItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
            >
              <Link
                to={item.link}
                className={`block ${item.bgColor} ${item.borderColor} border rounded-lg p-4 hover:shadow-md transition-all duration-200 group`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`text-sm font-medium ${item.textColor}`}>
                        {item.title}
                      </h4>
                      <ExternalLink className={`h-4 w-4 ${item.textColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </div>
                    
                    <div className="flex items-baseline space-x-2 mb-1">
                      <span className={`text-2xl font-bold ${item.textColor}`}>
                        {item.count}
                      </span>
                    </div>
                    
                    <p className={`text-xs ${item.subtitleColor}`}>
                      {item.description}
                    </p>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${item.color} ml-4`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Priority Items List */}
        {(criticalIncidents > 0 || overdueInvestigations > 0) && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Priority Items
            </h4>
            <div className="space-y-3">
              {incidents
                .filter(i => i.severity === 'critical' || (i.status === 'investigating' && i.investigation?.timeLimit))
                .slice(0, 3)
                .map((incident, index) => (
                  <div key={incident._id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`p-2 rounded-full ${
                      incident.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      <AlertTriangle className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/ims/incidents/${incident._id}`}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {incident.incidentNumber}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {incident.description.substring(0, 60)}...
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      incident.severity === 'critical' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    }`}>
                      {incident.severity === 'critical' ? 'Critical' : 'Overdue'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default ActionsRequired;