import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  CheckSquare,
  FileText
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface TemplateFormData {
  name: string;
  standard: string;
  description: string;
  categories: Array<{
    name: string;
    description: string;
    questions: Array<{
      id: string;
      question: string;
      clause: string;
      element: string;
      legalStandard: string;
    }>;
  }>;
}

const TemplateForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAppSelector((state) => state.auth);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<TemplateFormData>({
    defaultValues: {
      categories: [{
        name: '',
        description: '',
        questions: [{
          id: '',
          question: '',
          clause: '',
          element: '',
          legalStandard: ''
        }]
      }]
    }
  });

  const { fields: categoryFields, append: appendCategory, remove: removeCategory } = useFieldArray({
    control,
    name: 'categories'
  });

  useEffect(() => {
    if (isEdit && id && user?.companyId) {
      fetchTemplate();
    }
  }, [isEdit, id, user?.companyId]);

  const fetchTemplate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/templates/${user?.companyId}/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const template = data.template;
        
        setValue('name', template.name);
        setValue('standard', template.standard);
        setValue('description', template.description || '');
        setValue('categories', template.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch template:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to load template'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: TemplateFormData) => {
    if (!user?.companyId) return;

    try {
      setIsSaving(true);
      const url = isEdit 
        ? `${API_URL}/templates/${user.companyId}/${id}`
        : `${API_URL}/templates/${user.companyId}`;
      
      const method = isEdit ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...data,
          code: isEdit ? undefined : `CUSTOM_${Date.now()}`
        })
      });
      if (response.ok) {
        dispatch(addNotification({
          type: 'success',
          message: `Template ${isEdit ? 'updated' : 'created'} successfully`
        }));
        navigate('/audit/templates');
      } else {
        throw new Error(`Failed to ${isEdit ? 'update' : 'create'} template`);
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Failed to ${isEdit ? 'update' : 'create'} template`
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const standards = [
    { value: 'BIS14489', label: 'BIS 14489' },
    { value: 'FireSafety', label: 'Fire Safety' },
    { value: 'ElectricalSafety', label: 'Electrical Safety' },
    { value: 'ISO45001', label: 'ISO 45001' },
    { value: 'PSM', label: 'PSM' },
    { value: 'AISafety', label: 'AI Safety' },
    { value: 'custom', label: 'Custom' }
  ];

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
            onClick={() => navigate('/audit/templates')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Template' : 'Create New Template'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isEdit ? 'Update template details and questions' : 'Create a custom audit checklist template'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Template Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Name *
              </label>
              <input
                {...register('name', { required: 'Template name is required' })}
                type="text"
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter template name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Standard *
              </label>
              <select
                {...register('standard', { required: 'Standard is required' })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Standard</option>
                {standards.map((standard) => (
                  <option key={standard.value} value={standard.value}>
                    {standard.label}
                  </option>
                ))}
              </select>
              {errors.standard && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.standard.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Template description..."
            />
          </div>
        </Card>

        {/* Categories */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <CheckSquare className="h-5 w-5 mr-2" />
              Categories & Questions
            </h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => appendCategory({
                name: '',
                description: '',
                questions: [{
                  id: '',
                  question: '',
                  clause: '',
                  element: '',
                  legalStandard: ''
                }]
              })}
            >
              Add Category
            </Button>
          </div>

          <div className="space-y-6">
            {categoryFields.map((categoryField, categoryIndex) => (
              <CategorySection
                key={categoryField.id}
                categoryIndex={categoryIndex}
                register={register}
                control={control}
                errors={errors}
                onRemove={() => removeCategory(categoryIndex)}
                canRemove={categoryFields.length > 1}
              />
            ))}
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/audit/templates')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={isSaving}
            className="min-w-[120px]"
          >
            {isEdit ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Category Section Component
interface CategorySectionProps {
  categoryIndex: number;
  register: any;
  control: any;
  errors: any;
  onRemove: () => void;
  canRemove: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categoryIndex,
  register,
  control,
  errors,
  onRemove,
  canRemove
}) => {
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: `categories.${categoryIndex}.questions`
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-medium text-gray-900 dark:text-white">
          Category {categoryIndex + 1}
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => appendQuestion({
              id: `Q_${categoryIndex + 1}_${questionFields.length + 1}`,
              question: '',
              clause: '',
              element: '',
              legalStandard: ''
            })}
          >
            Add Question
          </Button>
          {canRemove && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={onRemove}
            >
              Remove Category
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category Name *
          </label>
          <input
            {...register(`categories.${categoryIndex}.name`, { required: 'Category name is required' })}
            type="text"
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Category name"
          />
          {errors.categories?.[categoryIndex]?.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.categories[categoryIndex].name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category Description
          </label>
          <input
            {...register(`categories.${categoryIndex}.description`)}
            type="text"
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Category description"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Questions ({questionFields.length})
        </h4>
        
        {questionFields.map((questionField, questionIndex) => (
          <div
            key={questionField.id}
            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Question {questionIndex + 1}
              </span>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => removeQuestion(questionIndex)}
                disabled={questionFields.length === 1}
              >
                Remove
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question *
                </label>
                <textarea
                  {...register(`categories.${categoryIndex}.questions.${questionIndex}.question`, {
                    required: 'Question is required'
                  })}
                  rows={2}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter the audit question"
                />
                {errors.categories?.[categoryIndex]?.questions?.[questionIndex]?.question && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.categories[categoryIndex].questions[questionIndex].question.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Clause
                  </label>
                  <input
                    {...register(`categories.${categoryIndex}.questions.${questionIndex}.clause`)}
                    type="text"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="e.g., 4.1.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Element
                  </label>
                  <input
                    {...register(`categories.${categoryIndex}.questions.${questionIndex}.element`)}
                    type="text"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Safety element"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Legal Standard
                  </label>
                  <input
                    {...register(`categories.${categoryIndex}.questions.${questionIndex}.legalStandard`)}
                    type="text"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Applicable standard"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default TemplateForm;