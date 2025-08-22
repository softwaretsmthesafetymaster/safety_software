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
  FileText
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { createAudit, updateAudit, fetchAuditById } from '../../store/slices/auditSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface AuditFormData {
  type: string;
  standard: string;
  title: string;
  scope: string;
  plantId: string;
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
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<AuditFormData>({
    defaultValues: {
      auditTeam: [{ member: '', role: '' }],
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

  useEffect(() => {
    if (isEdit && id && user?.companyId) {
      dispatch(fetchAuditById({ companyId: user.companyId, id }));
    }
  }, [dispatch, isEdit, id, user?.companyId]);

  useEffect(() => {
    if (currentAudit && isEdit) {
      setValue('type', currentAudit.type || '');
      setValue('standard', currentAudit.standard || '');
      setValue('title', currentAudit.title || '');
      setValue('scope', currentAudit.scope || '');
      setValue('plantId', currentAudit.plantId?._id || '');
      setValue('auditee', currentAudit.auditee?._id || '');
      setValue('scheduledDate', currentAudit.scheduledDate ? new Date(currentAudit.scheduledDate).toISOString().split('T')[0] : '');
    }
  }, [currentAudit, isEdit, setValue]);

  const onSubmit = async (data: AuditFormData) => {
    if (!user?.companyId) return;

    try {
      if (isEdit && id) {
        await dispatch(updateAudit({
          companyId: user.companyId,
          id,
          data
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Audit updated successfully'
        }));
      } else {
        await dispatch(createAudit({
          companyId: user.companyId,
          auditData: data
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

  const auditTypes = [
    { value: 'internal', label: 'Internal Audit' },
    { value: 'external', label: 'External Audit' },
    { value: 'regulatory', label: 'Regulatory Audit' },
    { value: 'management', label: 'Management Review' },
    { value: 'process', label: 'Process Audit' },
  ];

  const standards = [
    { value: 'ISO45001', label: 'ISO 45001:2018' },
    { value: 'ISO14001', label: 'ISO 14001:2015' },
    { value: 'OHSAS18001', label: 'OHSAS 18001' },
    { value: 'custom', label: 'Custom Standard' },
  ];

  const auditTemplates = [
    {
      id: 'iso45001_basic',
      name: 'ISO 45001 Basic Audit',
      description: 'Standard ISO 45001 compliance audit checklist',
      categories: ['Leadership', 'Planning', 'Support', 'Operation', 'Performance Evaluation', 'Improvement']
    },
    {
      id: 'safety_management',
      name: 'Safety Management System',
      description: 'Comprehensive safety management audit',
      categories: ['Policy', 'Organization', 'Planning', 'Implementation', 'Evaluation', 'Management Review']
    },
    {
      id: 'process_safety',
      name: 'Process Safety Audit',
      description: 'Process safety management audit',
      categories: ['Process Safety Information', 'Process Hazard Analysis', 'Operating Procedures', 'Training', 'Contractors', 'Pre-startup Safety Review']
    },
    {
      id: 'behavioral_safety',
      name: 'Behavioral Safety Audit',
      description: 'Behavior-based safety audit',
      categories: ['Safety Culture', 'Leadership Commitment', 'Employee Engagement', 'Communication', 'Training Effectiveness']
    },
    {
      id: 'emergency_preparedness',
      name: 'Emergency Preparedness',
      description: 'Emergency response and preparedness audit',
      categories: ['Emergency Plans', 'Training & Drills', 'Equipment & Resources', 'Communication Systems', 'Recovery Procedures']
    }
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = auditTemplates.find(t => t.id === templateId);
    if (template) {
      setValue('title', template.name);
      setValue('scope', template.description);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Audit' : 'New Safety Audit'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update audit details' : 'Create a new safety audit'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/audit/audits')}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            {isEdit ? 'Update' : 'Create'} Audit
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Audit Templates */}
        {!isEdit && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Audit Template
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {auditTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.categories.slice(0, 3).map((category, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                        {category}
                      </span>
                    ))}
                    {template.categories.length > 3 && (
                      <span className="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                        +{template.categories.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Audit Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Audit Type *
              </label>
              <select
                {...register('type', { required: 'Audit type is required' })}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Type</option>
                {auditTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="standard" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Standard *
              </label>
              <select
                {...register('standard', { required: 'Standard is required' })}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Standard</option>
                {standards.map((standard) => (
                  <option key={standard.value} value={standard.value}>
                    {standard.label}
                  </option>
                ))}
              </select>
              {errors.standard && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.standard.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Audit Title *
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              type="text"
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Enter audit title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="mt-6">
            <label htmlFor="scope" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Audit Scope *
            </label>
            <textarea
              {...register('scope', { required: 'Scope is required' })}
              rows={4}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Define the audit scope and objectives..."
            />
            {errors.scope && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.scope.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <label htmlFor="plantId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Plant *
              </label>
              <select
                {...register('plantId', { required: 'Plant is required' })}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Plant</option>
                {plants.map((plant) => (
                  <option key={plant._id} value={plant._id}>
                    {plant.name}
                  </option>
                ))}
              </select>
              {errors.plantId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.plantId.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="auditee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Auditee
              </label>
              <select
                {...register('auditee')}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Auditee</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Scheduled Date *
              </label>
              <input
                {...register('scheduledDate', { required: 'Date is required' })}
                type="date"
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              {errors.scheduledDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.scheduledDate.message}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Audit Team */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Audit Team
            </h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => appendTeam({ member: '', role: '' })}
            >
              Add Team Member
            </Button>
          </div>
          
          <div className="space-y-4">
            {teamFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Team Member
                  </label>
                  <select
                    {...register(`auditTeam.${index}.member` as const)}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Member</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role in Audit
                  </label>
                  <input
                    {...register(`auditTeam.${index}.role` as const)}
                    type="text"
                    placeholder="e.g., Lead Auditor"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => removeTeam(index)}
                    disabled={teamFields.length === 1}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Audit Areas */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
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
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Area Name
                  </label>
                  <input
                    {...register(`areas.${index}.name` as const)}
                    type="text"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Area name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Area In-Charge
                  </label>
                  <select
                    {...register(`areas.${index}.inCharge` as const)}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select In-Charge</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name}
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
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </form>
    </div>
  );
};

export default AuditForm;