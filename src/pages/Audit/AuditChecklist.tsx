import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || '/api';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  Save,
  ArrowLeft,
  Camera,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';

interface ChecklistItem {
  categoryId: string;
  categoryName: string;
  questionId: string;
  question: string;
  clause: string;
  element: string;
  legalStandard: string;
  answer: 'yes' | 'no' | 'na' | null;
  remarks: string;
  evidence: string;
  photos: string[];
  completedBy?: any;
  completedAt?: string;
}

const AuditChecklist: React.FC = () => {
  const { auditId } = useParams<{ auditId: string }>();

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [audit, setAudit] = useState<any>(null);
  
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnswer, setFilterAnswer] = useState<string>('');


  useEffect(() => {
    if (auditId && user?.companyId) {
      fetchAuditChecklist();
    }
  }, [auditId, user?.companyId]);

  const fetchAuditChecklist = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/checklist/${user?.companyId}/audit/${auditId}`);
    
      const data = await response.data;
      
      if (data.audit) {
        setAudit(data.audit);
        

        // If checklist is empty, initialize from template
        if (!data.audit.checklist || data.audit.checklist.length === 0) {
          await initializeChecklist(data.audit.checklistTemplate._id);
        } else {
          setChecklist(data.audit.checklist);
        }
      }
    } catch (error) {
      console.error('Failed to fetch checklist:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to load audit checklist'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const initializeChecklist = async (selectedTemplateId:string) => {
    if (!selectedTemplateId) return;
    try {
      const response = await axios.post(`${API_URL}/checklist/${user?.companyId}/audit/${auditId}/initialize`,{
        templateId: selectedTemplateId
      });
      const data = await response.data;
      if (data.audit) {
        setChecklist(data.audit.checklist);
      }
    } catch (error) {
      console.error('Failed to initialize checklist:', error);
    }
  };

  const updateChecklistItem = (index: number, field: string, value: any) => {
    const updatedChecklist = [...checklist];
    updatedChecklist[index] = {
      ...updatedChecklist[index],
      [field]: value,
      completedBy: user?._id,
      completedAt: new Date().toISOString()
    };
    setChecklist(updatedChecklist);
    
    // Auto-save after a short delay
    setTimeout(() => saveChecklist(updatedChecklist), 1000);
  };

  const saveChecklist = async (checklistData = checklist) => {
    try {
      setIsSaving(true);
      const response = await axios.patch(`${API_URL}/checklist/${user?.companyId}/audit/${auditId}` , {
        checklist: checklistData
      });
      
      const data = await response.data;
      if (data.audit) {
        setAudit(data.audit);
        dispatch(addNotification({
          type: 'success',
          message: 'Checklist saved successfully'
        }));
      }
    } catch (error) {
      console.error('Failed to save checklist:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to save checklist'
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const getProgress = () => {
    const total = checklist.length;
    const answered = checklist.filter(item => item.answer).length;
    return { total, answered, percentage: total > 0 ? Math.round((answered / total) * 100) : 0 };
  };

  const getCategories = () => {
    const categories = new Set(checklist.map(item => item.categoryName));
    return Array.from(categories);
  };

  const getFilteredChecklist = () => {
    let filtered = checklist;
    
    if (selectedCategory) {
      filtered = filtered.filter(item => item.categoryName === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.element?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clause?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterAnswer) {
      if (filterAnswer === 'unanswered') {
        filtered = filtered.filter(item => !item.answer);
      } else {
        filtered = filtered.filter(item => item.answer === filterAnswer);
      }
    }
    
    return filtered;
  };

  const getAnswerColor = (answer: string | null) => {
    switch (answer) {
      case 'yes': return 'bg-green-100 text-green-800 border-green-200';
      case 'no': return 'bg-red-100 text-red-800 border-red-200';
      case 'na': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!audit) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Audit not found
        </h3>
        <Button
          onClick={() => navigate('/audit/audits')}
          variant="primary"
          className="mt-4"
        >
          Back to Audits
        </Button>
      </div>
    );
  }

  const progress = getProgress();
  const categories = getCategories();
  const filteredChecklist = getFilteredChecklist();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate(`/audit/audits/${auditId}`)}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Audit Checklist
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {audit.auditNumber} - {audit.title}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            icon={Eye}
            onClick={() => navigate(`/audit/audits/${auditId}/observations`)}
          >
            Observations
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isSaving}
            onClick={() => saveChecklist()}
          >
            Save Progress
          </Button>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <CheckSquare className="h-5 w-5 mr-2" />
            Checklist Progress
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {progress.answered} of {progress.total} completed
            </span>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              progress.percentage === 100 
                ? 'bg-green-100 text-green-800' 
                : progress.percentage > 50 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {progress.percentage}% Complete
            </div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
        
        {progress.percentage === 100 && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Checklist Completed!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  All questions have been answered. You can now proceed to create observations.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Questions
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Search questions..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Answer Status
            </label>
            <select
              value={filterAnswer}
              onChange={(e) => setFilterAnswer(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Answers</option>
              <option value="unanswered">Unanswered</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="na">N/A</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedCategory('');
                setSearchTerm('');
                setFilterAnswer('');
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Checklist Items */}
      <div className="space-y-4">
        {filteredChecklist.map((item, index) => {
          const originalIndex = checklist.findIndex(c => c.questionId === item.questionId);
          
          return (
            <motion.div
              key={item.questionId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-6">
                <div className="space-y-4">
                  {/* Question Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {item.categoryName}
                        </span>
                        {item.clause && (
                          <span className="text-xs text-gray-500">
                            Clause: {item.clause}
                          </span>
                        )}
                        {item.element && (
                          <span className="text-xs text-gray-500">
                            Element: {item.element}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {item.question}
                      </h3>
                      {item.legalStandard && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Legal Standard: {item.legalStandard}
                        </p>
                      )}
                    </div>
                    
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getAnswerColor(item.answer)}`}>
                      {item.answer ? item.answer.toUpperCase() : 'PENDING'}
                    </div>
                  </div>

                  {/* Answer Options */}
                  <div className="grid grid-cols-3 gap-3">
                    {['yes', 'no', 'na'].map((option) => (
                      <button
                        key={option}
                        onClick={() => updateChecklistItem(originalIndex, 'answer', option)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          item.answer === option
                            ? option === 'yes' 
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : option === 'no'
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-500 bg-gray-50 text-gray-700'
                            : 'border-gray-300 hover:border-gray-400 text-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          {option === 'yes' && <CheckCircle className="h-4 w-4" />}
                          {option === 'no' && <AlertTriangle className="h-4 w-4" />}
                          {option === 'na' && <Clock className="h-4 w-4" />}
                          <span className="font-medium">
                            {option === 'yes' ? 'Yes' : option === 'no' ? 'No' : 'N/A'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Remarks and Evidence */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Remarks
                      </label>
                      <textarea
                        value={item.remarks || ''}
                        onChange={(e) => updateChecklistItem(originalIndex, 'remarks', e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Add remarks or observations..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Evidence
                      </label>
                      <textarea
                        value={item.evidence || ''}
                        onChange={(e) => updateChecklistItem(originalIndex, 'evidence', e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Describe evidence or documentation..."
                      />
                    </div>
                  </div>

                  {/* Photo Upload */}
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Photos
                    </label>
                    <div className="flex items-center space-x-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.accept = 'image/*';
                          fileInput.multiple = true;
                          fileInput.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files) {
                              const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
                              updateChecklistItem(originalIndex, 'photos', [...(item.photos || []), ...newPhotos]);
                            }
                          };
                          fileInput.click();
                        }}
                        icon={Camera}
                      >
                        Add Photo
                      </Button>
                      {item.photos && item.photos.length > 0 && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.photos.length} photo(s) attached
                        </span>
                      )}
                    </div>
                  </div> */}

                  {/* Completion Info */}
                  {item.completedBy && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="h-4 w-4" />
                        <span>
                          {item?.completedAt
                            ? `Completed by ${item?.completedBy?.name} on ${format(new Date(item.completedAt), 'MMM dd, yyyy HH:mm')}`
                            : `Completed by ${item?.completedBy?.name}`}
                        </span>

                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}

        {filteredChecklist.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No checklist items found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || selectedCategory || filterAnswer
                ? 'No items match your current filters.'
                : 'The checklist is empty or not initialized.'}
            </p>
          </Card>
        )}
      </div>

      {/* Floating Save Button */}
      {isSaving && (
        <div className="fixed bottom-6 right-6">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Saving...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditChecklist;