import React from 'react';
import { CheckCircle, Clock, AlertTriangle, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  user?: any;
  status: 'completed' | 'pending' | 'current';
  type: 'submission' | 'review' | 'assignment' | 'completion' | 'closure';
}

interface WorkflowTimelineProps {
  report: any;
  className?: string;
}

const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ report, className = '' }) => {
  const generateTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Observation Submitted
    events.push({
      id: 'submitted',
      title: 'Observation Submitted',
      description: `${report.observationType.replace('_', ' ').toUpperCase()} observation reported`,
      timestamp: report.createdAt,
      user: report.observer,
      status: 'completed',
      type: 'submission'
    });

    // Review & Assignment
    if (report.reviewedAt) {
      events.push({
        id: 'reviewed',
        title: 'Review & Assignment',
        description: `Reviewed and ${report.reviewDecision === 'approve' ? 'approved' : 'reassigned'} by ${report.reviewedBy?.name}`,
        timestamp: report.reviewedAt,
        user: report.reviewedBy,
        status: 'completed',
        type: 'review'
      });
    } else {
      events.push({
        id: 'pending_review',
        title: 'Pending Review',
        description: 'Awaiting review by HOD or Plant Head',
        timestamp: '',
        status: report.status === 'open' ? 'current' : 'pending',
        type: 'review'
      });
    }

    // Action Assignments
    if (report.correctiveActions && report.correctiveActions.length > 0) {
      report.correctiveActions.forEach((action: any, index: number) => {
        if (action.completedDate) {
          events.push({
            id: `action_${index}`,
            title: `Action ${index + 1} Completed`,
            description: action.action,
            timestamp: action.completedDate,
            user: action.assignedTo,
            status: 'completed',
            type: 'completion'
          });
        } else if (action.status === 'in_progress') {
          events.push({
            id: `action_${index}`,
            title: `Action ${index + 1} In Progress`,
            description: action.action,
            timestamp: '',
            user: action.assignedTo,
            status: 'current',
            type: 'assignment'
          });
        } else {
          events.push({
            id: `action_${index}`,
            title: `Action ${index + 1} Pending`,
            description: action.action,
            timestamp: '',
            user: action.assignedTo,
            status: 'pending',
            type: 'assignment'
          });
        }
      });
    }

    // Final Closure
    if (report.status === 'closed') {
      events.push({
        id: 'closed',
        title: 'Observation Closed',
        description: 'Final approval completed and observation closed',
        timestamp: report.updatedAt,
        status: 'completed',
        type: 'closure'
      });
    } else if (report.status === 'pending_closure') {
      events.push({
        id: 'pending_closure',
        title: 'Pending Final Approval',
        description: 'Awaiting final approval from Plant Head or Safety Incharge',
        timestamp: '',
        status: 'current',
        type: 'closure'
      });
    }

    return events.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  };

  const getStatusIcon = (status: string, type: string) => {
    if (status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (status === 'current') {
      return <Clock className="h-4 w-4 text-blue-600" />;
    } else {
      return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-200';
      case 'current':
        return 'bg-blue-100 border-blue-200';
      case 'pending':
        return 'bg-gray-100 border-gray-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const events = generateTimelineEvents();

  return (
    <div className={`relative ${className}`}>
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
      
      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={event.id} className="relative flex items-start space-x-4">
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center relative z-10 border-2 ${getStatusColor(event.status)}`}>
              {getStatusIcon(event.status, event.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${
                  event.status === 'completed' ? 'text-gray-900 dark:text-white' : 
                  event.status === 'current' ? 'text-blue-900 dark:text-blue-100' :
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {event.title}
                </p>
                {event.timestamp && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {event.description}
              </p>
              {event.user && (
                <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <User className="h-3 w-3 mr-1" />
                  {event.user.name} ({event.user.role})
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowTimeline;