import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import Button from '../UI/Button';

interface PermitActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: 'approve' | 'reject' | 'activate' | 'stop' | 'extend';
  permitNumber: string;
  onConfirm: (data: any) => void;
  loading?: boolean;
}

const PermitActionModal: React.FC<PermitActionModalProps> = ({
  isOpen,
  onClose,
  title,
  action,
  permitNumber,
  onConfirm,
  loading = false
}) => {
  const [comments, setComments] = React.useState('');

  const handleSubmit = () => {
    onConfirm({ comments, action });
    setComments('');
  };

  const getActionConfig = () => {
    switch (action) {
      case 'approve':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          buttonVariant: 'success' as const,
          buttonText: 'Approve Permit'
        };
      case 'reject':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          buttonVariant: 'danger' as const,
          buttonText: 'Reject Permit'
        };
      case 'stop':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          buttonVariant: 'danger' as const,
          buttonText: 'Stop Work'
        };
      case 'activate':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          buttonVariant: 'success' as const,
          buttonText: 'Activate Permit'
        };
      case 'extend':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          buttonVariant: 'primary' as const,
          buttonText: 'Request Extension'
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          buttonVariant: 'secondary' as const,
          buttonText: 'Confirm'
        };
    }
  };

  const config = getActionConfig();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={onClose}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                <div className={`p-4 rounded-lg ${config.bgColor} mb-4`}>
                  <div className="flex items-center space-x-3">
                    <config.icon className={`h-6 w-6 ${config.color}`} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Permit: {permitNumber}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Comments {action === 'reject' || action === 'stop' ? '*' : '(Optional)'}
                  </label>
                  <textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder={`Enter comments for this ${action}...`}
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={config.buttonVariant}
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={loading || ((action === 'reject' || action === 'stop') && !comments.trim())}
                    className="flex-1"
                  >
                    {config.buttonText}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PermitActionModal;