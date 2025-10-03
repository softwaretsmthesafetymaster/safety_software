import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  CheckSquare,
  FileText,
  Calendar,
  User,
  Download
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Template {
  _id: string;
  name: string;
  code: string;
  standard: string;
  description: string;
  isDefault: boolean;
  categories: Array<{
    name: string;
    description?: string;
    questions: Array<{
      id: string;
      question: string;
      clause?: string;
      element?: string;
      legalStandard?: string;
    }>;
  }>;
  createdBy: any;
  lastModifiedBy?: any;
  createdAt: string;
  updatedAt: string;
}

const TemplateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (id && user?.companyId) {
      fetchTemplate();
    }
  }, [id, user?.companyId]);

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
        setTemplate(data.template);
      } else {
        throw new Error('Template not found');
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

  const getTotalQuestions = () => {
    return template?.categories?.reduce((total, category) => 
      total + (category.questions?.length || 0), 0) || 0;
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Template not found
        </h3>
        <Button
          onClick={() => navigate('/audit/templates')}
          variant="primary"
          className="mt-4"
        >
          Back to Templates
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
            onClick={() => navigate('/audit/templates')}
          >
            Back
          </Button>
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{getTemplateIcon(template.standard)}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {template.name}
              </h1>
              <div className="flex items-center space-x-3">
                <span className="text-gray-600 dark:text-gray-400">
                  {template.standard}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                  template.isDefault 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {template.isDefault ? 'Default Template' : 'Custom Template'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* <Button
            variant="secondary"
            icon={Download}
          >
            Export
          </Button> */}
          {!template.isDefault && (
            <Button
              as={Link}
              to={`/audit/templates/${id}/edit`}
              variant="primary"
              icon={Edit}
            >
              Edit Template
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Overview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Template Overview
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {template.description || 'No description provided'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Template Code
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                    {template.code}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Categories
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {template.categories?.length || 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total Questions
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {getTotalQuestions()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Categories and Questions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <CheckSquare className="h-5 w-5 mr-2" />
              Categories & Questions
            </h2>
            
            <div className="space-y-4">
              {template.categories?.map((category, categoryIndex) => (
                <motion.div
                  key={categoryIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: categoryIndex * 0.1 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <button
                    onClick={() => setExpandedCategory(
                      expandedCategory === category.name ? null : category.name
                    )}
                    className="w-full px-4 py-3 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {category.questions?.length || 0} questions
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedCategory === category.name ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  
                  {expandedCategory === category.name && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="space-y-3">
                        {category.questions?.map((question, questionIndex) => (
                          <div
                            key={question.id}
                            className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-600"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {question.id}
                              </span>
                              <div className="flex space-x-2">
                                <span className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                                  Yes
                                </span>
                                <span className="inline-flex px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                                  No
                                </span>
                                <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded">
                                  N/A
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-900 dark:text-white mb-2">
                              {question.question}
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                              {question.clause && (
                                <div>
                                  <span className="font-medium">Clause:</span> {question.clause}
                                </div>
                              )}
                              {question.element && (
                                <div>
                                  <span className="font-medium">Element:</span> {question.element}
                                </div>
                              )}
                              {question.legalStandard && (
                                <div>
                                  <span className="font-medium">Standard:</span> {question.legalStandard}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Template Statistics */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Statistics
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Categories:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {template.categories?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Questions:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {getTotalQuestions()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Standard:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {template.standard}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {template.isDefault ? 'Default' : 'Custom'}
                </span>
              </div>
            </div>
          </Card>

          {/* Template Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Template Information
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(template.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created by:</span>
                <span className="text-gray-900 dark:text-white">
                  {template.createdBy?.name || 'System'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last updated:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(template.updatedAt), 'MMM dd, yyyy')}
                </span>
              </div>
              {template.lastModifiedBy && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Modified by:</span>
                  <span className="text-gray-900 dark:text-white">
                    {template.lastModifiedBy.name}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Button
                as={Link}
                to={`/audit/audits/new?template=${template._id}`}
                variant="primary"
                className="w-full"
                icon={CheckSquare}
              >
                Create Audit
              </Button>
              {/* <Button
                variant="secondary"
                className="w-full"
                icon={Download}
              >
                Export Template
              </Button> */}
              {!template.isDefault && (
                <Button
                  as={Link}
                  to={`/audit/templates/${id}/edit`}
                  variant="secondary"
                  className="w-full"
                  icon={Edit}
                >
                  Edit Template
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TemplateDetail;