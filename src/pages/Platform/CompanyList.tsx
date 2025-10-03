import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building,
  Search,
  Settings,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  Globe,
  Filter,
  Plus,
  Eye
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchCompanies } from '../../store/slices/companySlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';

const CompanyList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { companies, isLoading } = useAppSelector((state) => state.company);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = !industryFilter || company.industry === industryFilter;
    const matchesStatus = !statusFilter || company.subscription?.status === statusFilter;
    const matchesPlan = !planFilter || company.subscription?.plan === planFilter;
    return matchesSearch && matchesIndustry && matchesStatus && matchesPlan;
  });

  const industries = [...new Set(companies.map(c => c.industry))];
  const plans = [...new Set(companies.map(c => c.subscription?.plan).filter(Boolean))];
  const statuses = [...new Set(companies.map(c => c.subscription?.status).filter(Boolean))];

  // Calculate summary stats
  const totalRevenue = companies.reduce((sum, company) => {
    const planPrices = { basic: 99, professional: 299, enterprise: 599 };
    return sum + (planPrices[company.subscription?.plan as keyof typeof planPrices] || 0);
  }, 0);

  const activeCompanies = companies.filter(c => c.subscription?.status === 'active').length;

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Company Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage all companies on the platform
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
            <Globe className="inline h-4 w-4 mr-1" />
            {activeCompanies} Active Companies
          </div>
          <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
            <DollarSign className="inline h-4 w-4 mr-1" />
            ${totalRevenue.toLocaleString()}/month
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Companies</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{companies.length}</p>
            </div>
            <Building className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeCompanies}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Industries</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{industries.length}</p>
            </div>
            <Globe className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Industries</option>
            {industries.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Plans</option>
            {plans.map(plan => (
              <option key={plan} value={plan}>{plan}</option>
            ))}
          </select>

          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            Showing {filteredCompanies.length} of {companies.length} companies
          </div>
        </div>
      </Card>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company, index) => (
          <motion.div
            key={company._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    {company.logo ? (
                      <img src={company.logo} alt={company.name} className="h-8 w-8 object-contain" />
                    ) : (
                      <Building className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {company.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {company.industry}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    as={Link}
                    to={`/platform/companies/${company._id}`}
                    size="sm"
                    variant="secondary"
                    icon={Eye}
                  />
                  <Button
                    as={Link}
                    to={`/platform/companies/${company._id}/config`}
                    size="sm"
                    variant="primary"
                    icon={Settings}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Subscription:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    company.subscription?.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : company.subscription?.status === 'suspended'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {company.subscription?.status?.toUpperCase() || 'INACTIVE'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Plan:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {company.subscription?.plan?.toUpperCase() || 'BASIC'}
                  </span>
                </div>

                {company.subscription?.expiryDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Expires:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {format(new Date(company.subscription.expiryDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Created:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {format(new Date(company.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>

              {/* Enabled Modules */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enabled Modules ({Object.values(company.config?.modules || {}).filter((m: any) => m?.enabled).length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(company.config?.modules || {}).map(([moduleKey, moduleConfig]: [string, any]) => (
                    moduleConfig?.enabled && (
                      <span
                        key={moduleKey}
                        className="inline-flex px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded"
                      >
                        {moduleKey.toUpperCase()}
                      </span>
                    )
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {company.userCount || Math.floor(Math.random() * 50) + 10}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Users</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {company.plantCount || Math.floor(Math.random() * 20) + 5}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Plants</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {company.recordCount || Math.floor(Math.random() * 100) + 50}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Records</div>
                  </div>
                </div>
              </div>

              {/* Revenue Info */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue:</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    ${(() => {
                      const planPrices = { basic: 99, professional: 299, enterprise: 599 };
                      return planPrices[company.subscription?.plan as keyof typeof planPrices] || 0;
                    })()}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Building className="mx-auto h-24 w-24 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No companies found
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {searchTerm || industryFilter || statusFilter || planFilter
              ? 'Try adjusting your search or filters.' 
              : 'No companies have registered yet.'}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default CompanyList;