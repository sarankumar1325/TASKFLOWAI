import express from 'express';
import { body, query, validationResult } from 'express-validator';
import User from '../models/User.js';
import logger from '../config/logger.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user's full profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error('Get user profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
});

// @route   GET /api/users/search
// @desc    Search for users (for sharing tasks)
// @access  Private
router.get('/search', [
  query('q').notEmpty().withMessage('Search query is required'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { q, limit = 10 } = req.query;
    const currentUserId = req.user._id;

    // Create search query
    const searchQuery = {
      _id: { $ne: currentUserId }, // Exclude current user
      isActive: true,
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } }
      ]
    };

    const users = await User.find(searchQuery)
      .select('firstName lastName email username profileImage')
      .limit(parseInt(limit))
      .sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    logger.error('Search users error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: error.message
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get public user profile
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId)
      .select('firstName lastName username profileImage stats lastActiveAt')
      .where('isActive', true);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error('Get user error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
});

// @route   PUT /api/users/stats
// @desc    Update user statistics (internal use)
// @access  Private
router.put('/stats', [
  body('field').isIn(['tasksCreated', 'tasksCompleted', 'collaborations', 'aiInteractions'])
    .withMessage('Invalid stats field'),
  body('increment').optional().isInt().withMessage('Increment must be an integer')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = req.user;
    const { field, increment = 1 } = req.body;

    // Update the specific stat field
    user.stats[field] += increment;
    await user.save();

    res.json({
      success: true,
      message: 'User stats updated successfully',
      data: { stats: user.stats }
    });
  } catch (error) {
    logger.error('Update user stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update user stats',
      error: error.message
    });
  }
});

// @route   GET /api/users/dashboard/stats
// @desc    Get dashboard statistics for current user
// @access  Private
router.get('/dashboard/stats', async (req, res) => {
  try {
    const user = req.user;

    // Get user's task statistics
    const Task = (await import('../models/Task.js')).default;
    
    const taskStats = await Task.aggregate([
      {
        $match: {
          $or: [
            { owner: user._id },
            { 'assignees.user': user._id }
          ],
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get completion rate for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCompletions = await Task.countDocuments({
      $or: [
        { owner: user._id },
        { 'assignees.user': user._id }
      ],
      status: 'completed',
      completedAt: { $gte: thirtyDaysAgo }
    });

    const recentTasks = await Task.countDocuments({
      $or: [
        { owner: user._id },
        { 'assignees.user': user._id }
      ],
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Format stats
    const formattedTaskStats = {
      total: 0,
      todo: 0,
      'in-progress': 0,
      review: 0,
      completed: 0,
      cancelled: 0
    };

    taskStats.forEach(stat => {
      formattedTaskStats[stat._id] = stat.count;
      formattedTaskStats.total += stat.count;
    });

    const completionRate = recentTasks > 0 ? (recentCompletions / recentTasks) * 100 : 0;

    const dashboardStats = {
      user: {
        ...user.stats,
        completionRate: Math.round(completionRate),
        accountAge: Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24))
      },
      tasks: formattedTaskStats,
      recent: {
        completions: recentCompletions,
        totalTasks: recentTasks
      }
    };

    res.json({
      success: true,
      data: { stats: dashboardStats }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: error.message
    });
  }
});

export default router;
