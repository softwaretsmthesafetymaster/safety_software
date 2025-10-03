import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Settings,
  Save,
  Upload,
  Palette,
  Users,
  Workflow,
  Shield,
  Clock,
  Bell,
  FileText,
  AlertTriangle,
  Search,
  Target,
  Eye,
  CheckSquare,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  Building,
  Mail,
  Phone,
  Globe,
  Calendar,
  DollarSign,
  Edit,
  ArrowLeft
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchCompanyById, updateCompany } from '../../store/slices/companySlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { addNotification } from '../../store/slices/uiSlice';
import { format } from 'date-fns';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
interface CompanyConfigData {
  name: string;
  industry: string;
  logo: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
  config: {
    theme: {
      primaryColor: string;
      secondaryColor: string;
      darkMode: boolean;
    };
    branding: {
      primaryColor: string;
      secondaryColor: string;
      companyName: string;
      logo: string;
    };
    modules: {
      ptw: any;
      ims: any;
      hazop: any;
      hira: any;
      bbs: any;
      audit: any;
    };
  };
}

const CompanyConfig: React.FC = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentCompany, isLoading } = useAppSelector((state) => state.company);
  
  const [activeTab, setActiveTab] = useState('general');
  const [activeModule, setActiveModule] = useState('ptw');
  const [logoPreview, setLogoPreview] = useState('');
  const [configPreview, setConfigPreview] = useState('');

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<CompanyConfigData>();

  useEffect(() => {
    if (companyId) {
      dispatch(fetchCompanyById(companyId));
    }
  }, [dispatch, companyId]);

  useEffect(() => {
    if (currentCompany) {
      reset(currentCompany);
      setLogoPreview(currentCompany.config?.branding?.logo || '');
      setConfigPreview(JSON.stringify(currentCompany.config, null, 2));
    }
  }, [currentCompany, reset]);

  const onSubmit = async (data: CompanyConfigData) => {
    if (!companyId) return;

    try {
      await dispatch(updateCompany({
        id: companyId,
        data
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'Company configuration updated successfully'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to update configuration'
      }));
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('files', file);
      
      try {
        const response = await axios.post(`${API_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        const logoUrl = response.data.urls[0];
        setLogoPreview(logoUrl);
        setValue('logo', logoUrl);
        setValue('config.branding.logo', logoUrl);
        
        dispatch(addNotification({
          type: 'success',
          message: 'Logo uploaded successfully'
        }));
      } catch (error) {
        dispatch(addNotification({
          type: 'error',
          message: 'Failed to upload logo'
        }));
      }
    }
  };

  const copyConfigToClipboard = () => {
    navigator.clipboard.writeText(configPreview);
    dispatch(addNotification({
      type: 'success',
      message: 'Configuration copied to clipboard'
    }));
  };

  const resetModuleToDefault = (moduleKey: string) => {
    const defaultConfigs = {
      ptw: {
        enabled: true,
        approvalFlow: [
          { role: 'hod', label: 'HOD Approval', step: 1 },
          { role: 'safety_incharge', label: 'Safety Approval', step: 2 }
        ],
        highRiskApprovalFlow: [
          { role: 'plant_head', label: 'Plant Head Initial Approval', step: 1 },
          { role: 'hod', label: 'HOD Approval', step: 2 },
          { role: 'safety_incharge', label: 'Safety Approval', step: 3 }
        ],
        closureFlow: {
          anyOf: ['hod', 'safety_incharge', 'plant_head'],
          label: 'Closure Approval'
        },
        stopWorkRoles: [
          { role: 'hod', label: 'HOD Stop Work' },
          { role: 'safety_incharge', label: 'Safety Stop Work' },
          { role: 'plant_head', label: 'Plant Head Stop Work' }
        ],
        roles: ['worker', 'contractor', 'hod', 'safety_incharge', 'plant_head', 'company_owner'],
        checklists: {
          hotWork: [
            'Fire watch posted',
            'Hot work permit displayed',
            'Fire extinguisher available',
            'Area cleared of combustibles',
            'Welding screens in place'
          ],
          coldWork: [
            'Area isolated',
            'Tools inspected',
            'PPE verified',
            'Emergency contacts available'
          ],
          confinedSpace: [
            'Atmospheric testing completed',
            'Ventilation adequate',
            'Entry supervisor assigned',
            'Rescue plan in place',
            'Communication established'
          ]
        }
      },
      ims: {
        enabled: true,
        investigationFlow: [
          { role: 'safety_incharge', label: 'Investigation Assignment', step: 1 },
          { role: 'investigation_team', label: 'Investigation Execution', step: 2 },
          { role: 'plant_head', label: 'Investigation Review', step: 3 }
        ],
        severityEscalation: {
          low: ['hod'],
          medium: ['hod', 'safety_incharge'],
          high: ['hod', 'safety_incharge', 'plant_head'],
          critical: ['hod', 'safety_incharge', 'plant_head', 'company_owner']
        },
        closureFlow: {
          anyOf: ['safety_incharge', 'plant_head'],
          label: 'Incident Closure'
        },
        roles: ['worker', 'contractor', 'hod', 'safety_incharge', 'plant_head', 'company_owner']
      },
      hazop: {
        enabled: true,
        teamRoles: {
          chairman: ['safety_incharge', 'plant_head'],
          scribe: ['safety_incharge', 'hod'],
          facilitator: ['safety_incharge', 'plant_head'],
          members: ['hod', 'safety_incharge', 'contractor', 'worker']
        },
        studyFlow: [
          { role: 'facilitator', label: 'Study Creation', step: 1 },
          { role: 'team', label: 'Node Development', step: 2 },
          { role: 'team', label: 'Worksheet Analysis', step: 3 },
          { role: 'chairman', label: 'Study Closure', step: 4 }
        ],
        riskMatrix: {
          likelihood: ['rare', 'unlikely', 'possible', 'likely', 'almost_certain'],
          severity: ['negligible', 'minor', 'moderate', 'major', 'catastrophic']
        },
        roles: ['hod', 'safety_incharge', 'plant_head', 'contractor', 'worker']
      },
      hira: {
        enabled: true,
        assessmentFlow: [
          { role: 'assessor', label: 'Assessment Creation', step: 1 },
          { role: 'team', label: 'Hazard Identification', step: 2 },
          { role: 'team', label: 'Risk Assessment', step: 3 },
          { role: 'safety_incharge', label: 'Review & Approval', step: 4 }
        ],
        riskScoring: {
          probability: { min: 1, max: 5 },
          severity: { min: 1, max: 5 },
          exposure: { min: 1, max: 5 }
        },
        acceptabilityLevels: {
          acceptable: { max: 30 },
          tolerable: { min: 31, max: 90 },
          unacceptable: { min: 91 }
        },
        roles: ['worker', 'hod', 'safety_incharge', 'plant_head']
      },
      bbs: {
        enabled: true,
        observationFlow: [
          { role: 'observer', label: 'Observation Report', step: 1 },
          { role: 'hod', label: 'HOD Review', step: 2 },
          { role: 'safety_incharge', label: 'Safety Review', step: 3 }
        ],
        actionFlow: [
          { role: 'worker', label: 'Action Execution', step: 1 },
          { role: 'hod', label: 'Action Review', step: 2 },
          { role: 'safety_incharge', label: 'Final Approval', step: 3 }
        ],
        categories: {
          unsafeActs: [
            'PPE not used',
            'Wrong procedure',
            'Unsafe position',
            'Operating without authority'
          ],
          unsafeConditions: [
            'Defective equipment',
            'Inadequate guards/barriers',
            'Defective PPE',
            'Poor housekeeping'
          ],
          safeBehaviors: [
            'Proper PPE usage',
            'Following procedures',
            'Good housekeeping',
            'Safety awareness'
          ]
        },
        roles: ['worker', 'contractor', 'hod', 'safety_incharge', 'plant_head']
      },
      audit: {
        enabled: true,
        auditFlow: [
          { role: 'auditor', label: 'Audit Planning', step: 1 },
          { role: 'audit_team', label: 'Audit Execution', step: 2 },
          { role: 'auditor', label: 'Findings Documentation', step: 3 },
          { role: 'safety_incharge', label: 'Review & Closure', step: 4 }
        ],
        standards: ['ISO45001', 'ISO14001', 'OHSAS18001', 'custom'],
        findingTypes: ['non_compliance', 'observation', 'opportunity'],
        severityLevels: ['minor', 'major', 'critical'],
        roles: ['auditor', 'hod', 'safety_incharge', 'plant_head']
      }
    };

    setValue(`config.modules.${moduleKey}`, defaultConfigs[moduleKey as keyof typeof defaultConfigs]);
    dispatch(addNotification({
      type: 'success',
      message: `${moduleKey.toUpperCase()} module reset to default configuration`
    }));
  };

  const tabs = [
    { id: 'general', name: 'General Info', icon: Building },
    { id: 'subscription', name: 'Subscription', icon: DollarSign },
    { id: 'branding', name: 'Branding', icon: Palette },
    { id: 'modules', name: 'Module Config', icon: Settings },
    { id: 'preview', name: 'Config Preview', icon: Eye },
  ];

  const modules = [
    { key: 'ptw', name: 'Permit to Work', icon: FileText, color: 'text-blue-600' },
    { key: 'ims', name: 'Incident Management', icon: AlertTriangle, color: 'text-red-600' },
    { key: 'hazop', name: 'HAZOP Studies', icon: Search, color: 'text-purple-600' },
    { key: 'hira', name: 'HIRA Assessment', icon: Target, color: 'text-orange-600' },
    { key: 'bbs', name: 'BBS Observations', icon: Eye, color: 'text-green-600' },
    { key: 'audit', name: 'Safety Audits', icon: CheckSquare, color: 'text-indigo-600' },
  ];

  const availableRoles = [
    'worker', 'contractor', 'hod', 'safety_incharge', 'plant_head', 
    'company_owner', 'auditor', 'assessor', 'observer', 'facilitator', 
    'chairman', 'scribe', 'investigation_team'
  ];

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!currentCompany) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Company not found
        </h3>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => navigate('/platform/companies')}
        >
          Back to Companies
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate('/platform/companies')}
          >
            Back
          </Button>
          <div className="flex items-center space-x-3">
            {currentCompany.config?.branding?.logo && (
              <img 
                src={currentCompany.config.branding.logo} 
                alt={currentCompany.name}
                className="h-10 w-10 object-contain rounded-lg border border-gray-300"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentCompany.name} - Configuration
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {currentCompany.industry} • {currentCompany.subscription?.plan?.toUpperCase()} Plan
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentCompany.subscription?.status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {currentCompany.subscription?.status?.toUpperCase() || 'INACTIVE'}
          </div>
          <Button
            variant="primary"
            icon={Save}
            onClick={handleSubmit(onSubmit)}
            loading={isLoading}
          >
            Save Configuration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card className="p-6">
              {/* General Information */}
              {activeTab === 'general' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Company Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Company Name
                      </label>
                      <input
                        {...register('name', { required: 'Company name is required' })}
                        type="text"
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Industry
                      </label>
                      <select
                        {...register('industry', { required: 'Industry is required' })}
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Select Industry</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Oil & Gas">Oil & Gas</option>
                        <option value="Chemical">Chemical</option>
                        <option value="Construction">Construction</option>
                        <option value="Mining">Mining</option>
                        <option value="Power Generation">Power Generation</option>
                        <option value="Pharmaceuticals">Pharmaceuticals</option>
                        <option value="Food & Beverage">Food & Beverage</option>
                        <option value="Automotive">Automotive</option>
                        <option value="Aerospace">Aerospace</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.industry && (
                        <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Street Address
                        </label>
                        <input
                          {...register('address.street')}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          City
                        </label>
                        <input
                          {...register('address.city')}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          State
                        </label>
                        <input
                          {...register('address.state')}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Country
                        </label>
                        <input
                          {...register('address.country')}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          ZIP Code
                        </label>
                        <input
                          {...register('address.zipCode')}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Phone
                        </label>
                        <input
                          {...register('contactInfo.phone')}
                          type="tel"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email
                        </label>
                        <input
                          {...register('contactInfo.email')}
                          type="email"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Website
                        </label>
                        <input
                          {...register('contactInfo.website')}
                          type="url"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Subscription Information */}
              {activeTab === 'subscription' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Subscription Details
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-semibold text-blue-900 dark:text-blue-200">
                            {currentCompany.subscription?.plan?.toUpperCase() || 'BASIC'}
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">Current Plan</p>
                        </div>
                      </div>
                    </div>

                    <div className={`border rounded-lg p-4 ${
                      currentCompany.subscription?.status === 'active'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Shield className={`h-8 w-8 ${
                          currentCompany.subscription?.status === 'active' ? 'text-green-600' : 'text-red-600'
                        }`} />
                        <div>
                          <p className={`font-semibold ${
                            currentCompany.subscription?.status === 'active' 
                              ? 'text-green-900 dark:text-green-200' 
                              : 'text-red-900 dark:text-red-200'
                          }`}>
                            {currentCompany.subscription?.status?.toUpperCase() || 'INACTIVE'}
                          </p>
                          <p className={`text-sm ${
                            currentCompany.subscription?.status === 'active' 
                              ? 'text-green-700 dark:text-green-300' 
                              : 'text-red-700 dark:text-red-300'
                          }`}>
                            Status
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-8 w-8 text-purple-600" />
                        <div>
                          <p className="font-semibold text-purple-900 dark:text-purple-200">
                            {currentCompany.subscription?.expiryDate 
                              ? format(new Date(currentCompany.subscription.expiryDate), 'MMM dd, yyyy')
                              : 'No expiry'
                            }
                          </p>
                          <p className="text-sm text-purple-700 dark:text-purple-300">Expires</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enabled Modules */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Enabled Modules ({Object.values(currentCompany.config?.modules || {}).filter((m: any) => m?.enabled).length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {modules.map((module) => {
                        const moduleConfig = currentCompany.config?.modules?.[module.key];
                        const isEnabled = moduleConfig?.enabled;
                        
                        return (
                          <div
                            key={module.key}
                            className={`border-2 rounded-lg p-4 ${
                              isEnabled
                                ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-300 bg-gray-50 dark:bg-gray-700'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <module.icon className={`h-6 w-6 ${
                                isEnabled ? 'text-green-600' : 'text-gray-400'
                              }`} />
                              <div>
                                <p className={`font-medium ${
                                  isEnabled ? 'text-green-900 dark:text-green-200' : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {module.name}
                                </p>
                                <p className={`text-xs ${
                                  isEnabled ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {isEnabled ? 'Enabled' : 'Disabled'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Information */}
                  {currentCompany.subscription?.paymentId && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Information</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Payment ID:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-white">
                              {currentCompany.subscription.paymentId}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-white">
                              {currentCompany.subscription.orderId}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Subscription Management */}
              {activeTab === 'subscription' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Subscription Management
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Subscription Plan
                      </label>
                      <select
                        {...register('subscription.plan')}
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="basic">Basic - $99/month</option>
                        <option value="professional">Professional - $299/month</option>
                        <option value="enterprise">Enterprise - $599/month</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </label>
                      <select
                        {...register('subscription.status')}
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Expiry Date
                      </label>
                      <input
                        {...register('subscription.expiryDate')}
                        type="date"
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Module Enablement */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Module Access</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {modules.map((module) => (
                        <label key={module.key} className="flex items-center space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                          <input
                            {...register(`config.modules.${module.key}.enabled`)}
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <module.icon className={`h-6 w-6 ${module.color}`} />
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {module.name}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Enable {module.name.toLowerCase()} module
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Branding Settings */}
              {activeTab === 'branding' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Branding & Theme
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Company Display Name
                      </label>
                      <input
                        {...register('config.branding.companyName')}
                        type="text"
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Short name for display"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Company Logo
                      </label>
                      <div className="mt-1 flex items-center space-x-4">
                        {logoPreview && (
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="h-16 w-16 object-contain rounded-lg border border-gray-300 dark:border-gray-600"
                          />
                        )}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            id="logo-upload"
                          />
                          <label
                            htmlFor="logo-upload"
                            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Logo
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Primary Color
                      </label>
                      <div className="mt-1 flex items-center space-x-3">
                        <input
                          {...register('config.branding.primaryColor')}
                          type="color"
                          className="h-10 w-20 rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                        <input
                          {...register('config.branding.primaryColor')}
                          type="text"
                          className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Secondary Color
                      </label>
                      <div className="mt-1 flex items-center space-x-3">
                        <input
                          {...register('config.branding.secondaryColor')}
                          type="color"
                          className="h-10 w-20 rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                        <input
                          {...register('config.branding.secondaryColor')}
                          type="text"
                          className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          placeholder="#6b7280"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        {...register('config.theme.darkMode')}
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Enable Dark Mode by Default
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Module Configuration */}
              {activeTab === 'modules' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Module Configuration
                    </h2>
                    <div className="flex items-center space-x-2">
                      {modules.map((module) => (
                        <button
                          key={module.key}
                          type="button"
                          onClick={() => setActiveModule(module.key)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            activeModule === module.key
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {module.key.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PTW Configuration */}
                  {activeModule === 'ptw' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          PTW Module Configuration
                        </h3>
                        <Button
                          type="button"
                          variant="secondary"
                          icon={RotateCcw}
                          onClick={() => resetModuleToDefault('ptw')}
                        >
                          Reset to Default
                        </Button>
                      </div>

                      {/* Module Enabled */}
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            {...register('config.modules.ptw.enabled')}
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Enable PTW Module
                          </span>
                        </label>
                      </div>

                      {/* Approval Flow */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Standard Approval Flow</h4>
                        <div className="space-y-3">
                          {(currentCompany.config?.ptw?.approvalFlow || []).map((step: any, index: number) => (
                            <div key={index} className="grid grid-cols-4 gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Step</label>
                                <input
                                  {...register(`config.ptw.approvalFlow.${index}.step`)}
                                  type="number"
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={step.step}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Role</label>
                                <select
                                  {...register(`config.ptw.approvalFlow.${index}.role`)}
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={step.role}
                                >
                                  {availableRoles.map(role => (
                                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Label</label>
                                <input
                                  {...register(`config.ptw.approvalFlow.${index}.label`)}
                                  type="text"
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={step.label}
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  type="button"
                                  variant="danger"
                                  size="sm"
                                  icon={Trash2}
                                  onClick={() => {
                                    const currentFlow = watch('config.ptw.approvalFlow') || [];
                                    const newFlow = currentFlow.filter((_: any, i: number) => i !== index);
                                    setValue('config.ptw.approvalFlow', newFlow);
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="secondary"
                            icon={Plus}
                            onClick={() => {
                              const currentFlow = watch('config.ptw.approvalFlow') || [];
                              setValue('config.ptw.approvalFlow', [
                                ...currentFlow,
                                { step: currentFlow.length + 1, role: 'hod', label: 'New Approval Step' }
                              ]);
                            }}
                          >
                            Add Approval Step
                          </Button>
                        </div>
                      </div>

                      {/* High Risk Approval Flow */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">High Risk Approval Flow</h4>
                        <div className="space-y-3">
                          {(currentCompany.config?.ptw?.highRiskApprovalFlow || []).map((step: any, index: number) => (
                            <div key={index} className="grid grid-cols-4 gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Step</label>
                                <input
                                  {...register(`config.ptw.highRiskApprovalFlow.${index}.step`)}
                                  type="number"
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={step.step}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Role</label>
                                <select
                                  {...register(`config.ptw.highRiskApprovalFlow.${index}.role`)}
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={step.role}
                                >
                                  {availableRoles.map(role => (
                                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Label</label>
                                <input
                                  {...register(`config.ptw.highRiskApprovalFlow.${index}.label`)}
                                  type="text"
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={step.label}
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  type="button"
                                  variant="danger"
                                  size="sm"
                                  icon={Trash2}
                                  onClick={() => {
                                    const currentFlow = watch('config.ptw.highRiskApprovalFlow') || [];
                                    const newFlow = currentFlow.filter((_: any, i: number) => i !== index);
                                    setValue('config.ptw.highRiskApprovalFlow', newFlow);
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Stop Work Roles */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Stop Work Roles</h4>
                        <div className="space-y-3">
                          {(currentCompany.config?.ptw?.stopWorkRoles || []).map((roleConfig: any, index: number) => (
                            <div key={index} className="grid grid-cols-3 gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Role</label>
                                <select
                                  {...register(`config.ptw.stopWorkRoles.${index}.role`)}
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={roleConfig.role}
                                >
                                  {availableRoles.map(role => (
                                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Label</label>
                                <input
                                  {...register(`config.ptw.stopWorkRoles.${index}.label`)}
                                  type="text"
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={roleConfig.label}
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  type="button"
                                  variant="danger"
                                  size="sm"
                                  icon={Trash2}
                                  onClick={() => {
                                    const currentRoles = watch('config.ptw.stopWorkRoles') || [];
                                    const newRoles = currentRoles.filter((_: any, i: number) => i !== index);
                                    setValue('config.ptw.stopWorkRoles', newRoles);
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PTW Checklists */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Safety Checklists</h4>
                        {Object.entries(currentCompany.config?.ptw?.checklists || {}).map(([checklistType, items]: [string, any]) => (
                          <div key={checklistType} className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {checklistType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Checklist
                            </h5>
                            <div className="space-y-2">
                              {(items || []).map((item: string, index: number) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <input
                                    {...register(`config.ptw.checklists.${checklistType}.${index}`)}
                                    type="text"
                                    className="flex-1 rounded border-gray-300 dark:border-gray-600 text-sm"
                                    defaultValue={item}
                                  />
                                  <Button
                                    type="button"
                                    variant="danger"
                                    size="sm"
                                    icon={Trash2}
                                    onClick={() => {
                                      const currentItems = watch(`config.ptw.checklists.${checklistType}`) || [];
                                      const newItems = currentItems.filter((_: any, i: number) => i !== index);
                                      setValue(`config.ptw.checklists.${checklistType}`, newItems);
                                    }}
                                  />
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                icon={Plus}
                                onClick={() => {
                                  const currentItems = watch(`config.ptw.checklists.${checklistType}`) || [];
                                  setValue(`config.ptw.checklists.${checklistType}`, [...currentItems, 'New checklist item']);
                                }}
                              >
                                Add Item
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* IMS Configuration */}
                  {activeModule === 'ims' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          IMS Module Configuration
                        </h3>
                        <Button
                          type="button"
                          variant="secondary"
                          icon={RotateCcw}
                          onClick={() => resetModuleToDefault('ims')}
                        >
                          Reset to Default
                        </Button>
                      </div>

                      {/* Module Enabled */}
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            {...register('config.modules.ims.enabled')}
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Enable IMS Module
                          </span>
                        </label>
                      </div>

                      {/* Severity Escalation */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Severity Escalation Matrix</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(currentCompany.config?.ims?.severityEscalation || {}).map(([severity, roles]: [string, any]) => (
                            <div key={severity} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                                {severity.toUpperCase()} Severity
                              </h5>
                              <div className="space-y-2">
                                {availableRoles.map(role => (
                                  <label key={role} className="flex items-center space-x-2">
                                    <input
                                      {...register(`config.ims.severityEscalation.${severity}`)}
                                      type="checkbox"
                                      value={role}
                                      defaultChecked={Array.isArray(roles) ? roles.includes(role) : false}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {role.replace('_', ' ')}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Investigation Flow */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Investigation Flow</h4>
                        <div className="space-y-3">
                          {(currentCompany.config?.ims?.investigationFlow || []).map((step: any, index: number) => (
                            <div key={index} className="grid grid-cols-4 gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Step</label>
                                <input
                                  {...register(`config.ims.investigationFlow.${index}.step`)}
                                  type="number"
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={step.step}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Role</label>
                                <select
                                  {...register(`config.ims.investigationFlow.${index}.role`)}
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={step.role}
                                >
                                  {availableRoles.map(role => (
                                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Label</label>
                                <input
                                  {...register(`config.ims.investigationFlow.${index}.label`)}
                                  type="text"
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={step.label}
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  type="button"
                                  variant="danger"
                                  size="sm"
                                  icon={Trash2}
                                  onClick={() => {
                                    const currentFlow = watch('config.ims.investigationFlow') || [];
                                    const newFlow = currentFlow.filter((_: any, i: number) => i !== index);
                                    setValue('config.ims.investigationFlow', newFlow);
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HAZOP Configuration */}
                  {activeModule === 'hazop' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          HAZOP Module Configuration
                        </h3>
                        <Button
                          type="button"
                          variant="secondary"
                          icon={RotateCcw}
                          onClick={() => resetModuleToDefault('hazop')}
                        >
                          Reset to Default
                        </Button>
                      </div>

                      {/* Module Enabled */}
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            {...register('config.modules.hazop.enabled')}
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Enable HAZOP Module
                          </span>
                        </label>
                      </div>

                      {/* Team Roles */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Team Roles</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(currentCompany.config?.hazop?.teamRoles || {}).map(([roleType, roles]: [string, any]) => (
                            <div key={roleType} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                                {roleType.charAt(0).toUpperCase() + roleType.slice(1)} Roles
                              </h5>
                              <div className="space-y-2">
                                {availableRoles.map(role => (
                                  <label key={role} className="flex items-center space-x-2">
                                    <input
                                      {...register(`config.hazop.teamRoles.${roleType}`)}
                                      type="checkbox"
                                      value={role}
                                      defaultChecked={Array.isArray(roles) ? roles.includes(role) : false}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {role.replace('_', ' ')}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risk Matrix */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Risk Matrix Configuration</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Likelihood Levels
                            </label>
                            <div className="space-y-2">
                              {(currentCompany.config?.hazop?.riskMatrix?.likelihood || []).map((level: string, index: number) => (
                                <input
                                  key={index}
                                  {...register(`config.hazop.riskMatrix.likelihood.${index}`)}
                                  type="text"
                                  className="block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={level}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Severity Levels
                            </label>
                            <div className="space-y-2">
                              {(currentCompany.config?.hazop?.riskMatrix?.severity || []).map((level: string, index: number) => (
                                <input
                                  key={index}
                                  {...register(`config.hazop.riskMatrix.severity.${index}`)}
                                  type="text"
                                  className="block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={level}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HIRA Configuration */}
                  {activeModule === 'hira' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          HIRA Module Configuration
                        </h3>
                        <Button
                          type="button"
                          variant="secondary"
                          icon={RotateCcw}
                          onClick={() => resetModuleToDefault('hira')}
                        >
                          Reset to Default
                        </Button>
                      </div>

                      {/* Module Enabled */}
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            {...register('config.modules.hira.enabled')}
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Enable HIRA Module
                          </span>
                        </label>
                      </div>

                      {/* Risk Scoring */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Risk Scoring Configuration</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Probability</h5>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Min</label>
                                <input
                                  {...register('config.hira.riskScoring.probability.min')}
                                  type="number"
                                  min="1"
                                  max="5"
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={currentCompany.config?.hira?.riskScoring?.probability?.min || 1}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Max</label>
                                <input
                                  {...register('config.hira.riskScoring.probability.max')}
                                  type="number"
                                  min="1"
                                  max="5"
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={currentCompany.config?.hira?.riskScoring?.probability?.max || 5}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Severity</h5>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Min</label>
                                <input
                                  {...register('config.hira.riskScoring.severity.min')}
                                  type="number"
                                  min="1"
                                  max="5"
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={currentCompany.config?.hira?.riskScoring?.severity?.min || 1}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Max</label>
                                <input
                                  {...register('config.hira.riskScoring.severity.max')}
                                  type="number"
                                  min="1"
                                  max="5"
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={currentCompany.config?.hira?.riskScoring?.severity?.max || 5}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Exposure</h5>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Min</label>
                                <input
                                  {...register('config.hira.riskScoring.exposure.min')}
                                  type="number"
                                  min="1"
                                  max="5"
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={currentCompany.config?.hira?.riskScoring?.exposure?.min || 1}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Max</label>
                                <input
                                  {...register('config.hira.riskScoring.exposure.max')}
                                  type="number"
                                  min="1"
                                  max="5"
                                  className="mt-1 block w-full rounded border-gray-300 dark:border-gray-600 text-sm"
                                  defaultValue={currentCompany.config?.hira?.riskScoring?.exposure?.max || 5}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Acceptability Levels */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Risk Acceptability Levels</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="border border-green-200 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                            <h5 className="font-medium text-green-900 dark:text-green-200 mb-2">Acceptable</h5>
                            <div>
                              <label className="block text-xs text-green-700 dark:text-green-300">Max Score</label>
                              <input
                                {...register('config.hira.acceptabilityLevels.acceptable.max')}
                                type="number"
                                className="mt-1 block w-full rounded border-green-300 dark:border-green-600 text-sm"
                                defaultValue={currentCompany.config?.hira?.acceptabilityLevels?.acceptable?.max || 30}
                              />
                            </div>
                          </div>

                          <div className="border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                            <h5 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">Tolerable</h5>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-yellow-700 dark:text-yellow-300">Min</label>
                                <input
                                  {...register('config.hira.acceptabilityLevels.tolerable.min')}
                                  type="number"
                                  className="mt-1 block w-full rounded border-yellow-300 dark:border-yellow-600 text-sm"
                                  defaultValue={currentCompany.config?.hira?.acceptabilityLevels?.tolerable?.min || 31}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-yellow-700 dark:text-yellow-300">Max</label>
                                <input
                                  {...register('config.hira.acceptabilityLevels.tolerable.max')}
                                  type="number"
                                  className="mt-1 block w-full rounded border-yellow-300 dark:border-yellow-600 text-sm"
                                  defaultValue={currentCompany.config?.hira?.acceptabilityLevels?.tolerable?.max || 90}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="border border-red-200 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                            <h5 className="font-medium text-red-900 dark:text-red-200 mb-2">Unacceptable</h5>
                            <div>
                              <label className="block text-xs text-red-700 dark:text-red-300">Min Score</label>
                              <input
                                {...register('config.hira.acceptabilityLevels.unacceptable.min')}
                                type="number"
                                className="mt-1 block w-full rounded border-red-300 dark:border-red-600 text-sm"
                                defaultValue={currentCompany.config?.hira?.acceptabilityLevels?.unacceptable?.min || 91}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BBS Configuration */}
                  {activeModule === 'bbs' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          BBS Module Configuration
                        </h3>
                        <Button
                          type="button"
                          variant="secondary"
                          icon={RotateCcw}
                          onClick={() => resetModuleToDefault('bbs')}
                        >
                          Reset to Default
                        </Button>
                      </div>

                      {/* Module Enabled */}
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            {...register('config.modules.bbs.enabled')}
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Enable BBS Module
                          </span>
                        </label>
                      </div>

                      {/* Observation Categories */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Observation Categories</h4>
                        {Object.entries(currentCompany.config?.bbs?.categories || {}).map(([categoryType, items]: [string, any]) => (
                          <div key={categoryType} className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {categoryType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </h5>
                            <div className="space-y-2">
                              {(items || []).map((item: string, index: number) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <input
                                    {...register(`config.bbs.categories.${categoryType}.${index}`)}
                                    type="text"
                                    className="flex-1 rounded border-gray-300 dark:border-gray-600 text-sm"
                                    defaultValue={item}
                                  />
                                  <Button
                                    type="button"
                                    variant="danger"
                                    size="sm"
                                    icon={Trash2}
                                    onClick={() => {
                                      const currentItems = watch(`config.bbs.categories.${categoryType}`) || [];
                                      const newItems = currentItems.filter((_: any, i: number) => i !== index);
                                      setValue(`config.bbs.categories.${categoryType}`, newItems);
                                    }}
                                  />
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                icon={Plus}
                                onClick={() => {
                                  const currentItems = watch(`config.bbs.categories.${categoryType}`) || [];
                                  setValue(`config.bbs.categories.${categoryType}`, [...currentItems, 'New category item']);
                                }}
                              >
                                Add Item
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audit Configuration */}
                  {activeModule === 'audit' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Audit Module Configuration
                        </h3>
                        <Button
                          type="button"
                          variant="secondary"
                          icon={RotateCcw}
                          onClick={() => resetModuleToDefault('audit')}
                        >
                          Reset to Default
                        </Button>
                      </div>

                      {/* Module Enabled */}
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            {...register('config.modules.audit.enabled')}
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Enable Audit Module
                          </span>
                        </label>
                      </div>

                      {/* Audit Standards */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Available Standards</h4>
                        <div className="space-y-2">
                          {(currentCompany.config?.audit?.standards || []).map((standard: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                {...register(`config.audit.standards.${index}`)}
                                type="text"
                                className="flex-1 rounded border-gray-300 dark:border-gray-600 text-sm"
                                defaultValue={standard}
                              />
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                icon={Trash2}
                                onClick={() => {
                                  const currentStandards = watch('config.audit.standards') || [];
                                  const newStandards = currentStandards.filter((_: any, i: number) => i !== index);
                                  setValue('config.audit.standards', newStandards);
                                }}
                              />
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={Plus}
                            onClick={() => {
                              const currentStandards = watch('config.audit.standards') || [];
                              setValue('config.audit.standards', [...currentStandards, 'New Standard']);
                            }}
                          >
                            Add Standard
                          </Button>
                        </div>
                      </div>

                      {/* Finding Types */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Finding Types</h4>
                        <div className="space-y-2">
                          {(currentCompany.config?.audit?.findingTypes || []).map((type: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                {...register(`config.audit.findingTypes.${index}`)}
                                type="text"
                                className="flex-1 rounded border-gray-300 dark:border-gray-600 text-sm"
                                defaultValue={type}
                              />
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                icon={Trash2}
                                onClick={() => {
                                  const currentTypes = watch('config.audit.findingTypes') || [];
                                  const newTypes = currentTypes.filter((_: any, i: number) => i !== index);
                                  setValue('config.audit.findingTypes', newTypes);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Severity Levels */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Severity Levels</h4>
                        <div className="space-y-2">
                          {(currentCompany.config?.audit?.severityLevels || []).map((level: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                {...register(`config.audit.severityLevels.${index}`)}
                                type="text"
                                className="flex-1 rounded border-gray-300 dark:border-gray-600 text-sm"
                                defaultValue={level}
                              />
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                icon={Trash2}
                                onClick={() => {
                                  const currentLevels = watch('config.audit.severityLevels') || [];
                                  const newLevels = currentLevels.filter((_: any, i: number) => i !== index);
                                  setValue('config.audit.severityLevels', newLevels);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Configuration Preview */}
              {activeTab === 'preview' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Configuration Preview
                    </h2>
                    <Button
                      type="button"
                      variant="secondary"
                      icon={Copy}
                      onClick={copyConfigToClipboard}
                    >
                      Copy to Clipboard
                    </Button>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                    <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                      {JSON.stringify(currentCompany.config, null, 2)}
                    </pre>
                  </div>

                  {/* Configuration Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Module Status</h3>
                      <div className="space-y-2">
                        {modules.map((module) => {
                          const isEnabled = currentCompany.config?.modules?.[module.key]?.enabled;
                          return (
                            <div key={module.key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                              <span className="text-sm text-gray-700 dark:text-gray-300">{module.name}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                isEnabled 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {isEnabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Configuration Stats</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Total Modules:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{modules.length}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Enabled Modules:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {Object.values(currentCompany.config?.modules || {}).filter((m: any) => m?.enabled).length}
                          </span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Last Updated:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {format(new Date(currentCompany.updatedAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanyConfig;