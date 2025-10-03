import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MoreVertical,
  Search as SearchIcon
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchHAZOPStudies } from '../../store/slices/hazopSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';

const HAZOPList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { studies, isLoading, pagination } = useAppSelector((state) => state.hazop);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodologyFilter, setMethodologyFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user?.companyId) {
      const params: any = {
        companyId: user.companyId,
        page: currentPage,
        limit: 10
      };
      
      if (statusFilter) params.status = statusFilter;
      if (methodologyFilter) params.methodology = methodologyFilter;
      if (searchTerm) params.search = searchTerm;
      
      dispatch(fetchHAZOPStudies(params));
    }
  }, [dispatch, user?.companyId, currentPage, statusFilter, methodologyFilter, searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  if (isLoading && studies.length === 0) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            HAZOP Studies
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage hazard and operability studies
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            icon={Download}
          >
            Export
          </Button>
          <Button
            as={Link}
            to="/hazop/studies/new"
            variant="primary"
            icon={Plus}
          >
            New HAZOP Study
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search studies..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={methodologyFilter}
            onChange={(e) => setMethodologyFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Methodologies</option>
            <option value="HAZOP">HAZOP</option>
            <option value="WHAT-IF">What-If</option>
            <option value="CHECKLIST">Checklist</option>
            <option value="FMEA">FMEA</option>
          </select>

          <Button
            variant="secondary"
            icon={Filter}
            className="justify-center"
          >
            Advanced Filter
          </Button>
        </div>
      </Card>

      {/* Studies List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Study Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Title & Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Methodology
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Facilitator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {studies.map((study, index) => (
                <motion.tr
                  key={study._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <SearchIcon className="h-5 w-5 text-purple-500" />
                      <div>
                        <Link
                          to={`/hazop/studies/${study._id}`}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {study.studyNumber}
                        </Link>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {study.plantId?.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs">
                      <p className="font-medium truncate">{study.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {study.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      study.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      study.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      study.status === 'planned' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {study.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {study.methodology}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {study.facilitator?.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {study.facilitator?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        as={Link}
                        to={`/hazop/studies/${study._id}`}
                        size="sm"
                        variant="secondary"
                        icon={Eye}
                      />
                      {/* <Button
                        as={Link}
                        to={`/hazop/studies/${study._id}/edit`}
                        size="sm"
                        variant="secondary"
                        icon={Edit}
                      /> */}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {studies.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="mx-auto h-24 w-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <SearchIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No HAZOP studies found
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Get started by creating your first HAZOP study.
          </p>
          <div className="mt-6">
            <Button
              as={Link}
              to="/hazop/studies/new"
              variant="primary"
              icon={Plus}
            >
              Create HAZOP Study
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default HAZOPList;