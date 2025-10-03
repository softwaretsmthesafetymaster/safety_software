import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Play,
  Clock,
  Users,
  Star,
  Search,
  Filter,
  BookOpen,
  Video,
  CheckCircle,
  Calendar,
  Upload,
  Edit,
  Trash2,
  Eye,
  UserPlus
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { 
  fetchVideoLibrary, 
  createVideo, 
  updateVideo, 
  deleteVideo,
  assignVideoToUser,
  fetchAssignedVideos,
  updateVideoProgress
} from '../../store/slices/bbsSlice';
import { addNotification } from '../../store/slices/uiSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { usePermissions } from '../../hooks/usePermission';
import { format } from 'date-fns';

interface VideoFormData {
  title: string;
  description: string;
  youtubeUrl: string;
  duration: string;
  category: string;
  tags: string[];
}

const BBSCoaching: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { videoLibrary, assignedVideos, isLoading } = useAppSelector((state) => state.bbs);
  
  const { users } = useAppSelector((state) => state.user);
  
  const permissions = usePermissions();

  const [activeTab, setActiveTab] = useState<'library' | 'assigned' | 'create'>('library');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [videoForm, setVideoForm] = useState<VideoFormData>({
    title: '',
    description: '',
    youtubeUrl: '',
    duration: '',
    category: '',
    tags: []
  });
  const [assignForm, setAssignForm] = useState({
    userId: '',
    dueDate: ''
  });

  const categories = [
    'safety_procedures',
    'ppe_training', 
    'risk_assessment',
    'emergency_response',
    'behavioral_safety',
    'incident_investigation',
    'general_safety'
  ];

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchVideoLibrary(user.companyId));
      dispatch(fetchAssignedVideos({ companyId: user.companyId, userId: user._id }));
    }
  }, [dispatch, user]);

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;

    try {
      await dispatch(createVideo({
        companyId: user.companyId,
        data: videoForm
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Video added to library successfully'
      }));

      setShowCreateModal(false);
      resetVideoForm();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to create video'
      }));
    }
  };

  const handleUpdateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !editingVideo) return;

    try {
      await dispatch(updateVideo({
        companyId: user.companyId,
        videoId: editingVideo._id,
        data: videoForm
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Video updated successfully'
      }));

      setEditingVideo(null);
      resetVideoForm();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to update video'
      }));
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!user?.companyId || !confirm('Are you sure you want to delete this video?')) return;

    try {
      await dispatch(deleteVideo({
        companyId: user.companyId,
        videoId
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Video deleted successfully'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to delete video'
      }));
    }
  };

  const handleAssignVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !selectedVideo) return;

    try {
      await dispatch(assignVideoToUser({
        companyId: user.companyId,
        videoId: selectedVideo._id,
        userId: assignForm.userId,
        dueDate: assignForm.dueDate
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Video assigned successfully'
      }));

      setShowAssignModal(false);
      setAssignForm({ userId: '', dueDate: '' });
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to assign video'
      }));
    }
  };

  const handleVideoProgress = async (videoId: string, status: string, rating?: number) => {
    if (!user?.companyId) return;

    try {
      await dispatch(updateVideoProgress({
        companyId: user.companyId,
        videoId,
        progressData: { status, rating }
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: `Video marked as ${status}`
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to update progress'
      }));
    }
  };

  const resetVideoForm = () => {
    setVideoForm({
      title: '',
      description: '',
      youtubeUrl: '',
      duration: '',
      category: '',
      tags: []
    });
  };

  const startEdit = (video: any) => {
    setEditingVideo(video);
    setVideoForm({
      title: video.title,
      description: video.description,
      youtubeUrl: video.youtubeUrl,
      duration: video.duration,
      category: video.category,
      tags: video.tags || []
    });
  };

  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const filteredVideos = videoLibrary?.filter(video => {
    const matchesSearch = video?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || video?.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  const plantUsers = users.filter(u => u.companyId === user?.companyId);

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Safety Coaching
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Video library and training assignments
          </p>
        </div>
        {permissions.canManageContent() && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Add Video
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <Card className="p-6">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'library', label: 'Video Library', icon: Video },
            { key: 'assigned', label: 'My Assignments', icon: BookOpen }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Video Library Tab */}
      {activeTab === 'library' && (
        <>
          {/* Filters */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Search videos..."
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos?.map((video) => (
              <motion.div
                key={video._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Video className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {video.title}
                      </h3>
                      {permissions.canManageContent() && video.createdBy._id === user?._id && (
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => startEdit(video)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(video._id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {video.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {video.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Eye className="h-3 w-3" />
                        <span>{video.viewCount}</span>
                        {video.averageRating > 0 && (
                          <>
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span>{video.averageRating}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        icon={Play}
                        onClick={() => window.open(video.youtubeUrl, '_blank')}
                      >
                        Watch
                      </Button>
                      {permissions.canManageContent() && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={UserPlus}
                          onClick={() => {
                            setSelectedVideo(video);
                            setShowAssignModal(true);
                          }}
                        >
                          Assign
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredVideos?.length === 0 && (
            <Card className="p-12 text-center">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No videos found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || categoryFilter ? 'Try adjusting your filters' : 'Start by adding your first training video'}
              </p>
              {permissions.canManageContent() && (
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => setShowCreateModal(true)}
                >
                  Add Video
                </Button>
              )}
            </Card>
          )}
        </>
      )}

      {/* My Assignments Tab */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          {assignedVideos?.map((assignment) => (
            <Card key={assignment._id} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {assignment.videoId.thumbnailUrl ? (
                    <img
                      src={assignment.videoId.thumbnailUrl}
                      alt={assignment.videoId.title}
                      className="w-24 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <Video className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {assignment.videoId.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {assignment.videoId.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Duration: {assignment.videoId.duration}</span>
                        <span>Assigned by: {assignment.assignedBy.name}</span>
                        {assignment.dueDate && (
                          <span>Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</span>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      assignment.status === 'watched' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {assignment.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 mt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Play}
                      onClick={() => window.open(assignment.videoId.youtubeUrl, '_blank')}
                    >
                      Watch Video
                    </Button>
                    {assignment.status !== 'completed' && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleVideoProgress(assignment.videoId._id, 'watched')}
                        >
                          Mark Watched
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          icon={CheckCircle}
                          onClick={() => handleVideoProgress(assignment.videoId._id, 'completed', 5)}
                        >
                          Complete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {assignedVideos?.length === 0 && (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No assignments yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your assigned training videos will appear here
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Video Modal */}
      {(showCreateModal || editingVideo) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {editingVideo ? 'Edit Video' : 'Add New Video'}
              </h2>

              <form onSubmit={editingVideo ? handleUpdateVideo : handleCreateVideo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={videoForm.title}
                    onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    YouTube URL *
                  </label>
                  <input
                    type="url"
                    value={videoForm.youtubeUrl}
                    onChange={(e) => setVideoForm({ ...videoForm, youtubeUrl: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                  {videoForm.youtubeUrl && getYouTubeVideoId(videoForm.youtubeUrl) && (
                    <div className="mt-2">
                      <img
                        src={`https://img.youtube.com/vi/${getYouTubeVideoId(videoForm.youtubeUrl)}/maxresdefault.jpg`}
                        alt="Video thumbnail"
                        className="w-32 h-20 object-cover rounded"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration *
                    </label>
                    <input
                      type="text"
                      value={videoForm.duration}
                      onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 10:30"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={videoForm.category}
                      onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={videoForm.description}
                    onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={videoForm.tags.join(', ')}
                    onChange={(e) => setVideoForm({ 
                      ...videoForm, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="safety, training, procedures"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingVideo(null);
                      resetVideoForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                  >
                    {editingVideo ? 'Update' : 'Create'} Video
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Video Modal */}
      {showAssignModal && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Assign Video: {selectedVideo.title}
              </h2>

              <form onSubmit={handleAssignVideo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assign to User *
                  </label>
                  <select
                    value={assignForm.userId}
                    onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select User</option>
                    {plantUsers.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={assignForm.dueDate}
                    onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowAssignModal(false);
                      setAssignForm({ userId: '', dueDate: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                  >
                    Assign Video
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BBSCoaching;