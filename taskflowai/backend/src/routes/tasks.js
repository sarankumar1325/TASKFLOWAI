import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import { checkTaskAccess } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get user's tasks with filtering and pagination
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('status').optional().isIn(['todo', 'in-progress', 'review', 'completed', 'cancelled']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('sortBy').optional().isIn(['createdAt', 'dueDate', 'priority', 'title', 'status']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
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
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      category,
      tags,
      search,
      dueDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      archived = 'false'
    } = req.query;

    // Build query
    const query = {
      $or: [
        { owner: userId },
        { 'assignees.user': userId },
        { 'sharedWith.user': userId }
      ],
      isArchived: archived === 'true'
    };

    // Add filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = new RegExp(category, 'i');
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Add date filters
    if (dueDate) {
      const date = new Date(dueDate);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      query.dueDate = { $gte: date, $lt: nextDay };
    }

    // Add search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with population
    const tasks = await Task.find(query)
      .populate('owner', 'firstName lastName email profileImage')
      .populate('assignees.user', 'firstName lastName email profileImage')
      .populate('sharedWith.user', 'firstName lastName email profileImage')
      .populate('subtasks', 'title status priority')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Task.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Add virtual fields
    const tasksWithVirtuals = tasks.map(task => ({
      ...task,
      isOverdue: task.dueDate && task.dueDate < new Date() && task.status !== 'completed',
      progress: task.status === 'completed' ? 100 : 0
    }));

    res.json({
      success: true,
      data: {
        tasks: tasksWithVirtuals,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTasks: total,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get tasks error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get tasks',
      error: error.message
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task by ID
// @access  Private
router.get('/:id', checkTaskAccess('view'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('owner', 'firstName lastName email profileImage')
      .populate('assignees.user', 'firstName lastName email profileImage')
      .populate('sharedWith.user', 'firstName lastName email profileImage')
      .populate('parentTask', 'title status')
      .populate('subtasks', 'title status priority dueDate')
      .populate('comments.user', 'firstName lastName profileImage')
      .lean();

    // Update view count
    await Task.findByIdAndUpdate(req.params.id, {
      $inc: { viewCount: 1 },
      lastViewedAt: new Date()
    });

    // Add virtual fields
    const taskWithVirtuals = {
      ...task,
      isOverdue: task.dueDate && task.dueDate < new Date() && task.status !== 'completed',
      progress: task.status === 'completed' ? 100 : 0
    };

    res.json({
      success: true,
      data: { task: taskWithVirtuals }
    });
  } catch (error) {
    logger.error('Get task error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get task',
      error: error.message
    });
  }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', [
  body('title').notEmpty().withMessage('Task title is required'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'completed', 'cancelled']),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('estimatedTime').optional().isInt({ min: 1 }).withMessage('Invalid estimated time')
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
    const taskData = {
      ...req.body,
      owner: userId
    };

    // Create task
    const task = new Task(taskData);
    await task.save();

    // Populate the task for response
    await task.populate('owner', 'firstName lastName email profileImage');

    // Update user stats
    req.user.stats.tasksCreated += 1;
    await req.user.save();

    logger.info(`Task created: ${task.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });
  } catch (error) {
    logger.error('Create task error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', checkTaskAccess('edit'), [
  body('title').optional().notEmpty().withMessage('Task title cannot be empty'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'completed', 'cancelled']),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('estimatedTime').optional().isInt({ min: 1 }).withMessage('Invalid estimated time')
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

    const task = req.task;
    const updateData = req.body;

    // Handle status change to completed
    if (updateData.status === 'completed' && task.status !== 'completed') {
      updateData.completedAt = new Date();
      updateData.completedBy = req.user._id;
      
      // Update user stats
      req.user.stats.tasksCompleted += 1;
      await req.user.save();
    } else if (updateData.status !== 'completed' && task.status === 'completed') {
      updateData.completedAt = undefined;
      updateData.completedBy = undefined;
    }

    // Update task
    Object.assign(task, updateData);
    await task.save();

    // Populate for response
    await task.populate('owner', 'firstName lastName email profileImage');
    await task.populate('assignees.user', 'firstName lastName email profileImage');

    logger.info(`Task updated: ${task.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task }
    });
  } catch (error) {
    logger.error('Update task error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', checkTaskAccess('admin'), async (req, res) => {
  try {
    const task = req.task;

    // Check if task has subtasks
    if (task.subtasks && task.subtasks.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete task with subtasks. Delete subtasks first.'
      });
    }

    await Task.findByIdAndDelete(task._id);

    logger.info(`Task deleted: ${task.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    logger.error('Delete task error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
});

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post('/:id/comments', checkTaskAccess('view'), [
  body('content').notEmpty().withMessage('Comment content is required')
    .isLength({ max: 1000 }).withMessage('Comment too long')
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

    const task = req.task;
    const { content } = req.body;

    // Add comment
    task.comments.push({
      user: req.user._id,
      content
    });

    await task.save();

    // Populate the new comment
    await task.populate('comments.user', 'firstName lastName profileImage');

    const newComment = task.comments[task.comments.length - 1];

    logger.info(`Comment added to task: ${task.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment: newComment }
    });
  } catch (error) {
    logger.error('Add comment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
});

// @route   POST /api/tasks/:id/share
// @desc    Share task with users
// @access  Private
router.post('/:id/share', checkTaskAccess('admin'), [
  body('userIds').isArray().withMessage('User IDs must be an array'),
  body('permission').isIn(['view', 'edit', 'admin']).withMessage('Invalid permission')
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

    const task = req.task;
    const { userIds, permission } = req.body;

    // Add users to shared list
    for (const userId of userIds) {
      // Check if user is already shared with
      const existingShare = task.sharedWith.find(
        share => share.user.toString() === userId
      );

      if (!existingShare) {
        task.sharedWith.push({
          user: userId,
          permission,
          sharedBy: req.user._id
        });
      } else {
        existingShare.permission = permission;
      }
    }

    await task.save();

    logger.info(`Task shared: ${task.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Task shared successfully',
      data: { task }
    });
  } catch (error) {
    logger.error('Share task error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to share task',
      error: error.message
    });
  }
});

// @route   PUT /api/tasks/:id/archive
// @desc    Archive/unarchive task
// @access  Private
router.put('/:id/archive', checkTaskAccess('admin'), async (req, res) => {
  try {
    const task = req.task;
    const { archived = true } = req.body;

    task.isArchived = archived;
    if (archived) {
      task.archivedAt = new Date();
    } else {
      task.archivedAt = undefined;
    }

    await task.save();

    const action = archived ? 'archived' : 'unarchived';
    logger.info(`Task ${action}: ${task.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: `Task ${action} successfully`,
      data: { task }
    });
  } catch (error) {
    logger.error('Archive task error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to archive task',
      error: error.message
    });
  }
});

// @route   GET /api/tasks/stats/overview
// @desc    Get task statistics overview
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Task.aggregate([
      {
        $match: {
          $or: [
            { owner: userId },
            { 'assignees.user': userId }
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

    // Get overdue count
    const overdueCount = await Task.countDocuments({
      $or: [
        { owner: userId },
        { 'assignees.user': userId }
      ],
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' },
      isArchived: false
    });

    // Format stats
    const formattedStats = {
      total: 0,
      todo: 0,
      'in-progress': 0,
      review: 0,
      completed: 0,
      cancelled: 0,
      overdue: overdueCount
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.json({
      success: true,
      data: { stats: formattedStats }
    });
  } catch (error) {
    logger.error('Get task stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get task statistics',
      error: error.message
    });
  }
});

export default router;
