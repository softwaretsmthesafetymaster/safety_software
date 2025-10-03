import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Upload,
  Download,
  CheckSquare
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Template {
  _id: string;
  name: string;
  code: string;
  standard: string;
  description: string;
  isDefault: boolean;
  categories: any[];
  createdBy: any;
  createdAt: string;
}

const TemplateList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [standardFilter, setStandardFilter] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    name: '',
    standard: 'custom',
    description: ''
  });

  useEffect(() => {
    if (user?.companyId) {
      fetchTemplates();
      initializeDefaultTemplates();
    }
  }, [user?.companyId]);

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
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadData.name) {
      dispatch(addNotification({
        type: 'error',
        message: 'Please provide template name and select a file'
      }));
      return;
    }

    try {
      const formData = new FormData();
      formData.append('template', uploadFile);
      formData.append('name', uploadData.name);
      formData.append('standard', uploadData.standard);
      formData.append('description', uploadData.description);

      const response = await fetch(`${API_URL}/templates/${user?.companyId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (response.ok) {
        dispatch(addNotification({
          type: 'success',
          message: 'Template uploaded successfully'
        }));
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadData({ name: '', standard: 'custom', description: '' });
        fetchTemplates();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to upload template'
      }));
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`${API_URL}/templates/${user?.companyId}/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        dispatch(addNotification({
          type: 'success',
          message: 'Template deleted successfully'
        }));
        fetchTemplates();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to delete template'
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

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStandard = !standardFilter || template.standard === standardFilter;
    return matchesSearch && matchesStandard;
  });

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Audit Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage checklist templates for different audit types
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            icon={Upload}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload Excel
          </Button>
          <Button
            as={Link}
            to="/audit/templates/new"
            variant="primary"
            icon={Plus}
          >
            New Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Templates
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Search templates..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Standard
            </label>
            <select
              value={standardFilter}
              onChange={(e) => setStandardFilter(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Standards</option>
              {standards.map((standard) => (
                <option key={standard.value} value={standard.value}>
                  {standard.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setStandardFilter('');
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getTemplateIcon(template.standard)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {template.standard}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                  template.isDefault 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {template.isDefault ? 'Default' : 'Custom'}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {template.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span>{template.categories?.length || 0} categories</span>
                <span>
                  {template.categories?.reduce((total, cat) => total + (cat.questions?.length || 0), 0) || 0} questions
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    as={Link}
                    to={`/audit/templates/${template._id}`}
                    variant="secondary"
                    size="sm"
                    icon={Eye}
                  >
                    View
                  </Button>
                  {!template.isDefault && (
                    <Button
                      as={Link}
                      to={`/audit/templates/${template._id}/edit`}
                      variant="secondary"
                      size="sm"
                      icon={Edit}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                {!template.isDefault && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDelete(template._id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="p-12 text-center">
          <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || standardFilter
              ? 'No templates match your current filters.'
              : 'Get started by creating your first template.'}
          </p>
          <Button
            as={Link}
            to="/audit/templates/new"
            variant="primary"
            icon={Plus}
          >
            Create Template
          </Button>
        </Card>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Excel Template"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={uploadData.name}
              onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Enter template name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Standard
            </label>
            <select
              value={uploadData.standard}
              onChange={(e) => setUploadData({ ...uploadData, standard: e.target.value })}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              {standards.map((standard) => (
                <option key={standard.value} value={standard.value}>
                  {standard.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={uploadData.description}
              onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Template description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Excel File *
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Excel file should have columns: Category, Question, Clause, Element, Legal Standard
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={Upload}
              onClick={handleUpload}
            >
              Upload Template
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TemplateList;