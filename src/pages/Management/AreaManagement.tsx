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
  Building,
  User,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import {
  getArea,
  addArea,
  updateArea,
  deleteArea,
} from '../../store/slices/plantSlice';
import { fetchPlantUsers } from '../../store/slices/userSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { addNotification } from '../../store/slices/uiSlice';

// 1. Update the interface to include new fields
interface AreaFormData {
  name: string;
  code: string;
  description: string;
  hod: string;
  safetyIncharge: string;
}

const AreaManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { areas, isLoading } = useAppSelector((state) => state.plant);
  const { plantUsers } = useAppSelector((state) => state.user);

  const [plantId] = useState(user?.plantId?._id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AreaFormData>();

  useEffect(() => {
    if (user?.companyId && plantId) {
      dispatch(getArea({ companyId: user.companyId, plantId }));
      dispatch(fetchPlantUsers({ companyId: user.companyId, plantId }));
    }
  }, [dispatch, user, plantId]);

  const onSubmit = async (data: AreaFormData) => {
    if (!user?.companyId || !plantId) return;

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (area: any) => {
    setEditingArea(area);
    reset({
      ...area,
      hod: area.hod?._id || '',
      safetyIncharge: area.safetyIncharge?._id || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (areaId: string) => {
    if (!user?.companyId || !plantId || !window.confirm('Are you sure you want to delete this area?')) {
      return;
    }

    setDeletingId(areaId);
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
    } finally {
      setDeletingId(null);
    }
  };

  const filteredAreas = areas.filter(area =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Area Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage plant areas
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
                  Area HOD
                </label>
                <select
                  {...register('hod')}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select Area HOD</option>
                  {plantUsers?.map(user => (
                    <option key={user._id} value={user._id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Safety Incharge
                </label>
                <select
                  {...register('safetyIncharge')}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select Safety Incharge</option>
                  {plantUsers?.map(user => (
                    <option key={user._id} value={user._id}>{user.name}</option>
                  ))}
                </select>
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
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
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
                    disabled={deletingId === area._id}
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    icon={Trash2}
                    onClick={() => handleDelete(area._id)}
                    loading={deletingId === area._id}
                    disabled={deletingId === area._id}
                  />
                </div>
              </div>

              <div className="mb-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {area.description && <p>{area.description}</p>}
                {area.hod && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>HOD: <strong>{area.hod.name}</strong></span>
                  </div>
                )}
                {area.safetyIncharge && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Safety Incharge: <strong>{area.safetyIncharge.name}</strong></span>
                  </div>
                )}
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