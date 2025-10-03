import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckSquare,
  Clock,
  Users,
  Star,
  AlertCircle
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchAuditTemplates, createAuditTemplate, uploadChecklistTemplate } from '../../store/slices/auditTemplateSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { addNotification } from '../../store/slices/uiSlice';

interface NewTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const NewTemplateModal: React.FC<NewTemplateModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    standard: '',
    industry: '',
    estimatedDuration: '',
    categories: ['']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      estimatedDuration: parseInt(formData.estimatedDuration) || 60,
      categories: formData.categories.filter(cat => cat.trim()),
      metadata: {
        industry: formData.industry,
        estimatedDuration: parseInt(formData.estimatedDuration) || 60
      }
    });
    onClose();
  };

  const addCategory = () => {
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, '']
    }));
  };

  const updateCategory = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) => i === index ? value : cat)
    }));
  };

  const removeCategory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Create Custom Template
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter template name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Standard *
                </label>
                <input
                  type="text"
                  required
                  value={formData.standard}
                  onChange={(e) => setFormData(prev => ({ ...prev, standard: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., ISO 45001:2018"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Template description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Industry
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Industry</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Construction">Construction</option>
                  <option value="Chemical">Chemical & Process</option>
                  <option value="Oil & Gas">Oil & Gas</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="General">General</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="60"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Categories
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addCategory}
                >
                  Add Category
                </Button>
              </div>
              {formData.categories.map((category, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => updateCategory(index, e.target.value)}
                    className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Category name"
                  />
                  {formData.categories.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeCategory(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                Create Template
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface UploadChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  onUpload: (templateId: string, file: File) => void;
}

const UploadChecklistModal: React.FC<UploadChecklistModalProps> = ({ 
  isOpen, 
  onClose, 
  templateId, 
  onUpload 
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setUploadedFile(acceptedFiles[0]);
      }
    }
  });

  const handleUpload = () => {
    if (uploadedFile) {
      onUpload(templateId, uploadedFile);
      setUploadedFile(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Upload Checklist
          </h3>
          
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {uploadedFile ? (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(uploadedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isDragActive
                      ? 'Drop the Excel file here...'
                      : 'Drag and drop an Excel file here, or click to select'
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports .xlsx and .xls files
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                Excel File Format Requirements:
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                <li>• Column A: Category</li>
                <li>• Column B: Element</li>
                <li>• Column C: Question</li>
                <li>• Column D: Clause (optional)</li>
                <li>• Column E: Legal Standard (optional)</li>
                <li>• Column F: Weight (optional, default: 1)</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={!uploadedFile}
                icon={Upload}
              >
                Upload Checklist
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuditTemplates: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { templates, isLoading } = useAppSelector((state) => state.auditTemplate);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchAuditTemplates(user.companyId));
    }
  }, [dispatch, user?.companyId]);

  const handleCreateTemplate = async (templateData: any) => {
    if (!user?.companyId) return;
    
    try {
      await dispatch(createAuditTemplate({
        companyId: user.companyId,
        templateData
      })).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'Template created successfully'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to create template'
      }));
    }
  };

  const handleUploadChecklist = async (templateId: string, file: File) => {
    if (!user?.companyId) return;
    
    try {
      await dispatch(uploadChecklistTemplate({
        companyId: user.companyId,
        templateId,
        file
      })).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'Checklist uploaded successfully'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to upload checklist'
      }));
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.standard.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterType || template.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTemplateIcon = (standard: string) => {
    if (standard.includes('ISO 45001')) return '🛡️';
    if (standard.includes('Fire')) return '🔥';
    if (standard.includes('Electrical')) return '⚡';
    if (standard.includes('BIS')) return '📋';
    if (standard.includes('PSM')) return '🏭';
    if (standard.includes('AI')) return '🤖';
    return '📄';
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Audit Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage default and custom audit templates for your organization
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            icon={Download}
            onClick={() => {
              // Handle template export
              
            }}
          >
            Export Templates
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowNewTemplateModal(true)}
          >
            New Template
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Templates</option>
              <option value="default">Default Templates</option>
              <option value="custom">Custom Templates</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <motion.div
            key={template._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6 h-full hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {getTemplateIcon(template.standard)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {template.standard}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {template.type === 'default' && (
                    <Star className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    template.type === 'default'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {template.type.toUpperCase()}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {template.description || 'No description available'}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Categories:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {template.categories?.length || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Questions:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {template.checklist?.length || 0}
                  </span>
                </div>

                {template.metadata?.estimatedDuration && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {template.metadata.estimatedDuration} min
                    </span>
                  </div>
                )}

                {template.metadata?.industry && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Industry:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {template.metadata.industry}
                    </span>
                  </div>
                )}
              </div>

              {/* Template Categories */}
              {template.categories && template.categories.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {template.categories.slice(0, 3).map((category: any, index: number) => (
                      <span
                        key={index}
                        className="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                      >
                        {category.name || category}
                      </span>
                    ))}
                    {template.categories.length > 3 && (
                      <span className="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                        +{template.categories.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 mt-auto">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  icon={CheckSquare}
                  onClick={() => navigate(`/audit/audits/new?template=${template._id}`)}
                >
                  Use Template
                </Button>

                {template.type === 'custom' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Upload}
                    onClick={() => {
                      setSelectedTemplateId(template._id);
                      setShowUploadModal(true);
                    }}
                  >
                    Upload
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  icon={Eye}
                  onClick={() => navigate(`/audit/templates/${template._id}`)}
                />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || filterType
              ? 'No templates match your search criteria. Try adjusting your filters.'
              : 'Get started by creating your first custom template or using one of the default templates.'
            }
          </p>
          {!searchTerm && !filterType && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowNewTemplateModal(true)}
            >
              Create First Template
            </Button>
          )}
        </Card>
      )}

      {/* Modals */}
      <NewTemplateModal
        isOpen={showNewTemplateModal}
        onClose={() => setShowNewTemplateModal(false)}
        onSubmit={handleCreateTemplate}
      />

      <UploadChecklistModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        templateId={selectedTemplateId}
        onUpload={handleUploadChecklist}
      />
    </div>
  );
};

export default AuditTemplates;