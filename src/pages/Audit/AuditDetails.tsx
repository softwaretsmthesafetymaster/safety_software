import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Edit, 
  Download, 
  Printer as Print, 
  CheckSquare, 
  Users, 
  Calendar, 
  FileText, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchAuditById } from '../../store/slices/auditSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';

const AuditDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentAudit, isLoading } = useAppSelector((state) => state.audit);

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchAuditById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!currentAudit) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Audit not found
        </h3>
        <Button
          as={Link}
          to="/audit/audits"
          variant="primary"
          className="mt-4"
        >
          Back to Audits
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'planned':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
        return Clock;
      case 'planned':
        return Calendar;
      default:
        return FileText;
    }
  };

  const StatusIcon = getStatusIcon(currentAudit.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentAudit.auditNumber}
            </h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentAudit.status)}`}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {currentAudit.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {currentAudit.plantId?.name} • {currentAudit.standard}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            icon={Print}
          >
            Print
          </Button>
          <Button
            variant="secondary"
            icon={Download}
          >
            Download Report
          </Button>
          <Button
            as={Link}
            to={`/audit/audits/${id}/checklist`}
            variant="primary"
            icon={CheckSquare}
          >
            Audit Checklist
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Audit Overview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Audit Overview
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Audit Type
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentAudit.type.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Standard
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentAudit.standard}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {currentAudit.title}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Scope
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {currentAudit.scope}
                </p>
              </div>
            </div>
          </Card>

          {/* Audit Team */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Audit Team
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lead Auditor
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {currentAudit.auditor?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {currentAudit.auditor?.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {currentAudit.auditor?.email}
                    </p>
                  </div>
                </div>
              </div>

              {currentAudit.auditTeam && currentAudit.auditTeam.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Team Members ({currentAudit.auditTeam.length})
                  </label>
                  <div className="space-y-2">
                    {currentAudit.auditTeam.map((member: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {member.member?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.member?.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {member.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentAudit.auditee && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auditee
                  </label>
                  <div className="mt-1 flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {currentAudit.auditee?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentAudit.auditee?.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {currentAudit.auditee?.role}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Audit Areas */}
          {currentAudit.areas && currentAudit.areas.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Areas to be Audited
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentAudit.areas.map((area: any, index: number) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {area.name}
                    </p>
                    {area.inCharge && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        In-charge: {area.inCharge?.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Compliance Summary */}
          {currentAudit.summary && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Compliance Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentAudit.summary.totalItems || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {currentAudit.summary.compliant || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Compliant</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {currentAudit.summary.nonCompliant || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Non-Compliant</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(currentAudit.summary.compliancePercentage || 0)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Compliance</div>
                </div>
              </div>
            </Card>
          )}

          {/* Findings */}
          {currentAudit.findings && currentAudit.findings.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Findings & Corrective Actions
              </h2>
              <div className="space-y-4">
                {currentAudit.findings.map((finding: any, index: number) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            finding.type === 'non_compliance' ? 'bg-red-100 text-red-800' :
                            finding.type === 'observation' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {finding.type.replace('_', ' ').toUpperCase()}
                          </span>
                          {finding.severity && (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              finding.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              finding.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {finding.severity.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {finding.description}
                        </p>
                        {finding.clause && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Clause: {finding.clause}
                          </p>
                        )}
                        {finding.evidence && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Evidence: {finding.evidence}
                          </p>
                        )}
                        {finding.recommendation && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Recommendation: {finding.recommendation}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Corrective Action */}
                    {finding.correctiveAction && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Corrective Action
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {finding.correctiveAction.action}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-4">
                            {finding.correctiveAction.assignedTo && (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Assigned to: {finding.correctiveAction.assignedTo.name}
                              </span>
                            )}
                            {finding.correctiveAction.dueDate && (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Due: {format(new Date(finding.correctiveAction.dueDate), 'MMM dd, yyyy')}
                              </span>
                            )}
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            finding.correctiveAction.status === 'closed' ? 'bg-green-100 text-green-800' :
                            finding.correctiveAction.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {finding.correctiveAction.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              {currentAudit.status === 'planned' && (
                <Button
                  variant="primary"
                  className="w-full"
                  icon={Clock}
                >
                  Start Audit
                </Button>
              )}
              {currentAudit.status === 'in_progress' && (
                <Button
                  as={Link}
                  to={`/audit/audits/${id}/checklist`}
                  variant="primary"
                  className="w-full"
                  icon={CheckSquare}
                >
                  Continue Checklist
                </Button>
              )}
              {currentAudit.status === 'completed' && (
                <Button
                  variant="success"
                  className="w-full"
                  icon={CheckCircle}
                >
                  Close Audit
                </Button>
              )}
              <Button
                variant="secondary"
                className="w-full"
                icon={Download}
              >
                Generate Report
              </Button>
            </div>
          </Card>

          {/* Audit Timeline */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Audit Scheduled
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {format(new Date(currentAudit.scheduledDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Audit Created
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {format(new Date(currentAudit.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    By {currentAudit.auditor?.name}
                  </p>
                </div>
              </div>

              {currentAudit.status === 'completed' && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Audit Completed
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {format(new Date(currentAudit.updatedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Audit Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Audit Information
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(currentAudit.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Auditor:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentAudit.auditor?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Plant:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentAudit.plantId?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Scheduled:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(currentAudit.scheduledDate), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last updated:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(currentAudit.updatedAt), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuditDetails;