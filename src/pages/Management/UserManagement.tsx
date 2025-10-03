import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  UserX,
  UserCheck,
  Mail,
  Phone,
  Building,
  Shield
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import {
  fetchUsers,
  createUser,
  updateUser,
  deactivateUser,
  activateUser
} from '../../store/slices/userSlice';
import { fetchPlantUsers } from '../../store/slices/userSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { addNotification } from '../../store/slices/uiSlice';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
  plantId?: {
    _id: string;
    name: string;
    code: string;
  };
  phone?: string;
}

const UserManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { users, plantUsers, isLoading } = useAppSelector((state) => state.user);
  
  const [filter,setFilter] = useState(plantUsers)
  const { plants } = useAppSelector((state) => state.plant);
  const { currentCompany } = useAppSelector((state) => state.company);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<UserFormData>();

  useEffect(() => {
    if (user?.role === 'company_owner') {
      setFilter(users);
    }
    if (user?.role === 'plant_head') {
      setFilter(plantUsers);
    }
  }, [user, user?.role, users, plantUsers]);
   
  useEffect(() => {
    if (user?.companyId && user?.role === "plant_head" && user?.plantId?._id) {
      dispatch(
        fetchPlantUsers({ companyId: user.companyId, plantId: user.plantId._id })
      );
    }
  }, [dispatch, user, user?.companyId] );
 
  // Get available roles from company config
  const getAvailableRoles = () => {
    const moduleConfigs = currentCompany?.config?.modules || {};
    const allRoles = new Set<string>();

    Object.entries(moduleConfigs).forEach(
      ([, moduleConfig]: [string, any]) => {
        if (moduleConfig?.enabled && moduleConfig?.roles) {
          moduleConfig.roles.forEach((role: string) => allRoles.add(role));
        }
      }
    );

    if (allRoles.size === 0) {
      [
        'user',
        'worker',
        'contractor',
        'hod',
        'safety',
        'admin',
        'manager',
        'plant_head'
      ].forEach((role) => allRoles.add(role));
    }

    return Array.from(allRoles);
  };

  let availableRoles = getAvailableRoles();

  // Restrict roles based on logged-in user's role
  if (user?.role === 'plant_head') {
    availableRoles = availableRoles.filter(
      (role) => role !== 'plant_head' && role !== 'company_owner'
    );
  } else if (user?.role === 'company_owner') {
    // Company owner keeps all roles
  }

  const roleLabels: Record<string, string> = {
    user: 'User',
    worker: 'Worker',
    contractor: 'Contractor',
    hod: 'Head of Department',
    safety: 'Safety Officer',
    admin: 'Administrator',
    manager: 'Manager',
    plant_head: 'Plant Head',
    facilitator: 'HAZOP Facilitator',
    chairman: 'HAZOP Chairman',
    scribe: 'HAZOP Scribe',
    auditor: 'Auditor',
    assessor: 'Risk Assessor',
    observer: 'BBS Observer'
  };

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchUsers({ companyId: user.companyId }));
    }
  }, [dispatch, user?.companyId]);

  const onSubmit = async (data: UserFormData) => {
    if (!user?.companyId) return;

    // If logged-in user is plant_head, enforce their plantId
    if (user?.role === 'plant_head' && user.plantId) {
      data.plantId = user.plantId;
    }

    try {
      if (editingUser) {
        await dispatch(
          updateUser({
            companyId: user.companyId,
            id: editingUser._id,
            data
          })
        ).unwrap();
        dispatch(
          addNotification({
            type: 'success',
            message: 'User updated successfully'
          })
        );
      } else {
        await dispatch(
          createUser({
            companyId: user.companyId,
            userData: data
          })
        ).unwrap();
        dispatch(
          addNotification({
            type: 'success',
            message: 'User created successfully'
          })
        );
      }

      setShowForm(false);
      setEditingUser(null);
      reset();
      fetchPlantUsers({companyId:user.companyId,plantId:user.plantId})
    } catch (error: any) {
      dispatch(
        addNotification({
          type: 'error',
          message: error.message || 'Failed to save user'
        })
      );
    }
  };

  const handleEdit = (userToEdit: any) => {
    setEditingUser(userToEdit);
    reset({
      ...userToEdit,
      password: ''
    });
    setShowForm(true);
  };

  const handleDeactivate = async (userId: string) => {
    if (
      !user?.companyId ||
      !confirm('Are you sure you want to deactivate this user?')
    )
      return;

    try {
      await dispatch(
        deactivateUser({ companyId: user.companyId, id: userId })
      ).unwrap();
      dispatch(
        addNotification({
          type: 'success',
          message: 'User deactivated successfully'
        })
      );
    } catch (error: any) {
      dispatch(
        addNotification({
          type: 'error',
          message: error.message || 'Failed to deactivate user'
        })
      );
    }
  };

  const handleActivate = async (userId: string) => {
    if (!user?.companyId) return;

    try {
      await dispatch(
        activateUser({ companyId: user.companyId, id: userId })
      ).unwrap();
      dispatch(
        addNotification({
          type: 'success',
          message: 'User activated successfully'
        })
      );
    } catch (error: any) {
      dispatch(
        addNotification({
          type: 'error',
          message: error.message || 'Failed to activate user'
        })
      );
    }
  };
  

  const filteredUsers = filter.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (isLoading && filter.length === 0) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users and their roles based on company configuration
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setEditingUser(null);
            reset();
            setShowForm(true);
          }}
        >
          Add User
        </Button>
      </div>

      {/* Available Roles */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-200">
              Available Roles ({availableRoles.length})
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Roles are configured based on enabled modules:{' '}
              {availableRoles
                .map((role) => roleLabels[role] || role)
                .join(', ')}
            </p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Roles</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role] || role}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* User Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center  justify-center z-50"
          style={{
            marginTop: "0"
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[90vw] lg:w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            {!editingUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password *
                </label>
                <input
                  {...register('password', {
                    required: !editingUser ? 'Password is required' : false,
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  type="password"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role *
                </label>
                <select
                  {...register('role', { required: 'Role is required' })}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select Role</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role] || role}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {/* Plant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plant
                </label>
                {user?.role === 'plant_head' ? (
                  <input
                    type="text"
                    value={
                      plants.find((p) => p._id === user.plantId?._id)?.name ||
                      'Assigned Plant'
                    }
                    disabled
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 text-sm shadow-sm cursor-not-allowed"
                  />
                ) : (
                  <select
                    {...register('plantId')}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Plant</option>
                    {plants.map((plant) => (
                      <option key={plant._id} value={plant._id}>
                        {plant.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isLoading}>
                {editingUser ? 'Update' : 'Create'} User
              </Button>
            </div>
          </form>

          </motion.div>
        </motion.div>
      )}

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((userItem, index) => (
          <motion.div
            key={userItem._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      userItem.isActive
                        ? 'bg-green-100 dark:bg-green-900/20'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <Shield
                      className={`h-6 w-6 ${
                        userItem.isActive
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {userItem.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {roleLabels[userItem.role] || userItem.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Edit}
                    onClick={() => handleEdit(userItem)}
                  />
                  {userItem.isActive ? (
                    <Button
                      size="sm"
                      variant="danger"
                      icon={UserX}
                      onClick={() => handleDeactivate(userItem._id)}
                    />
                  ) : (
                    <Button
                      size="sm"
                      variant="success"
                      icon={UserCheck}
                      onClick={() => handleActivate(userItem._id)}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {userItem.email}
                  </p>
                </div>

                {userItem.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {userItem.phone}
                    </p>
                  </div>
                )}

                {userItem.plantId && (
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {userItem.plantId.name}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    userItem.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}
                >
                  {userItem.isActive ? 'Active' : 'Inactive'}
                </div>
                {userItem.lastLogin && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last login:{' '}
                    {new Date(userItem.lastLogin).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Shield className="mx-auto h-24 w-24 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No users found
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {searchTerm || roleFilter
              ? 'Try adjusting your search or filters.'
              : 'Get started by adding your first user.'}
          </p>
          {!searchTerm && !roleFilter && (
            <div className="mt-6">
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingUser(null);
                  reset();
                  setShowForm(true);
                }}
              >
                Add User
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default UserManagement;
