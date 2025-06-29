import express from 'express';
import { body, query, validationResult } from 'express-validator';

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get user's tasks with filtering and pagination
// @access  Public (for testing)
router.get('/', async (req, res) => {
  try {
    // Return sample tasks for testing
    const sampleTasks = [
      {
        _id: '1',
        title: 'Sample Task 1',
        description: 'This is a sample task',
        status: 'todo',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '2',
        title: 'Sample Task 2',
        description: 'Another sample task',
        status: 'in-progress',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    res.json({
      success: true,
      data: sampleTasks,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: sampleTasks.length,
        limit: 10
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Public (for testing)
router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional(),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'completed', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, status = 'todo', priority = 'medium' } = req.body;

    // Create a mock task
    const newTask = {
      _id: Date.now().toString(),
      title,
      description: description || '',
      status,
      priority,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json({
      success: true,
      data: newTask,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Public (for testing)
router.put('/:id', [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional(),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'completed', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updates = req.body;

    // Create a mock updated task
    const updatedTask = {
      _id: id,
      title: updates.title || 'Updated Task',
      description: updates.description || '',
      status: updates.status || 'todo',
      priority: updates.priority || 'medium',
      createdAt: new Date(Date.now() - 86400000), // Yesterday
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Public (for testing)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
});

export default router;
