import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, Download, Printer as Print, AlertTriangle, MapPin, Calendar, Users, FileText, Clock, CheckCircle, User } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchIncidentById } from '../../store/slices/incidentSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';

const IncidentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentIncident, isLoading } = useAppSelector((state) => state.incident);

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchIncidentById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!currentIncident) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Incident not found
        </h3>
        <Button
          as={Link}
          to="/ims/incidents"
          variant="primary"
          className="mt-4"
        >
          Back to Incidents
        </Button>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'investigating':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending_closure':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'open':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentIncident.incidentNumber}
            </h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(currentIncident.severity)}`}>
              <AlertTriangle className="h-4 w-4 mr-1" />
              {currentIncident.severity.toUpperCase()}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentIncident.status)}`}>
              {currentIncident.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {currentIncident.plantId?.name} • Reported {format(new Date(currentIncident.createdAt), 'MMM dd, yyyy')}
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
            to={`/ims/incidents/${id}/edit`}
            variant="primary"
            icon={Edit}
          >
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Overview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Incident Overview
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentIncident.type.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
                {currentIncident.classification && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Classification
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {currentIncident.classification.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {currentIncident.description}
                </p>
              </div>
              {currentIncident.immediateActions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Immediate Actions Taken
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentIncident.immediateActions}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Location & Time */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location & Time
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Area
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {currentIncident.location?.area}
                </p>
                {currentIncident.location?.specificLocation && (
                  <>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-3">
                      Specific Location
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {currentIncident.location.specificLocation}
                    </p>
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date & Time
                </label>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    {format(new Date(currentIncident.dateTime), 'EEEE, MMMM dd, yyyy')}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <Clock className="inline h-4 w-4 mr-1" />
                    {format(new Date(currentIncident.dateTime), 'HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* People Involved */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              People Involved
            </h2>
            <div className="space-y-6">
              {/* Affected Persons */}
              {currentIncident.affectedPersons && currentIncident.affectedPersons.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Affected Persons ({currentIncident.affectedPersons.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentIncident.affectedPersons.map((person, index) => (
                      <div key={index} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <User className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {person.name}
                            </p>
                            {person.role && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Role: {person.role}
                              </p>
                            )}
                            {person.injuryDetails && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Injury: {person.injuryDetails}
                              </p>
                            )}
                            {person.bodyPart && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Body Part: {person.bodyPart}
                              </p>
                            )}
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                person.medicalAttention
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {person.medicalAttention ? 'Medical Attention Required' : 'No Medical Attention'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Witnesses */}
              {currentIncident.witnesses && currentIncident.witnesses.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Witnesses ({currentIncident.witnesses.length})
                  </h3>
                  <div className="space-y-3">
                    {currentIncident.witnesses.map((witness, index) => (
                      <div key={index} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <User className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {witness.name}
                            </p>
                            {witness.contact && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Contact: {witness.contact}
                              </p>
                            )}
                            {witness.statement && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                Statement: {witness.statement}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Investigation */}
          {currentIncident.investigation && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Investigation
              </h2>
              <div className="space-y-4">
                {currentIncident.investigation.assignedTo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Assigned To
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {currentIncident.investigation.assignedTo.name}
                    </p>
                  </div>
                )}
                
                {currentIncident.investigation.findings && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Findings
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {currentIncident.investigation.findings}
                    </p>
                  </div>
                )}

                {currentIncident.investigation.rootCause && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Root Cause Analysis
                    </label>
                    <div className="mt-1 space-y-2">
                      {currentIncident.investigation.rootCause.immediate && (
                        <p className="text-sm text-gray-900 dark:text-white">
                          <strong>Immediate:</strong> {currentIncident.investigation.rootCause.immediate}
                        </p>
                      )}
                      {currentIncident.investigation.rootCause.underlying && (
                        <p className="text-sm text-gray-900 dark:text-white">
                          <strong>Underlying:</strong> {currentIncident.investigation.rootCause.underlying}
                        </p>
                      )}
                      {currentIncident.investigation.rootCause.rootCause && (
                        <p className="text-sm text-gray-900 dark:text-white">
                          <strong>Root Cause:</strong> {currentIncident.investigation.rootCause.rootCause}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Corrective Actions */}
          {currentIncident.correctiveActions && currentIncident.correctiveActions.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Corrective Actions
              </h2>
              <div className="space-y-4">
                {currentIncident.correctiveActions.map((action, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {action.action}
                        </p>
                        {action.assignedTo && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Assigned to: {action.assignedTo.name}
                          </p>
                        )}
                        {action.dueDate && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Due: {format(new Date(action.dueDate), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        action.status === 'completed' ? 'bg-green-100 text-green-800' :
                        action.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {action.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
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
              {currentIncident.status === 'open' && (
                <Button
                  as={Link}
                  to={`/ims/incidents/${id}/assign`}
                  variant="primary"
                  className="w-full"
                  icon={Users}
                >
                  Assign Investigation
                </Button>
              )}
              {currentIncident.status === 'investigating' && (
              
                  <Button
                    as={Link}
                    to={`/ims/incidents/${id}/investigation`}
                    variant="primary"
                    className="w-full"
                    icon={FileText}
                  >
                    Investigation
                  </Button>
                )}
                {currentIncident.status === 'rca_submitted' && (
                  <Button
                    as={Link}
                    to={`/ims/incidents/${id}/actions`}
                    variant="secondary"
                    className="w-full"
                    icon={Users}
                  >
                    Assign Actions
                  </Button>
                
                )}
              {currentIncident.status === 'pending_closure' && (
                <Button
                  variant="success"
                  className="w-full"
                  icon={CheckCircle}
                  onClick={() => {
                    navigate(`/ims/incidents/${id}/close`);
                  }}
                >
                  Approve Closure
                </Button>
              )}
              <Button
                variant="secondary"
                className="w-full"
                icon={Download}
                onClick={() => {
                  // Handle export
                }}
              >
                Generate Report
              </Button>
            </div>
          </Card>

          {/* Incident Timeline */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Incident Reported
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {format(new Date(currentIncident.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    By {currentIncident.reportedBy?.name}
                  </p>
                </div>
              </div>
              
              {currentIncident.investigation?.assignedTo && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Investigation Assigned
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      To {currentIncident.investigation.assignedTo.name}
                    </p>
                  </div>
                </div>
              )}

              {currentIncident.status === 'closed' && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Incident Closed
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {format(new Date(currentIncident.updatedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Incident Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Incident Information
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Reported:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(currentIncident.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Reported by:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentIncident.reportedBy?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Plant:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentIncident.plantId?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last updated:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(currentIncident.updatedAt), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetails;