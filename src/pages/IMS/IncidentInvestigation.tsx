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
  Lightbulb
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchIncidentById, updateIncident } from '../../store/slices/incidentSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface InvestigationData {
  investigation: {
    assignedTo: string;
    team: string[];
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
  const { users } = useAppSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState('team');

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<InvestigationData>({
    defaultValues: {
      investigation: {
        team: [],
        fiveWhys: [
          { question: 'Why did the incident occur?', answer: '' },
          { question: 'Why?', answer: '' },
          { question: 'Why?', answer: '' },
          { question: 'Why?', answer: '' },
          { question: 'Why?', answer: '' }
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
      setValue('investigation.assignedTo', investigation.assignedTo?._id || '');
      setValue('investigation.team', investigation.team?.map((t: any) => t._id) || []);
      setValue('investigation.findings', investigation.findings || '');
      setValue('investigation.rootCause', investigation.rootCause || {
        immediate: '',
        underlying: '',
        rootCause: ''
      });
    }
  }, [currentIncident, setValue]);

  const onSubmit = async (data: InvestigationData) => {
    if (!user?.companyId || !id) return;

    try {
      await dispatch(updateIncident({
        companyId: user.companyId,
        id,
        data
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'Investigation updated successfully'
      }));
      navigate(`/ims/incidents/${id}`);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to update investigation'
      }));
    }
  };

  const tabs = [
    { id: 'team', name: 'Investigation Team', icon: Users },
    { id: 'findings', name: 'Findings', icon: Search },
    { id: 'rca', name: 'Root Cause Analysis', icon: Target },
  ];

  const fishboneCategories = [
    { key: 'people', label: 'People', color: 'bg-red-100 text-red-800' },
    { key: 'process', label: 'Process', color: 'bg-blue-100 text-blue-800' },
    { key: 'environment', label: 'Environment', color: 'bg-green-100 text-green-800' },
    { key: 'equipment', label: 'Equipment', color: 'bg-yellow-100 text-yellow-800' },
    { key: 'materials', label: 'Materials', color: 'bg-purple-100 text-purple-800' },
    { key: 'methods', label: 'Methods', color: 'bg-pink-100 text-pink-800' },
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
            {currentIncident?.incidentNumber} - {currentIncident?.description}
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
            Save Investigation
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
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

          {/* Investigation Team Tab */}
          {activeTab === 'team' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="investigation.assignedTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Lead Investigator *
                  </label>
                  <select
                    {...register('investigation.assignedTo', { required: 'Lead investigator is required' })}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Lead Investigator</option>
                    {users.filter(u => ['safety_incharge', 'plant_head', 'hod'].includes(u.role)).map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                  {errors.investigation?.assignedTo && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.investigation.assignedTo.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Investigation Team
                  </label>
                  <select
                    {...register('investigation.team')}
                    multiple
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    size={5}
                  >
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Hold Ctrl/Cmd to select multiple team members
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Findings Tab */}
          {activeTab === 'findings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-6"
            >
              <div>
                <label htmlFor="investigation.findings" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Investigation Findings *
                </label>
                <textarea
                  {...register('investigation.findings', { required: 'Findings are required' })}
                  rows={6}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Document detailed investigation findings..."
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
                    Immediate Cause
                  </label>
                  <textarea
                    {...register('investigation.rootCause.immediate')}
                    rows={3}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="What directly caused the incident?"
                  />
                </div>

                <div>
                  <label htmlFor="investigation.rootCause.underlying" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Underlying Cause
                  </label>
                  <textarea
                    {...register('investigation.rootCause.underlying')}
                    rows={3}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="What conditions allowed this to happen?"
                  />
                </div>

                <div>
                  <label htmlFor="investigation.rootCause.rootCause" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Root Cause
                  </label>
                  <textarea
                    {...register('investigation.rootCause.rootCause')}
                    rows={3}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="What is the fundamental cause?"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Root Cause Analysis Tab */}
          {activeTab === 'rca' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-6"
            >
              {/* Five Whys */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Five Whys Analysis
                </h3>
                <div className="space-y-4">
                  {whyFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Why #{index + 1}
                        </label>
                        <input
                          {...register(`investigation.fiveWhys.${index}.question` as const)}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Answer
                        </label>
                        <input
                          {...register(`investigation.fiveWhys.${index}.answer` as const)}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          placeholder="Provide the answer..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fishbone Diagram */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Fishbone Diagram (Cause & Effect)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fishboneCategories.map((category) => (
                    <div key={category.key} className="space-y-2">
                      <label className={`block text-sm font-medium px-2 py-1 rounded ${category.color}`}>
                        {category.label}
                      </label>
                      <textarea
                        {...register(`investigation.fishbone.${category.key}.0` as const)}
                        rows={3}
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                        placeholder={`${category.label} related causes...`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Assistance */}
              <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      AI Root Cause Suggestions
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Based on similar incidents, consider these potential root causes:
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">• Inadequate training or supervision</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">• Procedural gaps or unclear instructions</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">• Equipment maintenance issues</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">• Environmental factors not considered</p>
                </div>
              </Card>
            </motion.div>
          )}
        </Card>
      </form>
    </div>
  );
};

export default IncidentInvestigation;