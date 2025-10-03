import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import {
  Plus,
  Play,
  Trophy,
  Clock,
  Users,
  Star,
  Search,
  Filter,
  Gamepad2,
  Upload,
  Download,
  Edit,
  Trash2,
  Target,
  Brain,
  Puzzle,
  Eye,
  Award,
  TrendingUp
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { 
  fetchGames, 
  createGame, 
  updateGame, 
  deleteGame,
  getQuizQuestions,
  createQuizQuestion,
  uploadQuizExcel,
  submitGameScore,
  fetchLeaderboard,
  fetchUserGameStats
} from '../../store/slices/bbsSlice';
import { addNotification } from '../../store/slices/uiSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { usePermissions } from '../../hooks/usePermission';
import { format } from 'date-fns';

interface GameFormData {
  title: string;
  description: string;
  type: string;
  difficulty: string;
  estimatedTime: string;
  points: number;
  passingScore: number;
  category: string;
  tags: string[];
}

interface QuestionFormData {
  question: string;
  options: Array<{ text: string; isCorrect: boolean; points: number }>;
  explanation: string;
  difficulty: string;
  tags: string[];
}

const BBSGames: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { games, leaderboard, userGameStats, isLoading } = useAppSelector((state) => state.bbs);
  const permissions = usePermissions();

  const [activeTab, setActiveTab] = useState<'games' | 'leaderboard' | 'create'>('games');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showPlayModal, setShowPlayModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [editingGame, setEditingGame] = useState<any>(null);
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
  const [currentAnswers, setCurrentAnswers] = useState<any[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [gameForm, setGameForm] = useState<GameFormData>({
    title: '',
    description: '',
    type: '',
    difficulty: '',
    estimatedTime: '',
    points: 100,
    passingScore: 70,
    category: '',
    tags: []
  });
  const [questionForm, setQuestionForm] = useState<QuestionFormData>({
    question: '',
    options: [
      { text: '', isCorrect: false, points: 10 },
      { text: '', isCorrect: false, points: 10 }
    ],
    explanation: '',
    difficulty: 'medium',
    tags: []
  });

  const gameTypes = [
    { value: 'quiz', label: 'Quiz', icon: Brain, description: 'Multiple choice questions' },
    { value: 'scenario', label: 'Scenario', icon: Target, description: 'Safety scenario analysis' },
    { value: 'puzzle', label: 'Puzzle', icon: Puzzle, description: 'Interactive puzzles' },
    { value: 'find_hazard', label: 'Find Hazard', icon: Eye, description: 'Spot safety hazards' },
    { value: 'matching', label: 'Matching', icon: Award, description: 'Match items correctly' }
  ];

  const difficulties = ['easy', 'medium', 'hard'];

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchGames(user.companyId));
      dispatch(fetchLeaderboard({ companyId: user.companyId }));
      dispatch(fetchUserGameStats({ companyId: user.companyId, userId: user._id }));
    }
  }, [dispatch, user]);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;

    try {
      await dispatch(createGame({
        companyId: user.companyId,
        data: gameForm
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Game created successfully'
      }));

      setShowCreateModal(false);
      resetGameForm();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to create game'
      }));
    }
  };

  const handleUpdateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !editingGame) return;

    try {
      await dispatch(updateGame({
        companyId: user.companyId,
        gameId: editingGame._id,
        data: gameForm
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Game updated successfully'
      }));

      setEditingGame(null);
      resetGameForm();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to update game'
      }));
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!user?.companyId || !confirm('Are you sure you want to delete this game?')) return;

    try {
      await dispatch(deleteGame({
        companyId: user.companyId,
        gameId
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Game deleted successfully'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to delete game'
      }));
    }
  };

  const handleStartGame = async (game: any) => {
    if (!user?.companyId) return;

    try {
      const response = await dispatch(getQuizQuestions({
        companyId: user.companyId,
        gameId: game._id
      })).unwrap();

      if (response.questions.length === 0) {
        dispatch(addNotification({
          type: 'warning',
          message: 'This game has no questions yet'
        }));
        return;
      }

      setSelectedGame(game);
      setCurrentQuestions(response.questions);
      setCurrentAnswers(new Array(response.questions.length).fill({ selectedOption: -1, timeSpent: 0 }));
      setGameStartTime(Date.now());
      setShowPlayModal(true);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to start game'
      }));
    }
  };

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...currentAnswers];
    newAnswers[questionIndex] = {
      selectedOption: optionIndex,
      timeSpent: Date.now() - gameStartTime
    };
    setCurrentAnswers(newAnswers);
  };

  const handleSubmitGame = async () => {
    if (!user?.companyId || !selectedGame) return;

    const totalTime = Date.now() - gameStartTime;

    try {
      const result = await dispatch(submitGameScore({
        companyId: user.companyId,
        gameId: selectedGame._id,
        scoreData: {
          answers: currentAnswers,
          timeSpent: totalTime
        }
      })).unwrap();

      dispatch(addNotification({
        type: result.passed ? 'success' : 'warning',
        message: `Game completed! Score: ${result.percentage}% ${result.passed ? '(Passed)' : '(Failed)'}`
      }));

      setShowPlayModal(false);
      
      // Refresh leaderboard and stats
      dispatch(fetchLeaderboard({ companyId: user.companyId }));
      dispatch(fetchUserGameStats({ companyId: user.companyId, userId: user._id }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to submit score'
      }));
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !selectedGame) return;

    try {
      await dispatch(createQuizQuestion({
        companyId: user.companyId,
        gameId: selectedGame._id,
        data: questionForm
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Question created successfully'
      }));

      setShowQuestionModal(false);
      resetQuestionForm();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to create question'
      }));
    }
  };

  const handleExcelUpload = async (file: File) => {
    if (!user?.companyId || !selectedGame) return;

    try {
      await dispatch(uploadQuizExcel({
        companyId: user.companyId,
        gameId: selectedGame._id,
        file
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Questions uploaded successfully'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to upload questions'
      }));
    }
  };

  const resetGameForm = () => {
    setGameForm({
      title: '',
      description: '',
      type: '',
      difficulty: '',
      estimatedTime: '',
      points: 100,
      passingScore: 70,
      category: '',
      tags: []
    });
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question: '',
      options: [
        { text: '', isCorrect: false, points: 10 },
        { text: '', isCorrect: false, points: 10 }
      ],
      explanation: '',
      difficulty: 'medium',
      tags: []
    });
  };

  const startEdit = (game: any) => {
    setEditingGame(game);
    setGameForm({
      title: game.title,
      description: game.description,
      type: game.type,
      difficulty: game.difficulty,
      estimatedTime: game.estimatedTime,
      points: game.points,
      passingScore: game.passingScore,
      category: game.category,
      tags: game.tags || []
    });
  };

  const addOption = () => {
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, { text: '', isCorrect: false, points: 10 }]
    });
  };

  const removeOption = (index: number) => {
    if (questionForm.options.length > 2) {
      const newOptions = questionForm.options.filter((_, i) => i !== index);
      setQuestionForm({ ...questionForm, options: newOptions });
    }
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    
    // If setting this option as correct, unset others
    if (field === 'isCorrect' && value) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }
    
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  const filteredGames = games?.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || game.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getGameTypeIcon = (type: string) => {
    const gameType = gameTypes.find(gt => gt.value === type);
    return gameType ? gameType.icon : Gamepad2;
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
            Safety Games
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Interactive learning through gamification
          </p>
        </div>
        {permissions.canManageContent() && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Create Game
          </Button>
        )}
      </div>

      {/* User Stats */}
      {userGameStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userGameStats.totalPoints}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <Gamepad2 className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userGameStats.gamesPlayed}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Games Played</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userGameStats.winRate}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userGameStats.averageScore}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <Card className="p-6">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'games', label: 'Games', icon: Gamepad2 },
            { key: 'leaderboard', label: 'Leaderboard', icon: Trophy }
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

      {/* Games Tab */}
      {activeTab === 'games' && (
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
                    placeholder="Search games..."
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All Types</option>
                  {gameTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames?.map((game) => {
              const GameIcon = getGameTypeIcon(game.type);
              return (
                <motion.div
                  key={game._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            game.difficulty === 'easy' ? 'bg-green-100 text-green-600' :
                            game.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            <GameIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {game.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {game.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                          </div>
                        </div>
                        {permissions.canManageContent() && game.createdBy._id === user?._id && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => startEdit(game)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGame(game._id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {game.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full ${
                            game.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            game.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {game.difficulty.toUpperCase()}
                          </span>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {game.estimatedTime}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-3 w-3" />
                          <span>{game.playCount}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          icon={Play}
                          onClick={() => handleStartGame(game)}
                        >
                          Play
                        </Button>
                        {permissions.canManageContent() && game.createdBy._id === user?._id && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Plus}
                            onClick={() => {
                              setSelectedGame(game);
                              setShowQuestionModal(true);
                            }}
                          >
                            Add Questions
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {filteredGames?.length === 0 && (
            <Card className="p-12 text-center">
              <Gamepad2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No games found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || typeFilter ? 'Try adjusting your filters' : 'Start by creating your first safety game'}
              </p>
              {permissions.canManageContent() && (
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Game
                </Button>
              )}
            </Card>
          )}
        </>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
            Plant Leaderboard
          </h2>
          
          <div className="space-y-4">
            {leaderboard?.map((entry, index) => (
              <div
                key={entry.userId}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20' : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {entry.rank}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {entry.userName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {entry.userRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {entry.totalPoints}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Points</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {entry.gamesPlayed}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Games</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {entry.winRate}%
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Win Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {entry.averageScore}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Avg Score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {leaderboard?.length === 0 && (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No scores yet. Start playing games to appear on the leaderboard!
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Create/Edit Game Modal */}
      {(showCreateModal || editingGame) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {editingGame ? 'Edit Game' : 'Create New Game'}
              </h2>

              <form onSubmit={editingGame ? handleUpdateGame : handleCreateGame} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={gameForm.title}
                    onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type *
                    </label>
                    <select
                      value={gameForm.type}
                      onChange={(e) => setGameForm({ ...gameForm, type: e.target.value })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select Type</option>
                      {gameTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Difficulty *
                    </label>
                    <select
                      value={gameForm.difficulty}
                      onChange={(e) => setGameForm({ ...gameForm, difficulty: e.target.value })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select Difficulty</option>
                      {difficulties.map(diff => (
                        <option key={diff} value={diff}>
                          {diff.charAt(0).toUpperCase() + diff.slice(1)}
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
                    value={gameForm.description}
                    onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estimated Time *
                    </label>
                    <input
                      type="text"
                      value={gameForm.estimatedTime}
                      onChange={(e) => setGameForm({ ...gameForm, estimatedTime: e.target.value })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 10 min"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Points *
                    </label>
                    <input
                      type="number"
                      value={gameForm.points}
                      onChange={(e) => setGameForm({ ...gameForm, points: parseInt(e.target.value) })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Passing Score (%) *
                    </label>
                    <input
                      type="number"
                      value={gameForm.passingScore}
                      onChange={(e) => setGameForm({ ...gameForm, passingScore: parseInt(e.target.value) })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={gameForm.category}
                    onChange={(e) => setGameForm({ ...gameForm, category: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Safety Procedures"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={gameForm.tags.join(', ')}
                    onChange={(e) => setGameForm({ 
                      ...gameForm, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="safety, quiz, training"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingGame(null);
                      resetGameForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                  >
                    {editingGame ? 'Update' : 'Create'} Game
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showQuestionModal && selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add Questions to: {selectedGame.title}
                </h2>
                <div className="flex space-x-2">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => e.target.files?.[0] && handleExcelUpload(e.target.files[0])}
                    className="hidden"
                    id="excel-upload"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Upload}
                    onClick={() => document.getElementById('excel-upload')?.click()}
                  >
                    Upload Excel
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Download}
                    onClick={() => {
                      // Create and download Excel template
                      const template = [
                        ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Explanation', 'Difficulty', 'Tags'],
                        ['What is PPE?', 'Personal Protective Equipment', 'Public Protection Equipment', 'Private Protection Equipment', 'Professional Protection Equipment', 'A', 'PPE stands for Personal Protective Equipment', 'easy', 'safety,ppe']
                      ];
                      
                      const ws = XLSX.utils.aoa_to_sheet(template);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Questions');
                      XLSX.writeFile(wb, 'quiz_template.xlsx');
                    }}
                  >
                    Download Template
                  </Button>
                </div>
              </div>

              <form onSubmit={handleCreateQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Question *
                  </label>
                  <textarea
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Options *
                    </label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={Plus}
                      onClick={addOption}
                      disabled={questionForm.options.length >= 6}
                    >
                      Add Option
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {questionForm.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={option.isCorrect}
                          onChange={() => updateOption(index, 'isCorrect', true)}
                          className="text-blue-600"
                        />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOption(index, 'text', e.target.value)}
                          className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          required
                        />
                        {questionForm.options.length > 2 && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            onClick={() => removeOption(index)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Explanation
                  </label>
                  <textarea
                    value={questionForm.explanation}
                    onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Explain why this is the correct answer..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={questionForm.difficulty}
                      onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {difficulties.map(diff => (
                        <option key={diff} value={diff}>
                          {diff.charAt(0).toUpperCase() + diff.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={questionForm.tags.join(', ')}
                      onChange={(e) => setQuestionForm({ 
                        ...questionForm, 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="safety, ppe, procedures"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowQuestionModal(false);
                      resetQuestionForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                  >
                    Add Question
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Play Game Modal */}
      {showPlayModal && selectedGame && currentQuestions.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedGame.title}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Questions: {currentQuestions.length}</span>
                  <span>Time: {Math.floor((Date.now() - gameStartTime) / 1000)}s</span>
                </div>
              </div>

              <div className="space-y-6">
                {currentQuestions.map((question, qIndex) => (
                  <Card key={question._id} className="p-6">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                      {qIndex + 1}. {question.question}
                    </h3>
                    
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <label
                          key={oIndex}
                          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                            currentAnswers[qIndex]?.selectedOption === oIndex
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${qIndex}`}
                            checked={currentAnswers[qIndex]?.selectedOption === oIndex}
                            onChange={() => handleAnswerSelect(qIndex, oIndex)}
                            className="mr-3"
                          />
                          <span className="text-gray-900 dark:text-white">
                            {String.fromCharCode(65 + oIndex)}. {option.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPlayModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmitGame}
                  disabled={currentAnswers.some(answer => answer.selectedOption === -1)}
                >
                  Submit Game
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BBSGames;