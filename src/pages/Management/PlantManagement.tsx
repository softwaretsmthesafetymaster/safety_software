import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Building,
  Users,
  Settings
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchPlants, createPlant, updatePlant, deletePlant } from '../../store/slices/plantSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
interface PlantFormData {
  name: string;
  code: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  areas: Array<{
    name: string;
    code: string;
    description: string;
    hazardLevel: string;
  }>;
}

const PlantManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { plants, isLoading } = useAppSelector((state) => state.plant);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState<any>(null);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<any>(null);

  const navigate = useNavigate();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PlantFormData>();

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchPlants({ companyId: user.companyId }));
    }
  }, [dispatch, user?.companyId]);

  const onSubmit = async (data: PlantFormData) => {
    if (!user?.companyId) return;

    try {
      if (editingPlant) {
        await dispatch(updatePlant({
          companyId: user.companyId,
          id: editingPlant._id,
          data
        })).unwrap();
      } else {
        await dispatch(createPlant({
          companyId: user.companyId,
          plantData: data
        })).unwrap();
      }
      
      setShowForm(false);
      setEditingPlant(null);
      reset();
    } catch (error) {
      console.error('Error saving plant:', error);
    }
  };

  const handleEdit = (plant: any) => {
    setEditingPlant(plant);
    reset(plant);
    setShowForm(true);
  };

  const handleDelete = async (plantId: string) => {
    if (!user?.companyId || !confirm('Are you sure you want to delete this plant?')) return;
    
    try {
      await dispatch(deletePlant({ companyId: user.companyId, id: plantId })).unwrap();
    } catch (error) {
      console.error('Error deleting plant:', error);
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
            Manage plants and their areas
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setEditingPlant(null);
            reset();
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingPlant ? 'Edit Plant' : 'Add New Plant'}
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Plant Name *
                  </label>
                  <input
                    {...register('name', { required: 'Plant name is required' })}
                    type="text"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Plant Code *
                  </label>
                  <input
                    {...register('code', { required: 'Plant code is required' })}
                    type="text"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Address
                </label>
                <textarea
                  {...register('location.address')}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Latitude
                  </label>
                  <input
                    {...register('location.coordinates.lat', { valueAsNumber: true })}
                    type="number"
                    step="any"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Longitude
                  </label>
                  <input
                    {...register('location.coordinates.lng', { valueAsNumber: true })}
                    type="number"
                    step="any"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPlant(null);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
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
            <Card hover className="p-6">
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
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    icon={Trash2}
                    onClick={() => handleDelete(plant._id)}
                  />
                </div>
              </div>

              {plant.location?.address && (
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {plant.location.address}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {plant.areas?.length || 0} Areas
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
                  onClick={() => {
                    setSelectedPlant(plant);
                    navigate(`/management/areas`);
                  }}
                >
                  Manage Areas
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
                  reset();
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