import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Building,
  Shield,
  Bell,
  Lock,
  Save,
  Upload,
  Eye,
  EyeOff,
  Camera
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchUserProfile } from '../../store/slices/authSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { useForm } from 'react-hook-form';
import { addNotification } from '../../store/slices/uiSlice';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    theme: string;
    language: string;
  };
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfileSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { register: registerProfile, handleSubmit: handleProfileSubmit, reset: resetProfile, formState: { errors: profileErrors } } = useForm<ProfileFormData>();
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, watch, formState: { errors: passwordErrors } } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword');

  useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          theme: 'light',
          language: 'en'
        }
      });
      setAvatarPreview(user.avatar || '');
    }
  }, [user, resetProfile]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setProfileLoading(true);
    try {
      const response = await axios.patch(`${API_URL}/auth/profile`, {
        ...data,
        avatar: avatarPreview
      });
      
      dispatch(addNotification({
        type: 'success',
        message: 'Profile updated successfully'
      }));
      
      // Refresh user profile
      dispatch(fetchUserProfile());
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update profile'
      }));
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPasswordLoading(true);
    try {
      const response = await axios.patch(`${API_URL}/auth/change-password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      dispatch(addNotification({
        type: 'success',
        message: 'Password updated successfully'
      }));
      resetPassword();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update password'
      }));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('files', file);
      
      try {
        
        const response = await axios.post(`${API_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        const avatarUrl = response.data.urls[0];
        setAvatarPreview(avatarUrl);
        
        dispatch(addNotification({
          type: 'success',
          message: 'Avatar uploaded successfully'
        }));
      } catch (error) {
        dispatch(addNotification({
          type: 'error',
          message: 'Failed to upload avatar'
        }));
      }
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Profile & Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg">
                    <span className="text-white font-semibold text-xl">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </label>
              </div>
              <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">
                {user?.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user?.role?.replace('_', ' ').toUpperCase()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {user?.company?.name}
              </p>
            </div>

            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Profile Information
                </h2>

                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Full Name
                      </label>
                      <div className="mt-1 relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          {...registerProfile('name', { required: 'Name is required' })}
                          type="text"
                          className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      {profileErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address
                      </label>
                      <div className="mt-1 relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          {...registerProfile('email', { 
                            required: 'Email is required',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Invalid email address'
                            }
                          })}
                          type="email"
                          className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      {profileErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number
                    </label>
                    <div className="mt-1 relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        {...registerProfile('phone')}
                        type="tel"
                        className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Theme Preference
                      </label>
                      <select
                        {...registerProfile('preferences.theme')}
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Language
                      </label>
                      <select
                        {...registerProfile('preferences.language')}
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Save}
                      loading={profileLoading}
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>

                {/* Account Information */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Account Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">User ID:</span>
                        <span className="text-sm text-gray-900 dark:text-white font-mono">
                          {user?.id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Role:</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {user?.role?.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Company:</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {user?.company?.name || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Account created:</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Last login:</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user?.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {user?.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Security Settings
                </h2>

                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Password
                    </label>
                    <div className="mt-1 relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        {...registerPassword('currentPassword', { required: 'Current password is required' })}
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="pl-10 pr-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      New Password
                    </label>
                    <div className="mt-1 relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        {...registerPassword('newPassword', { 
                          required: 'New password is required',
                          minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters'
                          }
                        })}
                        type={showNewPassword ? 'text' : 'password'}
                        className="pl-10 pr-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirm New Password
                    </label>
                    <div className="mt-1 relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        {...registerPassword('confirmPassword', { 
                          required: 'Please confirm your password',
                          validate: value => value === newPassword || 'Passwords do not match'
                        })}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="pl-10 pr-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Save}
                      loading={passwordLoading}
                    >
                      Update Password
                    </Button>
                  </div>
                </form>

                {/* Security Information */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Security Information
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900 dark:text-green-200">
                            Account Security Status: Good
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            Your account is secure with strong password and active session monitoring.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                          Login Sessions
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Current session: Active
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <h4 className="font-medium text-purple-900 dark:text-purple-200 mb-2">
                          Permissions
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          Role: {user?.role?.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-400">
                          {user?.permissions?.length || 0} permissions assigned
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Notification Preferences
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Email Notifications
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: 'permits', label: 'Permit updates and approvals', description: 'Get notified when permits require your action' },
                        { key: 'incidents', label: 'Incident reports and investigations', description: 'Critical safety incident notifications' },
                        { key: 'audits', label: 'Audit schedules and findings', description: 'Audit-related updates and reminders' },
                        { key: 'reminders', label: 'Task reminders and deadlines', description: 'Upcoming deadlines and overdue tasks' },
                        { key: 'system', label: 'System updates and maintenance', description: 'Platform updates and scheduled maintenance' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <input
                            {...registerProfile(`preferences.notifications.email`)}
                            type="checkbox"
                            defaultChecked
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {item.label}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {item.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Push Notifications
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: 'urgent', label: 'Urgent safety alerts', description: 'Critical safety issues requiring immediate attention' },
                        { key: 'assignments', label: 'Task assignments', description: 'When tasks are assigned to you' },
                        { key: 'approvals', label: 'Approval requests', description: 'When your approval is required' },
                        { key: 'mentions', label: 'When mentioned in comments', description: 'Direct mentions in discussions' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <input
                            {...registerProfile(`preferences.notifications.push`)}
                            type="checkbox"
                            defaultChecked
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {item.label}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {item.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Notification Frequency
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <input
                          type="radio"
                          name="frequency"
                          value="immediate"
                          defaultChecked
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Immediate
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Get notified right away for all events
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <input
                          type="radio"
                          name="frequency"
                          value="daily"
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Daily digest
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Receive a summary once per day
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <input
                          type="radio"
                          name="frequency"
                          value="weekly"
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Weekly summary
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Receive a summary once per week
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Save}
                      loading={passwordLoading}
                    >
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;