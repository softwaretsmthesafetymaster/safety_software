import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, User, AlertTriangle, ExternalLink } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import Card from '../../../components/UI/Card';

interface RecentInvestigationsProps {
  incidents: any[];
}

const RecentInvestigations: React.FC<RecentInvestigationsProps> = ({ incidents }) => {
  // Filter incidents that are under investigation
  const investigatingIncidents = incidents
    .filter(incident => incident.status === 'investigating' && incident.investigation?.assignedTo)
    .sort((a, b) => new Date(b.investigation?.assignedAt || 0).getTime() - new Date(a.investigation?.assignedAt || 0).getTime())
    .slice(0, 8);

  const getSLAStatus = (incident: any) => {
    if (!incident.investigation?.assignedAt || !incident.investigation?.timeLimit) {
      return { status: 'unknown', daysLeft: 0, color: 'gray' };
    }

    const assignedDate = new Date(incident.investigation.assignedAt);
    const timeLimit = incident.investigation.timeLimit; // in hours
    const dueDate = new Date(assignedDate.getTime() + (timeLimit * 60 * 60 * 1000));
    const daysLeft = differenceInDays(dueDate, new Date());

    if (daysLeft < 0) {
      return { status: 'overdue', daysLeft: Math.abs(daysLeft), color: 'red' };
    } else if (daysLeft <= 1) {
      return { status: 'urgent', daysLeft, color: 'orange' };
    } else {
      return { status: 'normal', daysLeft, color: 'green' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0 }}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Investigations
            </h3>
          </div>
          <Link
            to="/ims/incidents?status=investigating"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
          >
            <span>View all</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {investigatingIncidents.map((incident, index) => {
            const slaStatus = getSLAStatus(incident);
            
            return (
              <motion.div
                key={incident._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                {/* Severity Indicator */}
                <div className={`p-2 rounded-full ${
                  incident.severity === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' :
                  incident.severity === 'high' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' :
                  incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' :
                  'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>

                {/* Incident Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      to={`/ims/incidents/${incident._id}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {incident.incidentNumber}
                    </Link>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      slaStatus.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      slaStatus.color === 'orange' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {slaStatus.status === 'overdue' ? `${slaStatus.daysLeft}d overdue` :
                       slaStatus.status === 'urgent' ? `${slaStatus.daysLeft}d left` :
                       `${slaStatus.daysLeft}d left`}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {incident.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{incident.investigation?.assignedTo?.name || 'Unassigned'}</span>
                      </div>
                      <span>{incident.plantId?.name}</span>
                    </div>
                    <span>
                      {incident.investigation?.assignedAt && 
                        format(new Date(incident.investigation.assignedAt), 'MMM dd, yyyy')
                      }
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {investigatingIncidents.length === 0 && (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No active investigations
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              All incidents are either open or closed
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default RecentInvestigations;