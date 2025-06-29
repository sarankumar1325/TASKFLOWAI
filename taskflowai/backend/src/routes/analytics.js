import express from 'express';
import { query, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

const router = express.Router();

// @route   GET /api/analytics/overview
// @desc    Get analytics overview
// @access  Private
router.get('/overview', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('timezone').optional().isString().withMessage('Invalid timezone')
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

    const userId = req.user._id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays[period]);

    // Get task statistics
    const taskStats = await Task.aggregate([
      {
        $match: {
          $or: [
            { owner: userId },
            { 'assignees.user': userId }
          ],
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            status: '$status',
            priority: '$priority',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get completion trends
    const completionTrends = await Task.aggregate([
      {
        $match: {
          $or: [
            { owner: userId },
            { 'assignees.user': userId }
          ],
          completedAt: { $gte: startDate, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$completedAt'
            }
          },
          count: { $sum: 1 },
          avgTime: { $avg: '$actualTime' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get productivity metrics
    const productivityMetrics = await Task.aggregate([
      {
        $match: {
          $or: [
            { owner: userId },
            { 'assignees.user': userId }
          ],
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$dueDate', null] },
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$status', 'completed'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          avgEstimatedTime: { $avg: '$estimatedTime' },
          avgActualTime: { $avg: '$actualTime' }
        }
      }
    ]);

    // Get category breakdown
    const categoryBreakdown = await Task.aggregate([
      {
        $match: {
          $or: [
            { owner: userId },
            { 'assignees.user': userId }
          ],
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Format response
    const overview = {
      period,
      metrics: productivityMetrics[0] || {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        avgEstimatedTime: 0,
        avgActualTime: 0
      },
      trends: {
        completion: completionTrends,
        tasks: taskStats
      },
      breakdown: {
        categories: categoryBreakdown
      }
    };

    // Calculate completion rate
    if (overview.metrics.totalTasks > 0) {
      overview.metrics.completionRate = Math.round(
        (overview.metrics.completedTasks / overview.metrics.totalTasks) * 100
      );
    } else {
      overview.metrics.completionRate = 0;
    }

    res.json({
      success: true,
      data: { overview }
    });
  } catch (error) {
    logger.error('Analytics overview error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics overview',
      error: error.message
    });
  }
});

// @route   GET /api/analytics/productivity
// @desc    Get detailed productivity analytics
// @access  Private
router.get('/productivity', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
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

    const userId = req.user._id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const periodDays = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays[period]);

    // Time-based productivity analysis
    const hourlyProductivity = await Task.aggregate([
      {
        $match: {
          $or: [{ owner: userId }, { 'assignees.user': userId }],
          completedAt: { $gte: startDate, $ne: null }
        }
      },
      {
        $group: {
          _id: { $hour: '$completedAt' },
          count: { $sum: 1 },
          avgTime: { $avg: '$actualTime' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Day of week analysis
    const weeklyProductivity = await Task.aggregate([
      {
        $match: {
          $or: [{ owner: userId }, { 'assignees.user': userId }],
          completedAt: { $gte: startDate, $ne: null }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$completedAt' },
          count: { $sum: 1 },
          avgTime: { $avg: '$actualTime' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Task complexity analysis (based on estimated vs actual time)
    const complexityAnalysis = await Task.aggregate([
      {
        $match: {
          $or: [{ owner: userId }, { 'assignees.user': userId }],
          completedAt: { $gte: startDate, $ne: null },
          estimatedTime: { $gt: 0 },
          actualTime: { $gt: 0 }
        }
      },
      {
        $addFields: {
          timeVariance: {
            $abs: { $subtract: ['$actualTime', '$estimatedTime'] }
          },
          accuracyRatio: {
            $divide: ['$actualTime', '$estimatedTime']
          }
        }
      },
      {
        $group: {
          _id: null,
          avgTimeVariance: { $avg: '$timeVariance' },
          avgAccuracyRatio: { $avg: '$accuracyRatio' },
          tasks: { $push: '$$ROOT' }
        }
      }
    ]);

    // Focus time analysis
    const focusTimeAnalysis = await Task.aggregate([
      {
        $match: {
          $or: [{ owner: userId }, { 'assignees.user': userId }],
          'timeTracking.0': { $exists: true },
          createdAt: { $gte: startDate }
        }
      },
      {
        $unwind: '$timeTracking'
      },
      {
        $match: {
          'timeTracking.duration': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timeTracking.startTime'
            }
          },
          totalFocusTime: { $sum: '$timeTracking.duration' },
          sessions: { $sum: 1 },
          avgSessionLength: { $avg: '$timeTracking.duration' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Performance trends
    const performanceTrends = await Task.aggregate([
      {
        $match: {
          $or: [{ owner: userId }, { 'assignees.user': userId }],
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            week: { $week: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          created: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          onTime: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'completed'] },
                    { $ne: ['$dueDate', null] },
                    { $lte: ['$completedAt', '$dueDate'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]);

    const productivity = {
      period,
      hourlyDistribution: hourlyProductivity,
      weeklyDistribution: weeklyProductivity,
      complexity: complexityAnalysis[0] || null,
      focusTime: focusTimeAnalysis,
      trends: performanceTrends
    };

    res.json({
      success: true,
      data: { productivity }
    });
  } catch (error) {
    logger.error('Productivity analytics error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get productivity analytics',
      error: error.message
    });
  }
});

// @route   GET /api/analytics/collaboration
// @desc    Get collaboration analytics
// @access  Private
router.get('/collaboration', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
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

    const userId = req.user._id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const periodDays = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays[period]);

    // Shared tasks analysis
    const sharedTasksAnalysis = await Task.aggregate([
      {
        $match: {
          owner: userId,
          'sharedWith.0': { $exists: true },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalShared: { $sum: 1 },
          avgSharesPerTask: { $avg: { $size: '$sharedWith' } },
          collaborators: { $addToSet: '$sharedWith.user' }
        }
      }
    ]);

    // Tasks assigned to user
    const assignedTasksAnalysis = await Task.aggregate([
      {
        $match: {
          'assignees.user': userId,
          owner: { $ne: userId },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$owner',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'assignedBy'
        }
      }
    ]);

    // Comment activity
    const commentActivity = await Task.aggregate([
      {
        $match: {
          $or: [
            { owner: userId },
            { 'assignees.user': userId },
            { 'sharedWith.user': userId }
          ],
          'comments.0': { $exists: true },
          createdAt: { $gte: startDate }
        }
      },
      {
        $unwind: '$comments'
      },
      {
        $group: {
          _id: '$comments.user',
          commentCount: { $sum: 1 },
          tasks: { $addToSet: '$_id' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      }
    ]);

    // Team performance (users who share tasks with current user)
    const teamPerformance = await Task.aggregate([
      {
        $match: {
          $or: [
            { 'sharedWith.user': userId },
            { 'assignees.user': userId }
          ],
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$owner',
          tasksShared: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          onTime: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'completed'] },
                    { $ne: ['$dueDate', null] },
                    { $lte: ['$completedAt', '$dueDate'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      }
    ]);

    const collaboration = {
      period,
      shared: sharedTasksAnalysis[0] || {
        totalShared: 0,
        avgSharesPerTask: 0,
        collaborators: []
      },
      assigned: assignedTasksAnalysis,
      comments: commentActivity,
      team: teamPerformance
    };

    res.json({
      success: true,
      data: { collaboration }
    });
  } catch (error) {
    logger.error('Collaboration analytics error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get collaboration analytics',
      error: error.message
    });
  }
});

// @route   GET /api/analytics/export
// @desc    Export analytics data
// @access  Private
router.get('/export', [
  query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format'),
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
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

    const userId = req.user._id;
    const { format = 'json', period = '30d' } = req.query;

    // Calculate date range
    const periodDays = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays[period]);

    // Get all tasks for export
    const tasks = await Task.find({
      $or: [
        { owner: userId },
        { 'assignees.user': userId }
      ],
      createdAt: { $gte: startDate }
    })
    .populate('owner', 'firstName lastName email')
    .populate('assignees.user', 'firstName lastName email')
    .lean();

    // Prepare export data
    const exportData = {
      user: {
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email
      },
      period,
      exportedAt: new Date(),
      totalTasks: tasks.length,
      tasks: tasks.map(task => ({
        id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        tags: task.tags,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        dueDate: task.dueDate,
        completedAt: task.completedAt,
        estimatedTime: task.estimatedTime,
        actualTime: task.actualTime,
        owner: task.owner,
        assignees: task.assignees,
        isOverdue: task.dueDate && task.dueDate < new Date() && task.status !== 'completed'
      }))
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeader = [
        'ID', 'Title', 'Description', 'Status', 'Priority', 'Category',
        'Tags', 'Created', 'Updated', 'Due Date', 'Completed',
        'Estimated Time', 'Actual Time', 'Owner', 'Is Overdue'
      ].join(',');

      const csvRows = exportData.tasks.map(task => [
        task.id,
        `"${task.title || ''}"`,
        `"${task.description || ''}"`,
        task.status,
        task.priority,
        task.category || '',
        `"${task.tags.join('; ')}"`,
        task.createdAt,
        task.updatedAt,
        task.dueDate || '',
        task.completedAt || '',
        task.estimatedTime || '',
        task.actualTime || '',
        `"${task.owner.firstName} ${task.owner.lastName}"`,
        task.isOverdue
      ].join(','));

      const csvContent = [csvHeader, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="taskflow-analytics-${period}.csv"`);
      res.send(csvContent);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="taskflow-analytics-${period}.json"`);
      res.json({
        success: true,
        data: exportData
      });
    }

    logger.info(`Analytics data exported by ${req.user.email} (${format}, ${period})`);
  } catch (error) {
    logger.error('Analytics export error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data',
      error: error.message
    });
  }
});

export default router;
