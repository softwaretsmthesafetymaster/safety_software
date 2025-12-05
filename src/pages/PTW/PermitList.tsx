import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Plus, Search, Filter, Download, Eye, CreditCard as Edit, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchPermits } from '../../store/slices/permitSlice';
import { useExport } from '../../hooks/useExport';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';

const PermitList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { permits, isLoading, pagination } = useAppSelector((state) => state.permit);
  const { exportList, isExporting } = useExport();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    if (user?.companyId) {
      const params: any = {
        companyId: user.companyId,
        page: currentPage,
        limit: 10
      };
      
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (searchTerm) params.search = searchTerm;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      
      dispatch(fetchPermits(params));
    }
  }, [dispatch, user?.companyId, currentPage, statusFilter, typeFilter, searchTerm, dateRange]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type);
    setCurrentPage(1);
  };

  const handleExportList = async () => {
    try {
      const filters = { status: statusFilter, type: typeFilter, search: searchTerm };
      await exportList(permits, filters, 'excel');
      toast.success('Permit list exported successfully');
    } catch (error) {
      toast.error('Failed to export permit list');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return CheckCircle;
      case 'expired':
      case 'rejected':
        return XCircle;
      case 'submitted':
      case 'pending':
        return Clock;
      default:
        return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'submitted':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'expired':
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'stopped':
        return 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'pending_closure':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading && permits.length === 0) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Permits
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all work permits and their status
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="secondary" 
            icon={Download}
            onClick={handleExportList}
            loading={isExporting}
          >
            Export List
          </Button>
          <Link to="/ptw/permits/new">
            <Button variant="primary" icon={Plus}>
              New Permit
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search permits..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="closed">Closed</option>
              <option value="stopped">Stopped</option>
              <option value="pending_closure">Pending Closure</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => handleTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="hot_work">Hot Work</option>
              <option value="cold_work">Cold Work</option>
              <option value="electrical">Electrical</option>
              <option value="working_at_height">Working at Height</option>
              <option value="confined_space">Confined Space</option>
              <option value="excavation">Excavation</option>
              <option value="lifting">Lifting Operations</option>
              <option value="fire">Fire Work</option>
              <option value="environmental">Environmental</option>
              <option value="demolition">Demolition</option>
              <option value="chemical">Chemical Work</option>
              <option value="radiation">Radiation Work</option>
            </select>

            {/* Advanced Filter Toggle */}
            <Button
              variant="secondary"
              icon={Filter}
              className="justify-center"
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            >
              {showAdvancedFilter ? 'Hide' : 'Advanced'} Filter
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date From
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date To
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Permits List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Permit Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Work Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Requested By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {permits.map((permit, index) => {
                const StatusIcon = getStatusIcon(permit.status);
                return (
                  <motion.tr
                    key={permit._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <Link
                          to={`/ptw/permits/${permit._id}`}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {permit.permitNumber}
                        </Link>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {permit.plantId?.name || 'N/A'}
                        </div>
                        {permit.isHighRisk && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 mt-1 w-fit">
                            High Risk
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs">
                        <p className="line-clamp-2">{permit.workDescription}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {permit.types?.slice(0, 2).map((type, idx) => (
                            <span
                              key={idx}
                              className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                            >
                              {type.replace('_', ' ')}
                            </span>
                          ))}
                          {permit.types && permit.types.length > 2 && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded">
                              +{permit.types.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`h-4 w-4 ${
                          permit.status === 'active' ? 'text-green-500' :
                          permit.status === 'expired' || permit.status === 'rejected' ? 'text-red-500' :
                          permit.status === 'submitted' || permit.status === 'pending' ? 'text-yellow-500' :
                          'text-gray-500'
                        }`} />
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(permit.status)}`}>
                          {permit.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div>Start: {format(new Date(permit.schedule?.startDate), 'MMM dd, HH:mm')}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          End: {format(new Date(permit.schedule?.endDate), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {permit.requestedBy?.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {permit.requestedBy?.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link to={`/ptw/permits/${permit._id}`}>
                          <Button size="sm" variant="secondary" icon={Eye}>
                            View
                          </Button>
                        </Link>

                        {permit.status === "draft" && String(permit.requestedBy._id) === String(user?._id) && (
                          <Link to={`/ptw/permits/${permit._id}/edit`}>
                            <Button size="sm" variant="primary" icon={Edit}>
                              Edit
                            </Button>
                          </Link>
                        )}

                        {permit.status === "approved" && String(permit.requestedBy._id) === String(user?._id) && (
                          <Link to={`/ptw/permits/${permit._id}/activate`}>
                            <Button size="sm" variant="success" icon={CheckCircle}>
                              Activate
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing{' '}
                  <span className="font-medium">
                    {((currentPage - 1) * 10) + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.total}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      const start = Math.max(1, currentPage - 2);
                      const end = Math.min(pagination.totalPages, currentPage + 2);
                      return page >= start && page <= end;
                    })
                    .map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-200'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>

      {permits.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="mx-auto h-24 w-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No permits found
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter || typeFilter 
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by creating your first permit.'
            }
          </p>
          <div className="mt-6">
            <Link to="/ptw/permits/new">
              <Button variant="primary" icon={Plus}>
                Create Permit
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PermitList;