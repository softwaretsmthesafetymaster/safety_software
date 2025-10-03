import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Edit, 
  Download, 
  Users, 
  FileText, 
  Target,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Play,
  Image
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchHAZOPById, startHAZOPStudy, completeHAZOPStudy } from '../../store/slices/hazopSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { addNotification } from '../../store/slices/uiSlice';
import { format } from 'date-fns';
import { useExport } from '../../hooks/useExport';
import ExportService from '../../services/exportService';
const HAZOPDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentStudy, isLoading } = useAppSelector((state) => state.hazop);
  const { currentCompany } = useAppSelector((state) => state.company);
  const { exportItem, isExporting } = useExport();

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchHAZOPById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const handleStartStudy = async () => {
    if (!user?.companyId || !id) return;

    try {
      await dispatch(startHAZOPStudy({ companyId: user.companyId, id })).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'HAZOP study started successfully'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to start study'
      }));
    }
  };

  const handleCompleteStudy = async () => {
    if (!user?.companyId || !id) return;

    try {
      await dispatch(completeHAZOPStudy({ companyId: user.companyId, id })).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'HAZOP study completed successfully'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to complete study'
      }));
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'word') => {
    if (!currentStudy) return;
    
    try {
  
      await ExportService.exportHAZOPStudy({ study: currentStudy, format });
      dispatch(addNotification({
        type: 'success',
        message: `HAZOP study exported as ${format.toUpperCase()} successfully`
      }));
    } catch (error) {
      console.log(error)
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to export HAZOP study'
      }));
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!currentStudy) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          HAZOP study not found
        </h3>
        <Button
          as={Link}
          to="/hazop/studies"
          variant="primary"
          className="mt-4"
        >
          Back to Studies
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

  // Check if user can perform actions based on config
  const hazopConfig = currentCompany?.config?.hazop;
  const canStart = hazopConfig?.teamRoles?.facilitator?.includes(user?.role || '') && currentStudy.status === 'planned';
  const canComplete = hazopConfig?.teamRoles?.facilitator?.includes(user?.role || '') && currentStudy.status === 'in_progress';
  const canClose = hazopConfig?.teamRoles?.chairman?.includes(user?.role || '') && currentStudy.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentStudy.studyNumber}
            </h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentStudy.status)}`}>
              {currentStudy.status === 'completed' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Clock className="h-4 w-4 mr-1" />}
              {currentStudy.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {currentStudy.plantId?.name} • {currentStudy.methodology}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExport('pdf')}
              loading={isExporting}
            >
              PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExport('excel')}
              loading={isExporting}
            >
              Excel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExport('word')}
              loading={isExporting}
            >
              Word
            </Button>
          </div>
          <Button
            as={Link}
            to={`/hazop/studies/${id}/worksheet`}
            variant="primary"
            icon={Target}
          >
            Open Worksheet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Study Overview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Study Overview
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {currentStudy.title}
                </p>
              </div>
              {currentStudy.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentStudy.description}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Methodology
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentStudy.methodology}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Facilitator
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentStudy.facilitator?.name}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Process Information */}
          {currentStudy.process && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Process Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Process Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentStudy.process.name}
                  </p>
                </div>
                {currentStudy.process.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Process Description
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {currentStudy.process.description}
                    </p>
                  </div>
                )}
                
                {/* Process Drawings */}
                {currentStudy.process.drawings && currentStudy.process.drawings.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Process Drawings
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentStudy.process.drawings.map((drawing: any, index: number) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Image className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {drawing.name || `Drawing ${index + 1}`}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {drawing.type}
                            </span>
                          </div>
                          {drawing.url && (
                            <img
                              src={drawing.url}
                              alt={drawing.name}
                              className="w-full h-32 object-cover rounded border"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Operating Conditions */}
                {currentStudy.process.operatingConditions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Operating Conditions
                    </label>
                    <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentStudy.process.operatingConditions.temperature && (
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Temperature</p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {currentStudy.process.operatingConditions.temperature.min} - {currentStudy.process.operatingConditions.temperature.max} {currentStudy.process.operatingConditions.temperature.unit}
                          </p>
                        </div>
                      )}
                      {currentStudy.process.operatingConditions.pressure && (
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Pressure</p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {currentStudy.process.operatingConditions.pressure.min} - {currentStudy.process.operatingConditions.pressure.max} {currentStudy.process.operatingConditions.pressure.unit}
                          </p>
                        </div>
                      )}
                      {currentStudy.process.operatingConditions.flowRate && (
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Flow Rate</p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {currentStudy.process.operatingConditions.flowRate.min} - {currentStudy.process.operatingConditions.flowRate.max} {currentStudy.process.operatingConditions.flowRate.unit}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Nodes */}
          {currentStudy.nodes && currentStudy.nodes.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Study Nodes ({currentStudy.nodes.length})
                </h2>
                {currentStudy.status === 'in_progress' && (
                  <Button
                    as={Link}
                    to={`/hazop/studies/${id}/worksheet`}
                    variant="secondary"
                    icon={Plus}
                  >
                    Add Node
                  </Button>
                )}
              </div>
              <div className="space-y-4">
                {currentStudy.nodes.map((node: any, index: number) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          Node {node.nodeNumber}: {node.description}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Intention: {node.intention}
                        </p>
                        {node.worksheets && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {node.worksheets.length} worksheets completed
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {node.worksheets.map((ws: any, wsIndex: number) => (
                                <span
                                  key={wsIndex}
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    ws.risk === 'very_high' ? 'bg-red-100 text-red-800' :
                                    ws.risk === 'high' ? 'bg-orange-100 text-orange-800' :
                                    ws.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    ws.risk === 'low' ? 'bg-blue-100 text-blue-800' :
                                    'bg-green-100 text-green-800'
                                  }`}
                                >
                                  Risk: {ws.riskScore || 0}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        as={Link}
                        to={`/hazop/studies/${id}/worksheet?node=${node.nodeNumber}`}
                        size="sm"
                        variant="secondary"
                        icon={Edit}
                      >
                        Edit
                      </Button>
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
              {canStart && (
                <Button
                  variant="primary"
                  className="w-full"
                  icon={Play}
                  onClick={handleStartStudy}
                  loading={isLoading}
                >
                  Start Study
                </Button>
              )}
              {currentStudy.status === 'in_progress' && (
                <Button
                  variant="primary"
                  className="w-full"
                  icon={Play}
                  as={Link}
                  to={`/hazop/studies/${id}/node`}
                 
                >
                  Create Node
                </Button>
              )}
              {currentStudy.status === 'in_progress' && (
                <Button
                  as={Link}
                  to={`/hazop/studies/${id}/worksheet`}
                  variant="primary"
                  className="w-full"
                  icon={Target}
                >
                  Continue Worksheet
                </Button>
              )}
              {canComplete && (
                <Button
                  variant="success"
                  className="w-full"
                  icon={CheckCircle}
                  onClick={handleCompleteStudy}
                  loading={isLoading}
                >
                  Complete Study
                </Button>
              )}
              {canClose && (
                <Button
                  as={Link}
                  to={`/hazop/studies/${id}/close`}
                  variant="success"
                  className="w-full"
                  icon={CheckCircle}
                >
                  Close Study
                </Button>
              )}
              <Button
                variant="secondary"
                className="w-full"
                icon={Download}
                onClick={() => handleExport('pdf')}
                loading={isExporting}
              >
                Generate Report
              </Button>
            </div>
          </Card>

          {/* Study Team */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Study Team
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Facilitator
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {currentStudy.facilitator?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {currentStudy.facilitator?.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {currentStudy.facilitator?.email}
                    </p>
                  </div>
                </div>
              </div>

              {currentStudy.chairman && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Chairman
                  </label>
                  <div className="mt-1 flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {currentStudy.chairman?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentStudy.chairman?.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Chairman
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStudy.scribe && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Scribe
                  </label>
                  <div className="mt-1 flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {currentStudy.scribe?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentStudy.scribe?.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Scribe
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStudy.team && currentStudy.team.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Team Members ({currentStudy.team.length})
                  </label>
                  <div className="space-y-2">
                    {currentStudy.team.map((member: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {member.member?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.member?.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {member.role} • {member.expertise}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Study Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Study Information
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(currentStudy.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Facilitator:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentStudy.facilitator?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Plant:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentStudy.plantId?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Nodes:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentStudy.nodes?.length || 0}
                </span>
              </div>
              {currentStudy.startedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Started:</span>
                  <span className="text-gray-900 dark:text-white">
                    {format(new Date(currentStudy.startedAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
              {currentStudy.completionDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                  <span className="text-gray-900 dark:text-white">
                    {format(new Date(currentStudy.completionDate), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HAZOPDetails;