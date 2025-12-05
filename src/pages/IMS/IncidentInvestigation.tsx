import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Save,
  Plus,
  Trash2,
  Users,
  Search,
  Target,
  Lightbulb,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchIncidentById, updateIncident } from '../../store/slices/incidentSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface InvestigationData {
  investigation: {
    findings: string;
    rootCause: {
      immediate: string;
      underlying: string;
      rootCause: string;
    };
    fiveWhys: Array<{
      question: string;
      answer: string;
    }>;
    fishbone: {
      people: string[];
      process: string[];
      environment: string[];
      equipment: string[];
      materials: string[];
      methods: string[];
    };
  };
}

const IncidentInvestigation: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentIncident, isLoading } = useAppSelector((state) => state.incident);
  const [activeTab, setActiveTab] = useState('findings');

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<InvestigationData>({
    defaultValues: {
      investigation: {
        fiveWhys: [
          { question: 'Why did the incident occur?', answer: '' },
          { question: 'Why did this condition exist?', answer: '' },
          { question: 'Why was this not prevented?', answer: '' },
          { question: 'Why was this not detected earlier?', answer: '' },
          { question: 'Why do we not have systems to prevent this?', answer: '' }
        ],
        fishbone: {
          people: [''],
          process: [''],
          environment: [''],
          equipment: [''],
          materials: [''],
          methods: ['']
        }
      }
    }
  });

  const { fields: whyFields } = useFieldArray({
    control,
    name: 'investigation.fiveWhys'
  });

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchIncidentById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  useEffect(() => {
    if (currentIncident?.investigation) {
      const investigation = currentIncident.investigation;
      setValue('investigation.findings', investigation.findings || '');
      setValue('investigation.rootCause', investigation.rootCause || {
        immediate: '',
        underlying: '',
        rootCause: ''
      });
      if (investigation.fiveWhys && investigation.fiveWhys.length > 0) {
        setValue('investigation.fiveWhys', investigation.fiveWhys);
      }
      if (investigation.fishbone) {
        setValue('investigation.fishbone', investigation.fishbone);
      }
    }
  }, [currentIncident, setValue]);

  const onSubmit = async (data: InvestigationData) => {
    if (!user?.companyId || !id) return;

    try {
      await dispatch(updateIncident({
        companyId: user.companyId,
        id,
        updateData: {
          ...data,
          status: 'rca_submitted'
        }
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'Investigation completed successfully'
      }));
      navigate(`/ims/incidents/${id}`);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to save investigation'
      }));
    }
  };

  const tabs = [
    { id: 'findings', name: 'Investigation Findings', icon: Search },
    { id: 'rca', name: 'Root Cause Analysis', icon: Target },
    { id: 'fishbone', name: 'Fishbone Analysis', icon: AlertTriangle },
  ];

  const fishboneCategories = [
    { key: 'people', label: 'People', color: 'bg-red-100 text-red-800', description: 'Human factors, training, competency' },
    { key: 'process', label: 'Process', color: 'bg-blue-100 text-blue-800', description: 'Procedures, methods, workflows' },
    { key: 'environment', label: 'Environment', color: 'bg-green-100 text-green-800', description: 'Physical conditions, weather, layout' },
    { key: 'equipment', label: 'Equipment', color: 'bg-yellow-100 text-yellow-800', description: 'Tools, machinery, technology' },
    { key: 'materials', label: 'Materials', color: 'bg-purple-100 text-purple-800', description: 'Raw materials, supplies, chemicals' },
    { key: 'methods', label: 'Methods', color: 'bg-pink-100 text-pink-800', description: 'Techniques, approaches, standards' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Incident Investigation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentIncident?.incidentNumber} - Complete root cause analysis and findings
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/ims/incidents/${id}`)}
          >
            Back to Incident
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            Complete Investigation
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Investigation Findings Tab */}
          {activeTab === 'findings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <label htmlFor="investigation.findings" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Investigation Findings *
                </label>
                <textarea
                  {...register('investigation.findings', { required: 'Findings are required', minLength: { value: 50, message: 'Please provide detailed findings (minimum 50 characters)' } })}
                  rows={8}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Document detailed investigation findings including:
- What happened (sequence of events)
- When it happened (timeline)
- Where it happened (location details)
- Who was involved (people and roles)
- How it happened (mechanism of injury/damage)
- Why it happened (contributing factors)"
                />
                {errors.investigation?.findings && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.investigation.findings.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="investigation.rootCause.immediate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Immediate Cause *
                  </label>
                  <textarea
                    {...register('investigation.rootCause.immediate', { required: 'Immediate cause is required' })}
                    rows={4}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="What directly caused the incident? (unsafe acts, unsafe conditions)"
                  />
                  {errors.investigation?.rootCause?.immediate && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.investigation.rootCause.immediate.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="investigation.rootCause.underlying" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Underlying Cause *
                  </label>
                  <textarea
                    {...register('investigation.rootCause.underlying', { required: 'Underlying cause is required' })}
                    rows={4}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="What conditions allowed this to happen? (job factors, personal factors)"
                  />
                  {errors.investigation?.rootCause?.underlying && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.investigation.rootCause.underlying.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="investigation.rootCause.rootCause" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Root Cause *
                  </label>
                  <textarea
                    {...register('investigation.rootCause.rootCause', { required: 'Root cause is required' })}
                    rows={4}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="What is the fundamental management system failure? (basic causes)"
                  />
                  {errors.investigation?.rootCause?.rootCause && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.investigation.rootCause.rootCause.message}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Root Cause Analysis Tab */}
          {activeTab === 'rca' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Five Whys Analysis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Ask "Why?" five times to drill down to the root cause. Each answer should lead to the next "Why?" question.
                </p>
                <div className="space-y-4">
                  {whyFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Question {index + 1}
                        </label>
                        <input
                          {...register(`investigation.fiveWhys.${index}.question` as const)}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Answer {index + 1} *
                        </label>
                        <input
                          {...register(`investigation.fiveWhys.${index}.answer` as const, { required: `Answer ${index + 1} is required` })}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          placeholder="Provide a specific, factual answer..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Fishbone Analysis Tab */}
          {activeTab === 'fishbone' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Fishbone Diagram (Cause & Effect Analysis)
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Identify potential causes in each category that may have contributed to the incident.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fishboneCategories.map((category) => (
                    <div key={category.key} className="space-y-3">
                      <div className={`px-3 py-2 rounded-lg ${category.color}`}>
                        <h4 className="font-medium">{category.label}</h4>
                        <p className="text-xs opacity-75">{category.description}</p>
                      </div>
                      <textarea
                        {...register(`investigation.fishbone.${category.key}.0` as const)}
                        rows={4}
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                        placeholder={`List ${category.label.toLowerCase()}-related causes...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </Card>

        {/* AI Assistance Panel */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
            AI Investigation Assistance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Suggested Investigation Areas</h4>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>• Review training records and competency assessments</li>
                <li>• Examine equipment maintenance and inspection logs</li>
                <li>• Analyze environmental conditions at time of incident</li>
                <li>• Check compliance with procedures and standards</li>
                <li>• Interview witnesses and affected personnel</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Common Root Causes</h4>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>• Inadequate risk assessment or job planning</li>
                <li>• Insufficient training or supervision</li>
                <li>• Poor communication or unclear procedures</li>
                <li>• Inadequate maintenance or equipment failure</li>
                <li>• Management system deficiencies</li>
              </ul>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default IncidentInvestigation;