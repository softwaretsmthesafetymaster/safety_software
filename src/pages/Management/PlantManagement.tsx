import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, CreditCard as Edit, Trash2, MapPin, Building, Users, Settings, Phone, Mail } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchPlants, createPlant, updatePlant, deletePlant } from '../../store/slices/plantSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { addNotification } from '../../store/slices/uiSlice';
import toast from 'react-hot-toast';

interface PlantFormData {
  name: string;
  code: string;
  location: {
    address: string;
    coordinates: {
      lat?: number;
      lng?: number;
    };
  };
  contact: {
    phone?: string;
    email?: string;
  };
  capacity: {
    maxEmployees?: number;
  };
}

const PlantManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { plants, isLoading } = useAppSelector((state) => state.plant);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PlantFormData>();

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchPlants({ companyId: user.companyId }));
    }
  }, [dispatch, user?.companyId]);

  const onSubmit = async (data: PlantFormData) => {
    if (!user?.companyId) return;

    setIsSubmitting(true);
    try {
      if (editingPlant) {
        await dispatch(updatePlant({
          companyId: user.companyId,
          id: editingPlant._id,
          data
        })).unwrap();
        toast.success('Plant updated successfully')
      } else {
        await dispatch(createPlant({
          companyId: user.companyId,
          plantData: data
        })).unwrap();
        toast.success('Plant created successfully')
      }
      
      setShowForm(false);
      setEditingPlant(null);
      reset();
    } catch (error: any) {
      toast.error(error|| 'Something went wrong')
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (plant: any) => {
    setEditingPlant(plant);
    reset(plant);
    setShowForm(true);
  };

  const handleDelete = async (plantId: string) => {
    if (!user?.companyId || !window.confirm('Are you sure you want to delete this plant?')) return;
    
    setDeletingId(plantId);
    try {
      await dispatch(deletePlant({ companyId: user.companyId, id: plantId })).unwrap();
      toast.success('Plant deleted')
    } catch (error: any) {
      toast.error('Failed to delete Plant')
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPlants = plants.filter(plant =>
    plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plant.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && plants.length === 0) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Plant Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage plants and their configurations
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setEditingPlant(null);
            reset({});
            setShowForm(true);
          }}
        >
          Add Plant
        </Button>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search plants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </Card>

      {/* Plant Form Modal */}
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
              {editingPlant ? 'Edit Plant' : 'Add New Plant'}
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Plant Name *
                  </label>
                  <input
                    {...register('name', { required: 'Plant name is required' })}
                    type="text"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter plant name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Plant Code *
                  </label>
                  <input
                    {...register('code', { required: 'Plant code is required' })}
                    type="text"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter plant code"
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  {...register('location.address')}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter plant address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Phone
                  </label>
                  <input
                    {...register('contact.phone')}
                    type="tel"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter contact phone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Email
                  </label>
                  <input
                    {...register('contact.email')}
                    type="email"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter contact email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Latitude
                  </label>
                  <input
                    {...register('location.coordinates.lat', { valueAsNumber: true })}
                    type="number"
                    step="any"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter latitude"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Longitude
                  </label>
                  <input
                    {...register('location.coordinates.lng', { valueAsNumber: true })}
                    type="number"
                    step="any"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter longitude"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Employees
                </label>
                <input
                  {...register('capacity.maxEmployees', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter maximum employees"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPlant(null);
                    reset({});
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
                  {editingPlant ? 'Update' : 'Create'} Plant
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Plants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlants.map((plant, index) => (
          <motion.div
            key={plant._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="p-6 h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {plant.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Code: {plant.code}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Edit}
                    onClick={() => handleEdit(plant)}
                    disabled={deletingId === plant._id}
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    icon={Trash2}
                    onClick={() => handleDelete(plant._id)}
                    loading={deletingId === plant._id}
                    disabled={deletingId === plant._id}
                  />
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {plant.location?.address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {plant.location.address}
                    </p>
                  </div>
                )}

                {plant.contact?.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {plant.contact.phone}
                    </p>
                  </div>
                )}

                {plant.contact?.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {plant.contact.email}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {plant.areaCount || 0} Areas
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    plant.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {plant.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Settings}
                  onClick={() => navigate('/management/areas')}
                >
                  Areas
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredPlants.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Building className="mx-auto h-24 w-24 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No plants found
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first plant.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingPlant(null);
                  reset({});
                  setShowForm(true);
                }}
              >
                Add Plant
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default PlantManagement;