import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Play,
  CheckCircle,
  Users,
  Clock,
  Calendar,
  FileText,
  Download
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchAudits, startAudit } from '../../store/slices/auditSlice';
import { addNotification } from '../../store/slices/uiSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';

const AuditList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { audits, isLoading, pagination } = useAppSelector((state) => state.audit);
  const { plants } = useAppSelector((state) => state.plant);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [plantFilter, setPlantFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user?.companyId) {
      fetchAuditsData();
    }
  }, [user?.companyId, currentPage, statusFilter, typeFilter, plantFilter]);

  const fetchAuditsData = () => {
    if (!user?.companyId) return;
    
    dispatch(fetchAudits({
      companyId: user.companyId,
      page: currentPage,
      limit: 10,
      status: statusFilter,
      type: typeFilter,
      plantId: plantFilter,
      search: searchTerm
    }));
  };

  const handleStartAudit = async (auditId: string) => {
    if (!user?.companyId) return;
    
    try {
      await dispatch(startAudit({ companyId: user.companyId, id: auditId })).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'Audit started successfully'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to start audit'
      }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'checklist_completed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'observations_pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'planned':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
      case 'checklist_completed':
      case 'observations_pending':
        return Clock;
      case 'planned':
        return Calendar;
      case 'closed':
        return FileText;
      default:
        return FileText;
    }
  };

  const auditTypes = [
    { value: 'internal', label: 'Internal' },
    { value: 'external', label: 'External' },
    { value: 'regulatory', label: 'Regulatory' },
    { value: 'management', label: 'Management' },
    { value: 'process', label: 'Process' },
  ];

  const statusOptions = [
    { value: 'planned', label: 'Planned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'checklist_completed', label: 'Checklist Completed' },
    { value: 'observations_pending', label: 'Observations Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'closed', label: 'Closed' },
  ];

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.auditNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading && audits.length === 0) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Safety Audits
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track safety audits across your organization
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            as={Link}
            to="/audit/my-actions"
            variant="secondary"
            icon={CheckCircle}
          >
            My Actions
          </Button>
          <Button
            as={Link}
            to="/audit/audits/new"
            variant="primary"
            icon={Plus}
          >
            New Audit
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                placeholder="Search audits..."
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
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Types</option>
              {auditTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plant
            </label>
            <select
              value={plantFilter}
              onChange={(e) => setPlantFilter(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Plants</option>
              {plants.map((plant) => (
                <option key={plant._id} value={plant._id}>
                  {plant.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              icon={Filter}
              onClick={fetchAuditsData}
              className="w-full"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Audit List */}
      <div className="space-y-4">
        {filteredAudits.map((audit, index) => {
          const StatusIcon = getStatusIcon(audit.status);
          
          return (
            <motion.div
              key={audit._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {audit.auditNumber}
                      </h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(audit.status)}`}>
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {audit.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {audit.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                      {audit.title}
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(audit.scheduledDate), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        {audit.plantId?.name}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {audit.auditor?.name}
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {audit.standard}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      as={Link}
                      to={`/audit/audits/${audit._id}`}
                      variant="secondary"
                      size="sm"
                      icon={Eye}
                    >
                      View
                    </Button>
                    
                    {audit.status === 'planned' && (
                      <>
                        <Button
                          as={Link}
                          to={`/audit/audits/${audit._id}/edit`}
                          variant="secondary"
                          size="sm"
                          icon={Edit}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Play}
                          onClick={() => handleStartAudit(audit._id)}
                        >
                          Start
                        </Button>
                      </>
                    )}
                    
                    {(audit.status === 'in_progress' || audit.status === 'checklist_completed') && (
                      <Button
                        as={Link}
                        to={`/audit/audits/${audit._id}/checklist`}
                        variant="primary"
                        size="sm"
                        icon={CheckCircle}
                      >
                        Checklist
                      </Button>
                    )}
                    
                    {(audit.status === 'checklist_completed' || audit.status === 'observations_pending') && (
                      <Button
                        as={Link}
                        to={`/audit/audits/${audit._id}/observations`}
                        variant="primary"
                        size="sm"
                        icon={FileText}
                      >
                        Observations
                      </Button>
                    )}
                    
                    {(audit.status === 'completed' || audit.status === 'closed') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Download}
                        onClick={() => window.open(`/api/audits/${user?.companyId}/${audit._id}/report/pdf`)}
                      >
                        Report
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}

        {filteredAudits.length === 0 && !isLoading && (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No audits found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || statusFilter || typeFilter || plantFilter
                ? 'No audits match your current filters.'
                : 'Get started by creating your first safety audit.'}
            </p>
            <Button
              as={Link}
              to="/audit/audits/new"
              variant="primary"
              icon={Plus}
            >
              Create First Audit
            </Button>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.total)} of {pagination.total} audits
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
              disabled={currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditList;