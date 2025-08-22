import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Save,
  Upload,
  Palette,
  Users,
  Workflow,
  Shield,
  Clock,
  Bell
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchCompanyById, updateCompany } from '../../store/slices/companySlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { useForm } from 'react-hook-form';

interface CompanyConfigData {
  name: string;
  logo: string;
  industry: string;
  config: {
    theme: {
      primaryColor: string;
      secondaryColor: string;
      darkMode: boolean;
    };
    modules: {
      ptw: {
        enabled: boolean;
        workflows: {
          approval: Array<{
            step: number;
            role: string;
            required: boolean;
          }>;
        };
      };
      ims: {
        enabled: boolean;
        severityLevels: Array<{
          level: string;
          color: string;
          escalation: string;
        }>;
      };
      hazop: {
        enabled: boolean;
      };
      hira: {
        enabled: boolean;
      };
      bbs: {
        enabled: boolean;
      };
      audit: {
        enabled: boolean;
      };
    };
    roles: Array<{
      name: string;
      permissions: string[];
    }>;
  };
}

const CompanyConfig: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentCompany, isLoading } = useAppSelector((state) => state.company);
  
  const [activeTab, setActiveTab] = useState('general');
  const [logoPreview, setLogoPreview] = useState('');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CompanyConfigData>();

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchCompanyById(user.companyId));
    }
  }, [dispatch, user?.companyId]);

  useEffect(() => {
    if (currentCompany) {
      reset(currentCompany);
      setLogoPreview(currentCompany.logo || '');
    }
  }, [currentCompany, reset]);

  const onSubmit = async (data: CompanyConfigData) => {
    if (!user?.companyId) return;

    try {
      await dispatch(updateCompany({
        id: user.companyId,
        data
      })).unwrap();
      
      // Show success message
      alert('Configuration updated successfully!');
    } catch (error) {
      console.error('Error updating configuration:', error);
      alert('Failed to update configuration. Please try again.');
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setValue('logo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'theme', name: 'Theme', icon: Palette },
    { id: 'modules', name: 'Modules', icon: Workflow },
    { id: 'roles', name: 'Roles & Permissions', icon: Users },
    { id: 'notifications', name: 'Notifications', icon: Bell },
  ];

  const moduleList = [
    { key: 'ptw', name: 'Permit to Work', description: 'Work permit management system' },
    { key: 'ims', name: 'Incident Management', description: 'Safety incident tracking and investigation' },
    { key: 'hazop', name: 'HAZOP Studies', description: 'Hazard and operability studies' },
    { key: 'hira', name: 'HIRA Assessment', description: 'Hazard identification and risk assessment' },
    { key: 'bbs', name: 'Behavior Based Safety', description: 'Safety behavior observation system' },
    { key: 'audit', name: 'Safety Audits', description: 'Compliance auditing and tracking' },
  ];

  const rolesList = [
    'company_owner',
    'plant_head',
    'safety_incharge',
    'hod',
    'contractor',
    'worker'
  ];

  const permissionsList = [
    'create_permits',
    'approve_permits',
    'view_permits',
    'create_incidents',
    'investigate_incidents',
    'view_incidents',
    'create_hazop',
    'facilitate_hazop',
    'view_hazop',
    'create_hira',
    'assess_hira',
    'view_hira',
    'create_bbs',
    'observe_bbs',
    'view_bbs',
    'create_audits',
    'conduct_audits',
    'view_audits',
    'manage_users',
    'manage_plants',
    'view_reports',
    'export_data'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Company Configuration
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage company settings, modules, and workflows
          </p>
        </div>
        <Button
          variant="primary"
          icon={Save}
          onClick={handleSubmit(onSubmit)}
          loading={isLoading}
        >
          Save Changes
        </Button>
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
              {/* General Settings */}
              {activeTab === 'general' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    General Settings
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
                </motion.div>
              )}

              {/* Theme Settings */}
              {activeTab === 'theme' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Theme Settings
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Primary Color
                      </label>
                      <input
                        {...register('config.theme.primaryColor')}
                        type="color"
                        className="mt-1 block w-full h-10 rounded-lg border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Secondary Color
                      </label>
                      <input
                        {...register('config.theme.secondaryColor')}
                        type="color"
                        className="mt-1 block w-full h-10 rounded-lg border-gray-300 dark:border-gray-600"
                      />
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

              {/* Module Settings */}
              {activeTab === 'modules' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Module Configuration
                  </h2>

                  <div className="space-y-4">
                    {moduleList.map((module) => (
                      <div key={module.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {module.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {module.description}
                            </p>
                          </div>
                          <label className="flex items-center">
                            <input
                              {...register(`config.modules.${module.key}.enabled`)}
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              Enabled
                            </span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Roles & Permissions */}
              {activeTab === 'roles' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Roles & Permissions
                  </h2>

                  <div className="space-y-4">
                    {rolesList.map((role, roleIndex) => (
                      <div key={role} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                          {role.replace('_', ' ').toUpperCase()}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {permissionsList.map((permission) => (
                            <label key={permission} className="flex items-center space-x-2">
                              <input
                                {...register(`config.roles.${roleIndex}.permissions`)}
                                type="checkbox"
                                value={permission}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {permission.replace('_', ' ')}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Notification Settings
                  </h2>

                  <div className="space-y-4">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                        Email Notifications
                      </h3>
                      <div className="space-y-2">
                        {[
                          'Permit submissions',
                          'Incident reports',
                          'Audit reminders',
                          'System updates',
                          'Security alerts'
                        ].map((notification) => (
                          <label key={notification} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {notification}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                        In-App Notifications
                      </h3>
                      <div className="space-y-2">
                        {[
                          'Real-time alerts',
                          'Task assignments',
                          'Approval requests',
                          'Status updates',
                          'Reminders'
                        ].map((notification) => (
                          <label key={notification} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {notification}
                            </span>
                          </label>
                        ))}
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