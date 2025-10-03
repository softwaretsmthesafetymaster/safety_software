import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Send,
  Users,
  MessageSquare,
  UserCheck
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { assignHIRA, fetchHIRAById } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

const HIRAAssignment: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentAssessment, isLoading } = useAppSelector((state) => state.hira);
  const { users } = useAppSelector((state) => state.user);

  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchHIRAById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  useEffect(() => {
    if (currentAssessment?.team) {
      setSelectedTeam(currentAssessment.team.map((member: any) => member._id));
    }
  }, [currentAssessment]);

  const handleTeamSelection = (userId: string) => {
    setSelectedTeam(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssign = async () => {
    if (selectedTeam.length === 0) {
      dispatch(addNotification({
        type: 'warning',
        message: 'Please select at least one team member'
      }));
      return;
    }

    try {
      await dispatch(assignHIRA({
        companyId: user?.companyId!,
        id: id!,
        team: selectedTeam,
        comments
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'HIRA assessment assigned successfully'
      }));

      navigate(`/hira/assessments/${id}`);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to assign assessment'
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Assign HIRA Assessment
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentAssessment?.title} - {currentAssessment?.assessmentNumber}
          </p>
        </div>
      </div>

      {/* Assignment Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Select Team Members
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {users.filter(u => u._id !== user?._id && u.role !== 'plant_head').map((teamUser) => (
                <motion.label
                  key={teamUser._id}
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTeam.includes(teamUser._id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTeam.includes(teamUser._id)}
                    onChange={() => handleTeamSelection(teamUser._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {teamUser.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {teamUser.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {teamUser.role} • {teamUser.email}
                      </p>
                    </div>
                  </div>
                </motion.label>
              ))}
            </div>
            
            <div className="mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected: {selectedTeam.length} team member{selectedTeam.length !== 1 ? 's' : ''}
              </p>
            </div>
          </Card>

          <Card className="p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Assignment Instructions
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comments and Instructions
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Provide instructions or comments for the assigned team..."
              />
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => navigate(`/hira/assessments/${id}`)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={Send}
                onClick={handleAssign}
                loading={isLoading}
                disabled={selectedTeam.length === 0}
              >
                Assign Assessment
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Assessment Details
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assessment Number
                </label>
                <p className="mt-1 text-gray-900 dark:text-white font-mono">
                  {currentAssessment?.assessmentNumber}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {currentAssessment?.title}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Plant
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {currentAssessment?.plantId?.name}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Process
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {currentAssessment?.process}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Assignment Guidelines
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Select experienced team members familiar with the process</p>
              <p>• Include safety representatives and area experts</p>
              <p>• Ensure diverse perspectives in hazard identification</p>
              <p>• Team will receive notification once assigned</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HIRAAssignment;