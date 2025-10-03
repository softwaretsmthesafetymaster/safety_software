import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Save,
  Plus,
  Trash2,
  CheckSquare,
  Users,
  Calendar,
  FileText,
  ArrowLeft,
  Upload
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { createAudit, updateAudit, fetchAuditById } from '../../store/slices/auditSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { addNotification } from '../../store/slices/uiSlice';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface AuditFormData {
  templateId: string;
  title: string;
  scope: string;
  plantId: string;
  areaId: string;
  auditTeam: Array<{
    member: string;
    role: string;
  }>;
  auditee: string;
  scheduledDate: string;
  areas: Array<{
    name: string;
    inCharge: string;
  }>;
}

const AuditForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const isEdit = !!id;
  
  const { user } = useAppSelector((state) => state.auth);
  const { currentAudit, isLoading } = useAppSelector((state) => state.audit);
  const { plants } = useAppSelector((state) => state.plant);
  const { users } = useAppSelector((state) => state.user);
  
  const [selectedPlant, setSelectedPlant] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<AuditFormData>({
    defaultValues: {
      auditTeam: [{ member: '', role: 'Team Member' }],
      areas: [{ name: '', inCharge: '' }]
    }
  });

  const { fields: teamFields, append: appendTeam, remove: removeTeam } = useFieldArray({
    control,
    name: 'auditTeam'
  });

  const { fields: areaFields, append: appendArea, remove: removeArea } = useFieldArray({
    control,
    name: 'areas'
  });

  const watchPlantId = watch('plantId');
  const watchTemplateId = watch('templateId');

  useEffect(() => {
    if (watchPlantId) {
      const plant = plants.find(p => p._id === watchPlantId);
      setSelectedPlant(plant);
    }
  }, [watchPlantId, plants]);

  useEffect(() => {
    if (watchTemplateId) {
      const template = templates.find(t => t._id === watchTemplateId);
      setSelectedTemplate(template);
      if (template) {
        setValue('title', template.name);
        setValue('scope', template.description || '');
      }
    }
  }, [watchTemplateId, templates, setValue]);

  useEffect(() => {
    if (user?.companyId) {
      fetchTemplates();
      initializeDefaultTemplates();
    }
  }, [user?.companyId]);

  useEffect(() => {
    if (isEdit && id && user?.companyId) {
      dispatch(fetchAuditById({ companyId: user.companyId, id }));
    }
  }, [dispatch, isEdit, id, user?.companyId]);

  useEffect(() => {
    if (currentAudit && isEdit) {
      setValue('templateId', currentAudit.templateId || '');
      setValue('title', currentAudit.title || '');
      setValue('scope', currentAudit.scope || '');
      setValue('plantId', currentAudit.plantId?._id || '');
      setValue('areaId', currentAudit.areaId || '');
      setValue('auditee', currentAudit.auditee?._id || '');
      setValue('scheduledDate', currentAudit.scheduledDate ? new Date(currentAudit.scheduledDate).toISOString().split('T')[0] : '');
      
      if (currentAudit.auditTeam) {
        setValue('auditTeam', currentAudit.auditTeam.map((member: any) => ({
          member: member.member._id,
          role: member.role
        })));
      }
      
      if (currentAudit.areas) {
        setValue('areas', currentAudit.areas.map((area: any) => ({
          name: area.name,
          inCharge: area.inCharge._id
        })));
      }
    }
  }, [currentAudit, isEdit, setValue]);

  const initializeDefaultTemplates = async () => {
    try {
      await fetch(`${API_URL}/templates/initialize-defaults/${user?.companyId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
    } catch (error) {
      console.error('Failed to initialize default templates:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await fetch(`${API_URL}/templates/${user?.companyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const onSubmit = async (data: AuditFormData) => {
    if (!user?.companyId) return;

    try {
      const auditData = {
        ...data,
        type: 'internal',
        standard: selectedTemplate?.standard || 'custom'
      };

      if (isEdit && id) {
        await dispatch(updateAudit({
          companyId: user.companyId,
          id,
          data: auditData
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Audit updated successfully'
        }));
      } else {
        await dispatch(createAudit({
          companyId: user.companyId,
          auditData
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Audit created successfully'
        }));
      }
      navigate('/audit/audits');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to save audit'
      }));
    }
  };

  const getTemplateIcon = (standard: string) => {
    switch (standard) {
      case 'BIS14489': return '🏭';
      case 'FireSafety': return '🔥';
      case 'ElectricalSafety': return '⚡';
      case 'ISO45001': return '🛡️';
      case 'PSM': return '⚗️';
      case 'AISafety': return '🤖';
      default: return '📋';
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate('/audit/audits')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Audit' : 'Create New Internal Audit'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isEdit ? 'Update audit details and team assignments' : 'Set up a new internal safety audit with team and checklist template'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Template Selection */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <CheckSquare className="h-5 w-5 mr-2" />
            Select Audit Template
          </h2>
          
          {loadingTemplates ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <motion.div
                  key={template._id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      {...register('templateId', { required: 'Template selection is required' })}
                      value={template._id}
                      className="sr-only"
                    />
                    <div className={`border-2 rounded-lg p-4 transition-all ${
                      watchTemplateId === template._id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{getTemplateIcon(template.standard)}</span>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {template.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              template.isDefault 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {template.isDefault ? 'Default' : 'Custom'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {template.categories?.length || 0} categories
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                </motion.div>
              ))}
            </div>
          )}
          
          {errors.templateId && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.templateId.message}</p>
          )}
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <Upload className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  Need a custom template?
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  You can create custom templates or upload Excel files with your checklist questions.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => navigate('/audit/templates')}
                >
                  Manage Templates
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Audit Information
          </h2>
          
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Audit Title *
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              type="text"
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Enter descriptive audit title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="scope" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Audit Scope *
            </label>
            <textarea
              {...register('scope', { required: 'Scope is required' })}
              rows={4}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Define the audit scope, objectives, and areas to be covered..."
            />
            {errors.scope && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.scope.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="plantId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plant *
              </label>
              <select
                {...register('plantId', { required: 'Plant is required' })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Plant</option>
                {plants.map((plant) => (
                  <option key={plant._id} value={plant._id}>
                    {plant.name} ({plant.code})
                  </option>
                ))}
              </select>
              {errors.plantId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.plantId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="areaId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Specific Area
              </label>
              <select
                {...register('areaId')}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                disabled={!selectedPlant}
              >
                <option value="">Select Area (Optional)</option>
                {selectedPlant?.areas?.map((area: any) => (
                  <option key={area._id} value={area._id}>
                    {area.name} ({area.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Scheduled Date *
              </label>
              <input
                {...register('scheduledDate', { required: 'Date is required' })}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              {errors.scheduledDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.scheduledDate.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Audit Team */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Audit Team
            </h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => appendTeam({ member: '', role: 'Team Member' })}
            >
              Add Team Member
            </Button>
          </div>
          
          <div className="space-y-4">
            {teamFields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Team Member *
                  </label>
                  <select
                    {...register(`auditTeam.${index}.member` as const, { required: 'Team member is required' })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Member</option>
                    {users.filter(u => u._id !== user?._id).map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                  {errors.auditTeam?.[index]?.member && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.auditTeam[index]?.member?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role in Audit *
                  </label>
                  <select
                    {...register(`auditTeam.${index}.role` as const, { required: 'Role is required' })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Role</option>
                    <option value="Lead Auditor">Lead Auditor</option>
                    <option value="Team Member">Team Member</option>
                    <option value="Technical Expert">Technical Expert</option>
                    <option value="Observer">Observer</option>
                  </select>
                  {errors.auditTeam?.[index]?.role && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.auditTeam[index]?.role?.message}
                    </p>
                  )}
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => removeTeam(index)}
                    disabled={teamFields.length === 1}
                    className="w-full"
                  >
                    Remove
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6">
            <label htmlFor="auditee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Primary Auditee
            </label>
            <select
              {...register('auditee')}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select Primary Auditee</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Audit Areas */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Areas to be Audited
            </h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => appendArea({ name: '', inCharge: '' })}
            >
              Add Area
            </Button>
          </div>
          
          <div className="space-y-4">
            {areaFields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Area Name *
                  </label>
                  <input
                    {...register(`areas.${index}.name` as const, { required: 'Area name is required' })}
                    type="text"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="e.g., Production Floor, Warehouse"
                  />
                  {errors.areas?.[index]?.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.areas[index]?.name?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Area In-Charge
                  </label>
                  <select
                    {...register(`areas.${index}.inCharge` as const)}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select In-Charge</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => removeArea(index)}
                    disabled={areaFields.length === 1}
                    className="w-full"
                  >
                    Remove
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/audit/audits')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={isLoading}
            className="min-w-[120px]"
          >
            {isEdit ? 'Update Audit' : 'Create Audit'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AuditForm;