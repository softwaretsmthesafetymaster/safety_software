import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  AlertTriangle,
  Building
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchPlantById, addArea, updateArea, deleteArea } from '../../store/slices/plantSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { addNotification } from '../../store/slices/uiSlice';

interface AreaFormData {
  name: string;
  code: string;
  description: string;
  hazardLevel: string;
}

const AreaManagement: React.FC = () => {
  const { plantId } = useParams();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentPlant, isLoading } = useAppSelector((state) => state.plant);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AreaFormData>();

  useEffect(() => {
    if (plantId && user?.companyId) {
      dispatch(fetchPlantById({ companyId: user.companyId, id: plantId }));
    }
  }, [dispatch, plantId, user?.companyId]);

  const onSubmit = async (data: AreaFormData) => {
    if (!user?.companyId || !plantId) return;

    try {
      if (editingArea) {
        await dispatch(updateArea({
          companyId: user.companyId,
          plantId,
          areaId: editingArea._id,
          data
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Area updated successfully'
        }));
      } else {
        await dispatch(addArea({
          companyId: user.companyId,
          plantId,
          areaData: data
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Area created successfully'
        }));
      }
      
      setShowForm(false);
      setEditingArea(null);
      reset();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to save area'
      }));
    }
  };

  const handleEdit = (area: any) => {
    setEditingArea(area);
    reset(area);
    setShowForm(true);
  };

  const handleDelete = async (areaId: string) => {
    if (!user?.companyId || !plantId || !confirm('Are you sure you want to delete this area?')) return;
    
    try {
      await dispatch(deleteArea({ 
        companyId: user.companyId, 
        plantId, 
        areaId 
      })).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'Area deleted successfully'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to delete area'
      }));
    }
  };

  const filteredAreas = currentPlant?.areas?.filter(area =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const hazardLevels = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
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
            Area Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentPlant?.name} - Manage plant areas and hazard levels
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setEditingArea(null);
            reset();
            setShowForm(true);
          }}
        >
          Add Area
        </Button>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search areas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </Card>

      {/* Area Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingArea ? 'Edit Area' : 'Add New Area'}
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Area Name *
                </label>
                <input
                  {...register('name', { required: 'Area name is required' })}
                  type="text"
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Area Code *
                </label>
                <input
                  {...register('code', { required: 'Area code is required' })}
                  type="text"
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hazard Level *
                </label>
                <select
                  {...register('hazardLevel', { required: 'Hazard level is required' })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select Hazard Level</option>
                  {hazardLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
                {errors.hazardLevel && (
                  <p className="mt-1 text-sm text-red-600">{errors.hazardLevel.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingArea(null);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingArea ? 'Update' : 'Create'} Area
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAreas.map((area, index) => (
          <motion.div
            key={area._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    area.hazardLevel === 'critical' ? 'bg-red-100 dark:bg-red-900/20' :
                    area.hazardLevel === 'high' ? 'bg-orange-100 dark:bg-orange-900/20' :
                    area.hazardLevel === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                    'bg-green-100 dark:bg-green-900/20'
                  }`}>
                    <MapPin className={`h-6 w-6 ${
                      area.hazardLevel === 'critical' ? 'text-red-600 dark:text-red-400' :
                      area.hazardLevel === 'high' ? 'text-orange-600 dark:text-orange-400' :
                      area.hazardLevel === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {area.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Code: {area.code}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Edit}
                    onClick={() => handleEdit(area)}
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    icon={Trash2}
                    onClick={() => handleDelete(area._id)}
                  />
                </div>
              </div>

              {area.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {area.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  hazardLevels.find(h => h.value === area.hazardLevel)?.color || 'bg-gray-100 text-gray-800'
                }`}>
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {hazardLevels.find(h => h.value === area.hazardLevel)?.label || area.hazardLevel}
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredAreas.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <MapPin className="mx-auto h-24 w-24 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No areas found
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first area.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingArea(null);
                  reset();
                  setShowForm(true);
                }}
              >
                Add Area
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AreaManagement;