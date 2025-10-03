import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Save } from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';

interface WorkflowStep {
  step: number;
  role: string;
  required: boolean;
  parallel?: boolean;
  timeLimit?: number;
}

interface WorkflowFormProps {
  module: string;
  workflow: string;
  initialSteps?: WorkflowStep[];
  availableRoles: string[];
  onSave: (steps: WorkflowStep[]) => void;
  onCancel: () => void;
}

const WorkflowForm: React.FC<WorkflowFormProps> = ({
  module,
  workflow,
  initialSteps = [],
  availableRoles,
  onSave,
  onCancel
}) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      steps: initialSteps.length > 0 ? initialSteps : [
        { step: 1, role: '', required: true, parallel: false, timeLimit: 24 }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'steps'
  });

  const onSubmit = (data: { steps: WorkflowStep[] }) => {
    // Ensure step numbers are sequential
    const sortedSteps = data.steps.map((step, index) => ({
      ...step,
      step: index + 1
    }));
    
    onSave(sortedSteps);
  };

  const workflowLabels: Record<string, string> = {
    approval: 'Approval Workflow',
    investigation: 'Investigation Workflow',
    review: 'Review Workflow',
    closure: 'Closure Workflow'
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {workflowLabels[workflow] || 'Workflow Configuration'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure the {workflow} workflow for {module} module
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          icon={Plus}
          onClick={() => append({ 
            step: fields.length + 1, 
            role: '', 
            required: true, 
            parallel: false, 
            timeLimit: 24 
          })}
        >
          Add Step
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {Array.isArray(fields) && fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Step
                </label>
                <input
                  {...register(`steps.${index}.step` as const, { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role *
                </label>
                <select
                  {...register(`steps.${index}.role` as const, { required: 'Role is required' })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select Role</option>
                  {Array.isArray(availableRoles) && availableRoles.map(role => (
                    <option key={role} value={role}>
                      {role.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
                {errors.steps?.[index]?.role && (
                  <p className="mt-1 text-sm text-red-600">Role is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Time Limit (hrs)
                </label>
                <input
                  {...register(`steps.${index}.timeLimit` as const, { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex items-center pt-6">
                <input
                  {...register(`steps.${index}.required` as const)}
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Required
                </label>
              </div>

              <div className="flex items-center pt-6">
                <input
                  {...register(`steps.${index}.parallel` as const)}
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Parallel
                </label>
              </div>

              <div className="flex items-center pt-6">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
          >
            Save Workflow
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default WorkflowForm;