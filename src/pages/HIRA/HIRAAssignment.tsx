import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Users,
  MessageSquare,
  UserCheck,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Building2,
  Target,
  FileText,
  Search,
  Filter
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { assignHIRA, fetchHIRAById } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';
import { fetchUsers } from '../../store/slices/userSlice';
import { format, addDays } from 'date-fns';

const HIRAAssignment: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentAssessment, isLoading } = useAppSelector((state) => state.hira);
  const { users } = useAppSelector((state) => state.user);
  
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [comments, setComments] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchHIRAById({ companyId: user.companyId, id }));
      dispatch(fetchUsers({ plantId: user?.plantId?._id,companyId:user.companyId }));
    }
  }, [dispatch, id, user?.companyId]);

  useEffect(() => {
    if (currentAssessment?.team) {
      setSelectedTeam(currentAssessment.team.map((member: any) => member._id));
    }
    // Set default due date to 7 days from now
    setDueDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  }, [currentAssessment]);

  const handleTeamSelection = (userId: string) => {
    setSelectedTeam(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllFilteredUsers = () => {
    const filteredUserIds = filteredUsers.map(u => u._id);
    setSelectedTeam(filteredUserIds);
  };

  const clearSelection = () => {
    setSelectedTeam([]);
  };

  const handleAssign = async () => {
    if (selectedTeam.length === 0) {
      dispatch(addNotification({
        type: 'warning',
        message: 'Please select at least one team member'
      }));
      return;
    }

    if (!dueDate) {
      dispatch(addNotification({
        type: 'warning',
        message: 'Please set a due date for the assessment'
      }));
      return;
    }

    try {
      await dispatch(assignHIRA({
        companyId: user?.companyId!,
        id: id!,
        team: selectedTeam,
        comments,
        dueDate,
        priority
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

  const getEstimatedHours = () => {
    const baseHours = 4; // Base time for assessment
    const teamSizeMultiplier = Math.max(0.5, 1 - (selectedTeam.length - 1) * 0.1);
    return Math.round(baseHours * teamSizeMultiplier);
  };

  const getRecommendedTeamSize = () => {
    if (currentAssessment?.riskSummary?.totalTasks <= 10) return "3-5 members";
    if (currentAssessment?.riskSummary?.totalTasks <= 20) return "4-6 members";
    return "5-8 members";
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <UserCheck className="h-4 w-4" />;
      case 'safety_incharge':
        return <AlertTriangle className="h-4 w-4" />;
      case 'hod':
        return <Target className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const filteredUsers = users.filter(u => {
    if (u._id === user?._id) return false; // Exclude current user
    
    const matchesSearch = !searchTerm || 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRole = !roleFilter || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Assign HIRA Assessment
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {currentAssessment?.title} - {currentAssessment?.assessmentNumber}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              icon={showDetails ? CheckCircle : FileText}
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </motion.div>

        {/* Assessment Details (collapsible) */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Assessment Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-8 w-8 text-blue-500" />
                      <div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">Plant</div>
                        <div className="font-semibold text-blue-900 dark:text-blue-100">
                          {currentAssessment?.plantId?.name}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-green-500" />
                      <div>
                        <div className="text-sm text-green-700 dark:text-green-300">Total Tasks</div>
                        <div className="font-semibold text-green-900 dark:text-green-100">
                          {currentAssessment?.riskSummary?.totalTasks || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                      <div>
                        <div className="text-sm text-red-700 dark:text-red-300">High Risk</div>
                        <div className="font-semibold text-red-900 dark:text-red-100">
                          {currentAssessment?.riskSummary?.highRiskCount || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-8 w-8 text-purple-500" />
                      <div>
                        <div className="text-sm text-purple-700 dark:text-purple-300">Est. Time</div>
                        <div className="font-semibold text-purple-900 dark:text-purple-100">
                          {getEstimatedHours()}h
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assignment Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Team Selection */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Select Team Members
                </h2>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllFilteredUsers}
                    disabled={filteredUsers.length === 0}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    disabled={selectedTeam.length === 0}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search team members..."
                    className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <select
                  className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="safety_incharge">Safety In-charge</option>
                  <option value="hod">Head of Department</option>
                  <option value="user">Team Member</option>
                </select>
              </div>
              
              {/* Team Members Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {filteredUsers.map((teamUser) => (
                    <motion.label
                      key={teamUser._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedTeam.includes(teamUser._id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
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
                      
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">
                            {teamUser.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {teamUser.name}
                            </p>
                            {getRoleIcon(teamUser.role)}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {teamUser.role?.replace('_', ' ').toUpperCase()} • {teamUser.email}
                          </p>
                        </div>
                      </div>
                    </motion.label>
                  ))}
                </AnimatePresence>
              </div>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No team members found matching your criteria</p>
                </div>
              )}
              
              <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: <span className="font-semibold">{selectedTeam.length}</span> team member{selectedTeam.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Recommended: {getRecommendedTeamSize()}
                </span>
              </div>
            </Card>

            {/* Assignment Instructions */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Assignment Details
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority Level
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instructions and Comments
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Provide detailed instructions for the team about this HIRA assessment..."
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Include specific requirements, deadlines, and any special considerations for this assessment.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
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
                    disabled={selectedTeam.length === 0 || !dueDate}
                    className="min-w-32"
                  >
                    Assign Assessment
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Assignment Summary
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Assessment ID</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">
                    {currentAssessment?.assessmentNumber}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Team Size</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedTeam.length} member{selectedTeam.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Est. Completion</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {dueDate ? format(new Date(dueDate), 'MMM dd, yyyy') : 'Not set'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Est. Hours</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {getEstimatedHours()} hours
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Priority</span>
                  <span className={`text-sm font-semibold px-2 py-1 rounded ${
                    priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                    priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Assignment Guidelines */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Assignment Guidelines
              </h3>
              
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <p>Select team members with relevant expertise and experience</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <p>Include safety representatives and area experts</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <p>Ensure diverse perspectives for thorough hazard identification</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <p>Set realistic deadlines considering team availability</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <p>Team will receive notifications once assigned</p>
                </div>
              </div>
            </Card>

            {/* Process Timeline */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Process Timeline
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Assignment</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Team receives notification</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-semibold text-sm">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Completion</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Team completes worksheet</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Review</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Admin reviews & approves</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">4</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Actions</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Implement recommendations</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HIRAAssignment;