import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Download,
  FileText,
  User,
  Calendar
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import { fetchPlantUsers } from '../../store/slices/userSlice';
import { reportService } from '../../services/audit/reportService';
import { format } from 'date-fns';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Observation {
  _id: string;
  observationNumber: string;
  observation: string;
  element: string;
  legalStandard: string;
  recommendation: string;
  riskLevel: string;
  riskScore: number;
  category: string;
  severity: string;
  responsiblePerson?: any;
  assignedBy: any;
  targetDate?: string;
  status: string;
  actionTaken?: string;
  completionEvidence?: string;
  completedBy?: any;
  completedAt?: string;
  approvedBy?: any;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

const ObservationManagement: React.FC = () => {
  const { auditId } = useParams<{ auditId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { plantUsers } = useAppSelector((state) => state.user);

  const [audit, setAudit] = useState<any>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    responsiblePerson: '',
    targetDate: ''
  });
  const [reviewData, setReviewData] = useState({
    action: 'approved' as 'approved' | 'rejected',
    rejectionReason: ''
  });

  useEffect(() => {
    if (auditId && user?.companyId) {
      fetchAuditAndObservations();
    }
  }, [auditId, user?.companyId]);

  useEffect(() => {
    if (user?.companyId && user?.plantId?._id) {
      dispatch(fetchPlantUsers({ companyId: user.companyId, plantId: user.plantId?._id }));
    }
  }, [user?.companyId, user?.plantId?._id]);

  const fetchAuditAndObservations = async () => {
    try {
      setIsLoading(true);
      const [auditResponse, observationsResponse] = await Promise.all([
        fetch(`${API_URL}/audits/${user?.companyId}/${auditId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${API_URL}/observations/${user?.companyId}/audit/${auditId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        setAudit(auditData.audit);
      }

      if (observationsResponse.ok) {
        const observationsData = await observationsResponse.json();
        setObservations(observationsData.observations || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to load audit data'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignResponsible = async () => {
    if (!selectedObservation || !assignmentData.responsiblePerson) return;

    try {
      const response = await fetch(`${API_URL}/observations/${user?.companyId}/${selectedObservation._id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(assignmentData)
      });

      if (response.ok) {
        dispatch(addNotification({
          type: 'success',
          message: 'Responsible person assigned successfully'
        }));
        setIsAssignModalOpen(false);
        setAssignmentData({ responsiblePerson: '', targetDate: '' });
        fetchAuditAndObservations();
      } else {
        throw new Error('Failed to assign responsible person');
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to assign responsible person'
      }));
    }
  };

  const handleReviewObservation = async () => {
    if (!selectedObservation) return;
  
    try {
      const response = await axios.patch(`${API_URL}/observations/${user?.companyId}/${selectedObservation._id}/review`, {
        status: reviewData.action,
        rejectionReason: reviewData.rejectionReason
      });
      if (response.status === 200){
        dispatch(addNotification({
          type: 'success',
          message: `Observation ${reviewData.action}d successfully`
        }));
        setIsReviewModalOpen(false);
        setReviewData({ action: 'approved', rejectionReason: '' });
        fetchAuditAndObservations();
      } else {
        throw new Error(`Failed to ${reviewData.action} observation`);
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Failed to ${reviewData.action} observation`
      }));
    }
  };

  const downloadReport = async (format: 'pdf' | 'excel' | 'word') => {
    if (!user?.companyId || !auditId) return;
    await reportService.downloadAuditReport({ format, auditId: auditId, companyId: user.companyId });
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'very_high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredObservations = observations.filter(obs => {
    const matchesSearch = obs.observation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obs.observationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || obs.status === statusFilter;
    const matchesRisk = !riskFilter || obs.riskLevel === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const getObservationStats = () => {
    const total = observations.length;
    const open = observations.filter(obs => obs.status === 'open').length;
    const assigned = observations.filter(obs => obs.status === 'assigned').length;
    const inProgress = observations.filter(obs => obs.status === 'in_progress').length;
    const completed = observations.filter(obs => obs.status === 'completed').length;
    const approved = observations.filter(obs => obs.status === 'approved').length;
    const rejected = observations.filter(obs => obs.status === 'rejected').length;
    
    return { total, open, assigned, inProgress, completed, approved, rejected };
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  const stats = getObservationStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate(`/audit/audits/${auditId}`)}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Observation Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {audit?.auditNumber} - {audit?.title}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadReport('pdf')}
            >
              PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadReport('excel')}
            >
              Excel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadReport('word')}
            >
              Word
            </Button>
          </div>
          <Button
            as={Link}
            to={`/audit/audits/${auditId}/observations`}
            variant="primary"
            icon={Plus}
          >
            Add Observation
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Open</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.open}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Assigned</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.assigned}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.inProgress}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.completed}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.approved}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.rejected}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Search observations..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Risk Level
            </label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Risk Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="very_high">Very High</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              icon={Filter}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setRiskFilter('');
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Observations Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Observation
                </th>
                <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Risk
                </th>
                <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Responsible Person
                </th>
                <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Target Date
                </th>
                <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status
                </th>
                <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredObservations.map((observation, index) => (
                <motion.tr
                  key={observation._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {observation.observationNumber}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {observation.observation.length > 100 
                          ? `${observation.observation.substring(0, 100)}...` 
                          : observation.observation}
                      </p>
                      {observation.element && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Element: {observation.element}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRiskColor(observation.riskLevel)}`}>
                        {observation.riskLevel.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ({observation.riskScore})
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    {observation.responsiblePerson ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {observation.responsiblePerson.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {observation.responsiblePerson.role}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="py-4">
                    {observation.targetDate ? (
                      <span className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(observation.targetDate), 'MMM dd, yyyy')}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Not set
                      </span>
                    )}
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(observation.status)}`}>
                      {observation.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => {
                          setSelectedObservation(observation);
                          setIsViewModalOpen(true);
                        }}
                      >
                        View
                      </Button>
                      
                      {(observation.status === 'open' || observation.status === 'reject') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={UserPlus}
                          onClick={() => {
                            setSelectedObservation(observation);
                            setIsAssignModalOpen(true);
                          }}
                        >
                          Assign
                        </Button>
                      )}
                      
                      {observation.status === 'completed' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            icon={CheckCircle}
                            onClick={() => {
                              setSelectedObservation(observation);
                              setReviewData({ action: 'approved', rejectionReason: '' });
                              setIsReviewModalOpen(true);
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={XCircle}
                            onClick={() => {
                              setSelectedObservation(observation);
                              setReviewData({ action: 'reject', rejectionReason: '' });
                              setIsReviewModalOpen(true);
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredObservations.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No observations found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter || riskFilter
                  ? 'No observations match your current filters.'
                  : 'No observations have been created for this audit yet.'}
              </p>
              <Button
                as={Link}
                to={`/audit/audits/${auditId}/observations`}
                variant="primary"
                icon={Plus}
              >
                Add First Observation
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Observation Details"
        size="xl"
      >
        {selectedObservation && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Observation Number:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedObservation.observationNumber}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Risk Level:
                </h4>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRiskColor(selectedObservation.riskLevel)}`}>
                  {selectedObservation.riskLevel.replace('_', ' ').toUpperCase()} ({selectedObservation.riskScore})
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Observation:
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                {selectedObservation.observation}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Element:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedObservation.element || 'Not specified'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Legal Standard:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedObservation.legalStandard || 'Not specified'}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Recommendation:
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                {selectedObservation.recommendation || 'No recommendation provided'}
              </p>
            </div>

            {selectedObservation.actionTaken && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Action Taken:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  {selectedObservation.actionTaken}
                </p>
              </div>
            )}

            {selectedObservation.completionEvidence && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Completion Evidence:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  {selectedObservation.completionEvidence}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Assignment Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Responsible Person"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Observation:
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              {selectedObservation?.observation}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Responsible Person *
            </label>
            <select
              value={assignmentData.responsiblePerson}
              onChange={(e) => setAssignmentData({ ...assignmentData, responsiblePerson: e.target.value })}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              required
            >
              <option value="">Select Responsible Person</option>
              {plantUsers.map((user:any) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Date
            </label>
            <input
              type="date"
              value={assignmentData.targetDate}
              onChange={(e) => setAssignmentData({ ...assignmentData, targetDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssignResponsible}
              disabled={!assignmentData.responsiblePerson}
            >
              Assign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`${reviewData.action === 'approved' ? 'Approve' : 'Reject'} Observation`}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Observation:
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              {selectedObservation?.observation}
            </p>
          </div>

          {selectedObservation?.actionTaken && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Action Taken:
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                {selectedObservation.actionTaken}
              </p>
            </div>
          )}

          {reviewData.action === 'rejected' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={reviewData.rejectionReason}
                onChange={(e) => setReviewData({ ...reviewData, rejectionReason: e.target.value })}
                rows={3}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Provide reason for rejection..."
                required
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={reviewData.action === 'approved' ? 'success' : 'danger'}
              onClick={handleReviewObservation}
              disabled={reviewData.action === 'rejected' && !reviewData.rejectionReason.trim()}
            >
              {reviewData.action === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ObservationManagement;