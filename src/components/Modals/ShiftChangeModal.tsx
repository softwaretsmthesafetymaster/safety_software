import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Users, AlertTriangle } from 'lucide-react';
import Button from '../UI/Button';

interface ShiftChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  permitId: string;
  currentShift: string;
  onSubmit: (data: any) => void;
  loading?: boolean;
}

const ShiftChangeModal: React.FC<ShiftChangeModalProps> = ({
  isOpen,
  onClose,
  permitId,
  currentShift,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    newShift: '',
    handoverNotes: '',
    outgoingApprover: '',
    incomingApprover: '',
    safetyBriefingCompleted: false,
    workStatusReviewed: false
  });

  const shifts = [
    { value: 'day', label: 'Day Shift (6 AM - 6 PM)' },
    { value: 'night', label: 'Night Shift (6 PM - 6 AM)' },
    { value: '24hour', label: '24 Hour Operation' }
  ];

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({
      newShift: '',
      handoverNotes: '',
      outgoingApprover: '',
      incomingApprover: '',
      safetyBriefingCompleted: false,
      workStatusReviewed: false
    });
  };

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
              className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <Clock className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Shift Change Approval
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Current Status */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                        Shift Change Required
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Current shift: <strong>{currentShift}</strong>. This permit requires approver change due to shift transition.
                      </p>
                    </div>
                  </div>
                </div>

                {/* New Shift Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Shift *
                  </label>
                  <select
                    value={formData.newShift}
                    onChange={(e) => setFormData({ ...formData, newShift: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select New Shift</option>
                    {shifts.filter(s => s.value !== currentShift).map((shift) => (
                      <option key={shift.value} value={shift.value}>
                        {shift.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Approver Changes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Outgoing Approver
                    </label>
                    <input
                      type="text"
                      value={formData.outgoingApprover}
                      onChange={(e) => setFormData({ ...formData, outgoingApprover: e.target.value })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Current shift approver name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Incoming Approver *
                    </label>
                    <input
                      type="text"
                      value={formData.incomingApprover}
                      onChange={(e) => setFormData({ ...formData, incomingApprover: e.target.value })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="New shift approver name"
                    />
                  </div>
                </div>

                {/* Handover Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Handover Notes *
                  </label>
                  <textarea
                    value={formData.handoverNotes}
                    onChange={(e) => setFormData({ ...formData, handoverNotes: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Work status, safety considerations, and any important information for the new shift..."
                  />
                </div>

                {/* Verification Checklist */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Shift Change Verification
                  </h4>
                  
                  <label className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.safetyBriefingCompleted}
                      onChange={(e) => setFormData({ ...formData, safetyBriefingCompleted: e.target.checked })}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Safety briefing completed for new shift
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        New shift personnel have been briefed on current work status and safety requirements
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.workStatusReviewed}
                      onChange={(e) => setFormData({ ...formData, workStatusReviewed: e.target.checked })}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Work status and progress reviewed
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Current work progress, completed tasks, and remaining work have been reviewed
                      </p>
                    </div>
                  </label>
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
                    variant="primary"
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={loading || !formData.newShift || !formData.incomingApprover || !formData.handoverNotes || !formData.safetyBriefingCompleted || !formData.workStatusReviewed}
                    className="flex-1"
                    icon={Users}
                  >
                    Complete Shift Change
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

export default ShiftChangeModal;