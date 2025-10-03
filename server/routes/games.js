import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import Game from '../models/Game.js';
import mongoose from 'mongoose';
import QuizQuestion from '../models/QuizQuestion.js';
import GameScore from '../models/GameScore.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import { validateObjectId, validateCompanyId, validate } from '../middleware/validation.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

// Get all games for a plant
router.get('/:companyId/games',
  validateCompanyId,
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const { plantId, type, difficulty } = req.query;
      
      const filter = { companyId, isActive: true };
      
      // Plant head can see only their plant's games
      if (req.user.role === 'plant_head' || plantId) {
        filter.plantId = plantId || req.user.plantId;
      }
      
      if (type) filter.type = type;
      if (difficulty) filter.difficulty = difficulty;

      const games = await Game.find(filter)
        .populate('createdBy', 'name role')
        .populate('plantId', 'name')
        .sort({ createdAt: -1 });

      res.json({ games });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Create game
router.post('/:companyId/games',
  validateCompanyId,
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      
      const gameData = {
        ...req.body,
        companyId,
        plantId: req.user.plantId || req.body.plantId,
        createdBy: req.user._id
      };

      const game = new Game(gameData);
      await game.save();
      
      await game.populate('createdBy', 'name role');
      await game.populate('plantId', 'name');

      res.status(201).json({
        message: 'Game created successfully',
        game
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Update game
router.patch('/:companyId/games/:gameId',
  validateCompanyId,
  validateObjectId('gameId'),
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, gameId } = req.params;
      
      const game = await Game.findOneAndUpdate(
        { _id: gameId, companyId, createdBy: req.user._id },
        req.body,
        { new: true, runValidators: true }
      ).populate('createdBy', 'name role')
       .populate('plantId', 'name');

      if (!game) {
        return res.status(404).json({ message: 'Game not found or unauthorized' });
      }

      res.json({
        message: 'Game updated successfully',
        game
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete game
router.delete('/:companyId/games/:gameId',
  validateCompanyId,
  validateObjectId('gameId'),
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, gameId } = req.params;
      
      const game = await Game.findOneAndUpdate(
        { _id: gameId, companyId, createdBy: req.user._id },
        { isActive: false },
        { new: true }
      );

      if (!game) {
        return res.status(404).json({ message: 'Game not found or unauthorized' });
      }

      res.json({ message: 'Game deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get quiz questions for a game
router.get('/:companyId/games/:gameId/questions',
  validateCompanyId,
  validateObjectId('gameId'),
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, gameId } = req.params;
      
      const questions = await QuizQuestion.find({ 
        gameId, 
        companyId, 
        isActive: true 
      })
        .populate('createdBy', 'name role')
        .sort({ createdAt: 1 });

      res.json({ questions });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Create quiz question
router.post('/:companyId/games/:gameId/questions',
  validateCompanyId,
  validateObjectId('gameId'),
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, gameId } = req.params;
      
      // Verify game exists and belongs to user's plant
      const game = await Game.findOne({ 
        _id: gameId, 
        companyId,
        plantId: req.user.plantId 
      });
      
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      const questionData = {
        ...req.body,
        gameId,
        companyId,
        plantId: req.user.plantId,
        createdBy: req.user._id,
        tags: req.body.tags || []
      };

      const question = new QuizQuestion(questionData);
      await question.save();
      
      await question.populate('createdBy', 'name role');

      res.status(201).json({
        message: 'Question created successfully',
        question
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Upload quiz questions from Excel
router.post('/:companyId/games/:gameId/questions/upload',
  validateCompanyId,
  validateObjectId('gameId'),
  validate,
  authenticate,
  checkCompanyAccess,
  upload.single('file'),
  async (req, res) => {
    try {
      const { companyId, gameId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Verify game exists
      const game = await Game.findOne({ 
        _id: gameId, 
        companyId,
        plantId: req.user.plantId 
      });
      
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row
      const rows = data.slice(1);
      const questions = [];

      for (const row of rows) {
        if (row.length < 6) continue; // Skip incomplete rows

        const [question, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty, tags] = row;
        
        if (!question || !optionA || !optionB || !correctAnswer) continue;

        const options = [
          { text: optionA, isCorrect: correctAnswer.toString().toUpperCase() === 'A', points: 10 },
          { text: optionB, isCorrect: correctAnswer.toString().toUpperCase() === 'B', points: 10 }
        ];

        if (optionC) {
          options.push({ text: optionC, isCorrect: correctAnswer.toString().toUpperCase() === 'C', points: 10 });
        }
        if (optionD) {
          options.push({ text: optionD, isCorrect: correctAnswer.toString().toUpperCase() === 'D', points: 10 });
        }

        const questionData = {
          question,
          options,
          explanation: explanation || '',
          difficulty: difficulty || 'medium',
          tags: tags ? tags.split(',').map(t => t.trim()) : [],
          gameId,
          companyId,
          plantId: req.user.plantId,
          createdBy: req.user._id
        };

        questions.push(questionData);
      }

      // Bulk insert questions
      const createdQuestions = await QuizQuestion.insertMany(questions);

      res.json({
        message: `${createdQuestions.length} questions uploaded successfully`,
        count: createdQuestions.length
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Start game (get questions for playing)
router.get('/:companyId/games/:gameId/play',
  validateCompanyId,
  validateObjectId('gameId'),
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, gameId } = req.params;
      
      const game = await Game.findOne({ 
        _id: gameId, 
        companyId, 
        isActive: true 
      }).populate('plantId', 'name');

      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      const questions = await QuizQuestion.find({ 
        gameId, 
        companyId, 
        isActive: true 
      }).select('question options difficulty tags imageUrl');

      // Shuffle questions and options
      const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
      
      shuffledQuestions.forEach(q => {
        q.options = q.options.sort(() => Math.random() - 0.5);
      });

      res.json({ 
        game,
        questions: shuffledQuestions
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Submit game score
router.post('/:companyId/games/:gameId/score',
  validateCompanyId,
  validateObjectId('gameId'),
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, gameId } = req.params;
      const { answers, timeSpent } = req.body;

      // Get game and questions
      const game = await Game.findById(gameId);
      const questions = await QuizQuestion.find({ gameId, isActive: true });

      if (!game || !questions.length) {
        return res.status(404).json({ message: 'Game or questions not found' });
      }

      // Calculate score
      let score = 0;
      let correctAnswers = 0;
      const processedAnswers = [];

      answers.forEach((answer, index) => {
        const question = questions[index];
        if (!question) return;

        const selectedOption = question.options[answer.selectedOption];
        const isCorrect = selectedOption?.isCorrect || false;
        const points = isCorrect ? (selectedOption?.points || 10) : 0;

        if (isCorrect) {
          correctAnswers++;
          score += points;
        }

        processedAnswers.push({
          questionId: question._id,
          selectedOption: answer.selectedOption,
          isCorrect,
          points,
          timeSpent: answer.timeSpent || 0
        });
      });

      // Check for existing attempts
      const existingScores = await GameScore.find({ 
        userId: req.user._id, 
        gameId 
      });

      const scoreData = {
        userId: req.user._id,
        gameId,
        companyId,
        plantId: req.user.plantId,
        score,
        totalQuestions: questions.length,
        correctAnswers,
        timeSpent,
        answers: processedAnswers,
        attempts: existingScores.length + 1
      };

      const gameScore = new GameScore(scoreData);
      await gameScore.save();

      // Update game statistics
      const allScores = await GameScore.find({ gameId });
      const avgScore = allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length;

      await Game.findByIdAndUpdate(gameId, {
        $inc: { playCount: 1 },
        averageScore: Math.round(avgScore)
      });

      await gameScore.populate('userId', 'name');
      await gameScore.populate('gameId', 'title type');

      res.json({
        message: 'Score submitted successfully',
        score: gameScore,
        passed: gameScore.passed,
        percentage: gameScore.percentage
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get leaderboard for a plant
router.get('/:companyId/games/leaderboard',
  validateCompanyId,
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const { gameId, plantId } = req.query;

      const matchFilter = { companyId: new mongoose.Types.ObjectId(companyId) };

      // Filter by plant
      if (req.user.role === 'plant_head' || plantId) {
        matchFilter.plantId = new mongoose.Types.ObjectId(plantId || req.user.plantId);
      }

      if (gameId) {
        matchFilter.gameId = new mongoose.Types.ObjectId(gameId);
      }

      const leaderboard = await GameScore.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$userId',
            totalPoints: { $sum: '$score' },
            gamesPlayed: { $sum: 1 },
            averageScore: { $avg: '$score' },
            bestScore: { $max: '$score' },
            lastPlayed: { $max: '$createdAt' },
            gamesWon: { $sum: { $cond: ['$passed', 1, 0] } }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            userId: '$_id',
            userName: '$user.name',
            userRole: '$user.role',
            totalPoints: 1,
            gamesPlayed: 1,
            averageScore: { $round: ['$averageScore', 1] },
            bestScore: 1,
            gamesWon: 1,
            winRate: {
              $round: [
                { $multiply: [{ $divide: ['$gamesWon', '$gamesPlayed'] }, 100] },
                1
              ]
            },
            lastPlayed: 1
          }
        },
        { $sort: { totalPoints: -1 } },
        { $limit: 50 }
      ]);

      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      res.json({ leaderboard });
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message });
    }
  }
);

// Get user game statistics
router.get('/:companyId/games/stats/:userId',
  validateCompanyId,
  validateObjectId('userId'),
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, userId } = req.params;
      
      const stats = await GameScore.aggregate([
        { 
          $match: { 
            userId: new mongoose.Types.ObjectId(userId), 
            companyId: new mongoose.Types.ObjectId(companyId) 
          } 
        },
        {
          $group: {
            _id: null,
            totalPoints: { $sum: '$score' },
            gamesPlayed: { $sum: 1 },
            averageScore: { $avg: '$score' },
            bestScore: { $max: '$score' },
            totalTimeSpent: { $sum: '$timeSpent' },
            gamesWon: { 
              $sum: { $cond: ['$passed', 1, 0] } 
            }
          }
        }
      ]);

      const userStats = stats[0] || {
        totalPoints: 0,
        gamesPlayed: 0,
        averageScore: 0,
        bestScore: 0,
        totalTimeSpent: 0,
        gamesWon: 0
      };

      // Calculate win rate
      if (userStats.gamesPlayed > 0) {
        userStats.winRate = Math.round((userStats.gamesWon / userStats.gamesPlayed) * 100);
      } else {
        userStats.winRate = 0;
      }
      res.json({ stats: userStats });
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message });
    }
  }
);

// Get game results for a user
router.get('/:companyId/games/:gameId/results/:userId',
  validateCompanyId,
  validateObjectId('gameId'),
  validateObjectId('userId'),
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, gameId, userId } = req.params;
      
      const results = await GameScore.find({ 
        userId, 
        gameId, 
        companyId 
      })
        .populate('gameId', 'title type passingScore')
        .sort({ createdAt: -1 });

      res.json({ results });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;