import React from 'react';
import { CheckCircle, Clock, XCircle, AlertTriangle, FileText } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  module?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  module = 'general', 
  size = 'md', 
  showIcon = true 
}) => {
  const getStatusConfig = (status: string, module: string) => {
    const configs: Record<string, any> = {
      // PTW Status
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      submitted: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      expired: { color: 'bg-red-100 text-red-800', icon: XCircle },
      closed: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      
      // IMS Status
      open: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      investigating: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      pending_closure: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      
      // HAZOP Status
      planned: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      
      // HIRA Status
      in_review: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      
      // BBS Status
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      
      // Audit Status
      
      // General Status
      low: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      high: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      critical: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    };

    return configs[status] || { color: 'bg-gray-100 text-gray-800', icon: FileText };
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const config = getStatusConfig(status, module);
  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${config.color} ${sizeClasses[size]}`}>
      {showIcon && <IconComponent className={`${iconSizes[size]} mr-1`} />}
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};

export default StatusBadge;