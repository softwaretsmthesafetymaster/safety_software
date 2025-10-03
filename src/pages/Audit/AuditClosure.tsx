import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  AlertTriangle,
  FileText,
  BarChart3,
  Settings,
  Save,
  ArrowLeft,
  Download,
  Users
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchAuditById, closeAudit } from '../../store/slices/auditSlice';
import { addNotification } from '../../store/slices/uiSlice';
import Card from '../../components/UI/Card';
import { Link } from 'react-router-dom';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || '/api';
const AuditClosure: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentAudit, isLoading } = useAppSelector((state) => state.audit);
  
  const [observations, setObservations] = useState<any[]>([]);
  const [closureComments, setClosureComments] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchAuditById({ companyId: user.companyId, id }));
      fetchObservations();
    }
  }, [dispatch, id, user?.companyId]);

  const fetchObservations = async () => {
    console.log("user",user)
    console.log("id",id)
    if (!user?.companyId || !id) return;
    
    try {
      console.log("ch")
      const response=await axios.get(`${API_URL}/observations/${user?.companyId}/audit/${id}`);
      const data=await response.data;
      setObservations(data.observations || []);
    } catch (error) {
      console.error('Failed to fetch observations:', error);
    }
  };

  const handleCloseAudit = async () => {
    if (!user?.companyId || !id) return;
    
    // Check if all observations are approved
    const pendingObservations = observations.filter(obs => obs.status !== 'approved');
    if (pendingObservations.length > 0) {
      dispatch(addNotification({
        type: 'error',
        message: `Cannot close audit. ${pendingObservations.length} observations are still pending approval.`
      }));
      return;
    }

    try {
      setIsClosing(true);
      await dispatch(closeAudit({
        companyId: user.companyId,
        id,
        closureComments
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'Audit closed successfully'
      }));
      
      navigate(`/audit/audits/${id}`);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to close audit'
      }));
    } finally {
      setIsClosing(false);
    }
  };

  const getObservationStats = () => {
    const total = observations.length;
    const approved = observations.filter(obs => obs.status === 'approved').length;
    const completed = observations.filter(obs => obs.status === 'completed').length;
    const assigned = observations.filter(obs => obs.status === 'assigned').length;
    const open = observations.filter(obs => obs.status === 'open').length;
    
    return { total, approved, completed, assigned, open };
  };

  const getRiskStats = () => {
    const riskCounts = observations.reduce((acc, obs) => {
      acc[obs.riskLevel] = (acc[obs.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return riskCounts;
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!currentAudit) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Audit not found
        </h3>
        <Button
          onClick={() => navigate('/audit/audits')}
          variant="primary"
          className="mt-4"
        >
          Back to Audits
        </Button>
      </div>
    );
  }

  const observationStats = getObservationStats();
  console.log(observationStats);
  const riskStats = getRiskStats();
  const canClose = currentAudit.status === 'completed' && observationStats.approved === observationStats.total;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate(`/audit/audits/${id}`)}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Close Audit
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {currentAudit.auditNumber} - {currentAudit.title}
            </p>
          </div>
        </div>
      </div>

      {/* Closure Readiness Check */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          Closure Readiness
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentAudit.status === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <CheckCircle className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Audit Status: Completed
              </span>
            </div>
            <span className={`text-sm ${currentAudit.status === 'completed' ? 'text-green-600' : 'text-gray-500'}`}>
              {currentAudit.status === 'completed' ? '✓ Ready' : '✗ Not Ready'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                observationStats.approved === observationStats.total && observationStats.total > 0
                  ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                All Observations Approved
              </span>
            </div>
            <span className={`text-sm ${
              observationStats.approved === observationStats.total && observationStats.total > 0
                ? 'text-green-600' : 'text-gray-500'
            }`}>
              {observationStats.approved}/{observationStats.total} Approved
            </span>
          </div>

          {!canClose && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Audit cannot be closed yet
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <ul className="list-disc list-inside space-y-1">
                      {currentAudit.status !== 'completed' && (
                        <li>Audit must be marked as completed</li>
                      )}
                      {observationStats.total > 0 && observationStats.approved < observationStats.total && (
                        <li>{observationStats.total - observationStats.approved} observations need approval</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Audit Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Compliance Summary
          </h2>
          
          {currentAudit.summary ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(currentAudit.summary.compliancePercentage || 0)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Overall Compliance</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentAudit.summary.totalQuestions || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Questions</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {currentAudit.summary.yesAnswers || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Compliant</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {currentAudit.summary.noAnswers || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Non-Compliant</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>Checklist not completed yet</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Observations Summary
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {observationStats.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {observationStats.approved}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Approved</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                <span className="text-gray-900 dark:text-white">{observationStats.completed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Assigned:</span>
                <span className="text-gray-900 dark:text-white">{observationStats.assigned}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Open:</span>
                <span className="text-gray-900 dark:text-white">{observationStats.open}</span>
              </div>
            </div>

            {Object.keys(riskStats).length > 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Risk Distribution</h3>
                <div className="space-y-2">
                  {Object.entries(riskStats).map(([risk, count]) => (
                    <div key={risk} className="flex justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          risk === 'low' ? 'bg-green-500' :
                          risk === 'medium' ? 'bg-yellow-500' :
                          risk === 'high' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {risk.replace('_', ' ')}:
                        </span>
                      </div>
                      <span className="text-gray-900 dark:text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Closure Form */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Audit Closure
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Closure Comments
            </label>
            <textarea
              value={closureComments}
              onChange={(e) => setClosureComments(e.target.value)}
              rows={6}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Provide final comments about the audit completion, key findings, and overall assessment..."
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Audit Closure Summary
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>• Audit conducted from {format(new Date(currentAudit.scheduledDate), 'MMM dd, yyyy')} to {format(new Date(), 'MMM dd, yyyy')}</p>
              <p>• {currentAudit.summary?.totalQuestions || 0} checklist items reviewed with {Math.round(currentAudit.summary?.compliancePercentage || 0)}% compliance</p>
              <p>• {observationStats.total} observations identified and {observationStats.approved} approved</p>
              <p>• All corrective actions have been completed and verified</p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <Button
              variant="secondary"
              onClick={() => navigate(`/audit/audits/${id}`)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={CheckCircle}
              loading={isClosing}
              onClick={handleCloseAudit}
              disabled={!canClose}
            >
              Close Audit
            </Button>
          </div>
        </div>
      </Card>

      {/* Pending Observations Warning */}
      {!canClose && observationStats.total > 0 && (
        <Card className="p-6 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Pending Actions Required
          </h3>
          
          <div className="space-y-3">
            {observationStats.open > 0 && (
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                • {observationStats.open} observations need to be assigned to responsible persons
              </p>
            )}
            {observationStats.assigned > 0 && (
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                • {observationStats.assigned} observations are assigned but not completed
              </p>
            )}
            {observationStats.completed > 0 && (
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                • {observationStats.completed} observations are completed but need approval
              </p>
            )}
          </div>
          
          <div className="mt-4">
            <Button
              as={Link}
              to={`/audit/audits/${id}/manage`}
              variant="secondary"
              size="sm"
              icon={Settings}
            >
              Manage Observations
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AuditClosure;