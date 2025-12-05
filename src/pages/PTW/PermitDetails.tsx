import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { CreditCard as Edit, Download, CheckCircle, XCircle, Clock, MapPin, Calendar, Users, AlertTriangle, Shield, FileText, ArrowRight, PlayCircle } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchPermitById } from '../../store/slices/permitSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';
import { useExport } from '../../hooks/permit/useExport';
import DownloadButton from '../../components/UI/DownloadButton';

const PermitDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentPermit, isLoading } = useAppSelector((state) => state.permit);
  const { exportItem, isExporting } = useExport();

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchPermitById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const handleExport = async (format: 'pdf' | 'excel' | 'word') => {
    if (!currentPermit) return;
    
    try {
      await exportItem(currentPermit, 'permit', format);
      toast.success(`Permit exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      toast.error('Failed to export permit');
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!currentPermit) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Permit not found
        </h3>
        <Link to="/ptw/permits">
          <Button variant="primary" className="mt-4">
            Back to Permits
          </Button>
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'stopped':
        return 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100';
      case 'pending_closure':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'draft':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return CheckCircle;
      case 'expired':
      case 'rejected':
      case 'stopped':
        return XCircle;
      case 'submitted':
      case 'pending_closure':
        return Clock;
      default:
        return FileText;
    }
  };

  const StatusIcon = getStatusIcon(currentPermit.status);

  // Check user permissions for actions
  const canEdit = currentPermit.status === 'draft' && 
                 String(currentPermit.requestedBy._id) === String(user?._id);
  
  const canApprove = currentPermit.status === 'submitted' && 
                    currentPermit.approvals?.some(a => 
                      a.status === 'pending' && 
                      String(a.approver?._id) === String(user?._id)
                    );

  const canActivate = currentPermit.status === 'approved' && 
                     String(currentPermit.requestedBy._id) === String(user?._id);

  const canClose = currentPermit.status === 'active' && 
                  String(currentPermit.requestedBy._id) === String(user?._id);

  const canStop = currentPermit.status === 'active' && 
                 (currentPermit.stopWorkRoles?.some(r => r.role === user?.role) ||
                  ['hod', 'safety_incharge', 'plant_head', 'admin'].includes(user?.role || ''));

  const canExtend = ['expired'].includes(currentPermit.status) &&
                   currentPermit?.requestedBy?._id===user?._id

  const canApproveCloser = currentPermit.status === 'pending_closure' &&
                          ['hod', 'safety_incharge','plant_head'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentPermit.permitNumber}
            </h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentPermit.status)}`}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {currentPermit.status.toUpperCase().replace('_', ' ')}
            </span>
            {currentPermit.isHighRisk && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                HIGH RISK
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {currentPermit.plantId?.name} - {currentPermit?.areaId?.name} • Created {format(new Date(currentPermit.createdAt), 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <DownloadButton handleExport={handleExport} isLoading={isExporting} />
          
          {canEdit && (
            <Link to={`/ptw/permits/${id}/edit`}>
              <Button variant="primary" icon={Edit}>
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Work Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Permit Types
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {currentPermit.types?.map((type, index) => (
                    <span
                      key={index}
                      className="inline-flex px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                    >
                      {type.replace('_', ' ').toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Work Description
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {currentPermit.workDescription}
                </p>
              </div>
            </div>
          </Card>

          {/* Location & Schedule */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location & Schedule
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {currentPermit.location?.area}
                </p>
                {currentPermit.location?.specificLocation && (
                  <>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-3">
                      Specific Location
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {currentPermit.location.specificLocation}
                    </p>
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Schedule
                </label>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Start: {format(new Date(currentPermit.schedule?.startDate), 'MMM dd, yyyy HH:mm')}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    End: {format(new Date(currentPermit.schedule?.endDate), 'MMM dd, yyyy HH:mm')}
                  </p>
                  {currentPermit.expiresAt && (
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Expires: {format(new Date(currentPermit.expiresAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                  {currentPermit.schedule?.shift && (
                    <p className="text-sm text-gray-900 dark:text-white">
                      Shift: {currentPermit.schedule.shift.toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Personnel */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Personnel
            </h2>
            <div className="space-y-6">
              {/* Contractor */}
              {currentPermit.contractor && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contractor
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {currentPermit.contractor.name}
                    </p>
                    {currentPermit.contractor.contact && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Contact: {currentPermit.contractor.contact}
                      </p>
                    )}
                    {currentPermit.contractor.license && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        License: {currentPermit.contractor.license}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Workers */}
              {currentPermit.workers && currentPermit.workers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Workers ({currentPermit.workers.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentPermit.workers.map((worker, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {worker.name}
                        </p>
                        {worker.id && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ID: {worker.id}
                          </p>
                        )}
                        {worker.contact && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Contact: {worker.contact}
                          </p>
                        )}
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            worker.medicalFitness
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {worker.medicalFitness ? 'Medical Fit' : 'Medical Fitness Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Safety Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Safety Information
            </h2>
            <div className="space-y-6">
              {/* Hazards */}
              {currentPermit.hazards && currentPermit.hazards.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Identified Hazards
                  </h3>
                  <div className="space-y-3">
                    {currentPermit.hazards.map((hazard, index) => (
                      <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {hazard.type}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Mitigation: {hazard.mitigation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PPE */}
              {currentPermit.ppe && currentPermit.ppe.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PPE Requirements
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {currentPermit.ppe.map((ppe, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className={`h-4 w-4 ${ppe.required ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={`text-sm ${ppe.required ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                          {ppe.item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Checklist */}
              {currentPermit.safetyChecklist && currentPermit.safetyChecklist.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Safety Checklist
                  </h3>
                  <div className="space-y-3">
                    {currentPermit.safetyChecklist.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="mt-1">
                          {item.checked ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {item.item}
                          </p>
                          {item.remarks && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Remarks: {item.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Digital Signatures */}
          {currentPermit.signatures && currentPermit.signatures.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Digital Signatures
              </h2>
              <div className="space-y-4">
                {currentPermit.signatures.map((signature, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {signature.user?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {signature.role}
                      </p>
                      

                    </div>
                    {signature.signature && (
                      <img 
                        src={signature.signature} 
                        alt="Digital Signature" 
                        className="max-h-16 max-w-32 border border-gray-300 dark:border-gray-600 rounded"
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Approval Status */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Approval Status
            </h2>
            <div className="space-y-4">
              {currentPermit.approvals && currentPermit.approvals.length > 0 ? (
                currentPermit.approvals.map((approval, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      approval.status === 'approved' ? 'bg-green-100 text-green-600' :
                      approval.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {approval.status === 'approved' ? <CheckCircle className="h-4 w-4" /> :
                       approval.status === 'rejected' ? <XCircle className="h-4 w-4" /> :
                       <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {approval.label || `Step ${approval.step}`}
                      </p>
                      {approval.approver && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {approval.approver.name} ({approval.approver.role})
                        </p>
                      )}
                      {approval.timestamp && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(approval.timestamp), 'MMM dd, yyyy HH:mm')}
                        </p>
                      )}
                      {approval.comments && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {approval.comments}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No approvals required
                </p>
              )}
            </div>
          </Card>


          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {/* Draft → Submit */}
              {currentPermit.status === "draft" && canEdit && (
                <Link to={`/ptw/permits/${id}/submit`}>
                  <Button
                    variant="primary"
                    className="w-full"
                    icon={ArrowRight}
                  >
                    Submit for Approval
                  </Button>
                </Link>
              )}

              {/* Submitted → Approve */}
              {canApprove && (
                <Link to={`/ptw/permits/${id}/approve`}>
                  <Button
                    variant="success"
                    className="w-full"
                    icon={CheckCircle}
                  >
                    Review & Approve
                  </Button>
                </Link>
              )}

              {/* Approved → Activate */}
              {canActivate && (
                <Link to={`/ptw/permits/${id}/activate`}>
                  <Button
                    variant="success"
                    className="w-full"
                    icon={PlayCircle}
                  >
                    Activate Permit
                  </Button>
                </Link>
              )}

              {/* Active → Close */}
              {canClose && (
                <Link to={`/ptw/permits/${id}/close`}>
                  <Button
                    variant="primary"
                    className="w-full"
                    icon={CheckCircle}
                  >
                    Close Permit
                  </Button>
                </Link>
              )}

              {/* Active → Emergency Stop */}
              {canStop && (
                <Link to={`/ptw/permits/${id}/stop`}>
                  <Button
                    variant="danger"
                    className="w-full"
                    icon={XCircle}
                  >
                    Emergency Stop
                  </Button>
                </Link>
              )}

              {/* Extend Permit */}
              {canExtend && (
                <Link to={`/ptw/permits/${id}/extend`}>
                  <Button
                    variant="secondary"
                    className="w-full"
                    icon={Clock}
                  >
                    Extend Permit
                  </Button>
                </Link>
              )}

              {/* Approve Closure */}
              {canApproveCloser && (
                <Link to={`/ptw/permits/${id}/close`}>
                  <Button
                    variant="primary"
                    className="w-full"
                    icon={CheckCircle}
                  >
                    Approve Closure
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          

          {/* Permit Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Permit Information
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(currentPermit.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Requested by:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentPermit.requestedBy?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Plant:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentPermit.plantId?.name}
                </span>
              </div>
              {currentPermit.activatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Activated:</span>
                  <span className="text-gray-900 dark:text-white">
                    {format(new Date(currentPermit.activatedAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              )}
              {currentPermit.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last updated:</span>
                  <span className="text-gray-900 dark:text-white">
                    {format(new Date(currentPermit.updatedAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Extension History */}
          {currentPermit.extensions && currentPermit.extensions.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Extension History
              </h2>
              <div className="space-y-3">
                {currentPermit.extensions.map((extension, index) => (
                  <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          +{extension.hours} hours
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {extension.reason}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(extension.requestedAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Approved
                      </span>
                    </div>
                    {extension.comments && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {extension.comments}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermitDetails;