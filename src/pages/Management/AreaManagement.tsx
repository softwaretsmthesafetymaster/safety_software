import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, CreditCard as Edit, Trash2, MapPin, AlertTriangle, Building, User } from 'lucide-react';
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

interface AreaFormData {
  name: string;
  code: string;
  description: string;
  personnel: {
    hod: string;
    safetyIncharge: string;
    supervisor: string;
  };
  riskProfile: {
    level: 'low' | 'medium' | 'high' | 'critical';
  };
  capacity: {
    maxPersonnel: number;
  };
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
      personnel: {
        hod: area.personnel?.hod?._id || '',
        safetyIncharge: area.personnel?.safetyIncharge?._id || '',
        supervisor: area.personnel?.supervisor?._id || '',
      }
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

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Area Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage plant areas and personnel assignments
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {editingArea ? 'Edit Area' : 'Add New Area'}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Area Name *
                  </label>
                  <input
                    {...register('name', { required: 'Area name is required' })}
                    type="text"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter area name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Area Code *
                  </label>
                  <input
                    {...register('code', { required: 'Area code is required' })}
                    type="text"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter area code"
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
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
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter area description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Risk Level
                  </label>
                  <select
                    {...register('riskProfile.level')}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Personnel
                  </label>
                  <input
                    {...register('capacity.maxPersonnel', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter max personnel"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Area HOD
                  </label>
                  <select
                    {...register('personnel.hod')}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select HOD</option>
                    {plantUsers?.map(user => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Safety Incharge
                  </label>
                  <select
                    {...register('personnel.safetyIncharge')}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Safety Incharge</option>
                    {plantUsers?.map(user => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supervisor
                  </label>
                  <select
                    {...register('personnel.supervisor')}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Supervisor</option>
                    {plantUsers?.map(user => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
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
            <Card hover className="p-6 h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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

              {area.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {area.description}
                </p>
              )}

              <div className="space-y-3 mb-4">
                {area.personnel?.hod && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      HOD: <strong>{area.personnel.hod.name}</strong>
                    </span>
                  </div>
                )}

                {area.personnel?.safetyIncharge && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Safety: <strong>{area.personnel.safetyIncharge.name}</strong>
                    </span>
                  </div>
                )}

                {area.personnel?.supervisor && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Supervisor: <strong>{area.personnel.supervisor.name}</strong>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  getRiskColor(area.riskProfile?.level || 'medium')
                }`}>
                  {area.riskProfile?.level?.toUpperCase() || 'MEDIUM'} Risk
                </div>
                
                {area.capacity?.maxPersonnel && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Max: {area.capacity.maxPersonnel} people
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