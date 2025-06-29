import express from 'express';
import { body, validationResult } from 'express-validator';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Task from '../models/Task.js';
import { requirePremium } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

// Initialize Google Gemini AI
const genAI = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null;

// @route   POST /api/ai/chat
// @desc    Chat with AI assistant
// @access  Private (Premium)
router.post('/chat', requirePremium, [
  body('message').notEmpty().withMessage('Message is required'),
  body('context').optional().isObject().withMessage('Context must be an object')
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

    if (!genAI) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available. Please configure GOOGLE_API_KEY.'
      });
    }

    const { message, context } = req.body;
    const userId = req.user._id;

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Build context-aware prompt
    let prompt = `You are TaskFlow AI, a helpful assistant for task management and productivity. 
    
User context:
- User: ${req.user.firstName} ${req.user.lastName}
- Tasks completed: ${req.user.stats.tasksCompleted}
- Tasks created: ${req.user.stats.tasksCreated}

`;

    // Add specific context if provided
    if (context) {
      if (context.tasks) {
        prompt += `Current tasks context:\n${JSON.stringify(context.tasks, null, 2)}\n\n`;
      }
      if (context.currentPage) {
        prompt += `Current page: ${context.currentPage}\n\n`;
      }
    }

    prompt += `User message: ${message}

Please provide a helpful, concise response focused on task management, productivity, and workflow optimization. If the user is asking about specific tasks, provide actionable advice.`;

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    // Update user stats
    req.user.stats.aiInteractions += 1;
    await req.user.save();

    logger.info(`AI chat interaction by ${req.user.email}`);

    res.json({
      success: true,
      data: {
        message: aiResponse,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('AI chat error:', error.message);
    res.status(500).json({
      success: false,
      message: 'AI chat failed',
      error: error.message
    });
  }
});

// @route   POST /api/ai/task-suggestions
// @desc    Get AI suggestions for task optimization
// @access  Private (Premium)
router.post('/task-suggestions', requirePremium, [
  body('taskId').optional().isMongoId().withMessage('Invalid task ID'),
  body('type').isIn(['optimization', 'breakdown', 'priority', 'deadline']).withMessage('Invalid suggestion type')
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

    if (!genAI) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available. Please configure GOOGLE_API_KEY.'
      });
    }

    const { taskId, type } = req.body;
    const userId = req.user._id;

    let prompt = '';
    let task = null;

    if (taskId) {
      // Get specific task
      task = await Task.findOne({
        _id: taskId,
        $or: [
          { owner: userId },
          { 'assignees.user': userId },
          { 'sharedWith.user': userId }
        ]
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Build task-specific prompt
      prompt = `Analyze this task and provide ${type} suggestions:

Task: ${task.title}
Description: ${task.description || 'No description'}
Status: ${task.status}
Priority: ${task.priority}
Due Date: ${task.dueDate || 'Not set'}
Estimated Time: ${task.estimatedTime || 'Not set'} minutes
Category: ${task.category || 'None'}
Tags: ${task.tags.join(', ') || 'None'}

`;
    } else {
      // Get user's recent tasks for general suggestions
      const recentTasks = await Task.find({
        $or: [
          { owner: userId },
          { 'assignees.user': userId }
        ],
        isArchived: false
      })
      .select('title status priority dueDate category')
      .limit(10)
      .sort({ createdAt: -1 });

      prompt = `Based on the user's recent tasks, provide ${type} suggestions:

Recent Tasks:
${recentTasks.map(t => `- ${t.title} (${t.status}, ${t.priority} priority)`).join('\n')}

User Stats:
- Total tasks created: ${req.user.stats.tasksCreated}
- Total completed: ${req.user.stats.tasksCompleted}
- Completion rate: ${req.user.stats.tasksCreated > 0 ? Math.round((req.user.stats.tasksCompleted / req.user.stats.tasksCreated) * 100) : 0}%

`;
    }

    // Add type-specific guidance
    switch (type) {
      case 'optimization':
        prompt += 'Provide specific suggestions to optimize workflow, reduce time, and improve efficiency.';
        break;
      case 'breakdown':
        prompt += 'Suggest how to break down complex tasks into smaller, manageable subtasks.';
        break;
      case 'priority':
        prompt += 'Analyze and suggest priority adjustments based on deadlines, impact, and dependencies.';
        break;
      case 'deadline':
        prompt += 'Suggest realistic deadlines and time management strategies.';
        break;
    }

    prompt += ' Provide actionable, specific recommendations in a concise format.';

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate suggestions
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const suggestions = response.text();

    // Save suggestion to task if specific task was analyzed
    if (task) {
      task.aiSuggestions.push({
        type,
        content: suggestions,
        confidence: 0.8 // Placeholder confidence score
      });
      await task.save();
    }

    // Update user stats
    req.user.stats.aiInteractions += 1;
    await req.user.save();

    logger.info(`AI ${type} suggestions generated for ${req.user.email}`);

    res.json({
      success: true,
      data: {
        suggestions,
        type,
        taskId: taskId || null,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('AI task suggestions error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI suggestions',
      error: error.message
    });
  }
});

// @route   POST /api/ai/auto-categorize
// @desc    Auto-categorize task using AI
// @access  Private
router.post('/auto-categorize', [
  body('title').notEmpty().withMessage('Task title is required'),
  body('description').optional().isString().withMessage('Description must be a string')
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

    if (!genAI) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available. Please configure GOOGLE_API_KEY.'
      });
    }

    const { title, description } = req.body;

    // Build prompt for categorization
    const prompt = `Analyze this task and suggest appropriate category, priority, and estimated time:

Title: ${title}
Description: ${description || 'No description provided'}

Please respond with ONLY a JSON object in this format:
{
  "category": "suggested category (work/personal/health/learning/etc)",
  "priority": "low/medium/high/urgent",
  "estimatedTime": number_in_minutes,
  "tags": ["tag1", "tag2"],
  "reasoning": "brief explanation"
}`;

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate categorization
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let aiResponse = response.text();

    // Try to parse JSON response
    try {
      // Clean up the response to extract JSON
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const categorization = JSON.parse(aiResponse);

      // Update user stats
      req.user.stats.aiInteractions += 1;
      await req.user.save();

      logger.info(`AI auto-categorization performed for ${req.user.email}`);

      res.json({
        success: true,
        data: categorization
      });
    } catch (parseError) {
      logger.error('AI response parsing error:', parseError.message);
      
      // Fallback response
      res.json({
        success: true,
        data: {
          category: 'general',
          priority: 'medium',
          estimatedTime: 60,
          tags: [],
          reasoning: 'AI analysis completed but response format was unclear',
          rawResponse: aiResponse
        }
      });
    }
  } catch (error) {
    logger.error('AI auto-categorize error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-categorize task',
      error: error.message
    });
  }
});

// @route   GET /api/ai/insights
// @desc    Get AI-powered productivity insights
// @access  Private (Premium)
router.get('/insights', requirePremium, async (req, res) => {
  try {
    if (!genAI) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available. Please configure GOOGLE_API_KEY.'
      });
    }

    const userId = req.user._id;

    // Get user's task data for analysis
    const tasks = await Task.find({
      $or: [
        { owner: userId },
        { 'assignees.user': userId }
      ],
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }).select('title status priority dueDate completedAt estimatedTime actualTime category');

    // Analyze completion patterns
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== 'completed');

    // Build analysis prompt
    const prompt = `Analyze this user's productivity data and provide insights:

User: ${req.user.firstName} ${req.user.lastName}
Total tasks (30 days): ${tasks.length}
Completed tasks: ${completedTasks.length}
Overdue tasks: ${overdueTasks.length}
Completion rate: ${tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%

Task breakdown by status:
${['todo', 'in-progress', 'review', 'completed', 'cancelled'].map(status => 
  `${status}: ${tasks.filter(t => t.status === status).length}`
).join('\n')}

Priority distribution:
${['low', 'medium', 'high', 'urgent'].map(priority => 
  `${priority}: ${tasks.filter(t => t.priority === priority).length}`
).join('\n')}

Please provide:
1. Key productivity patterns
2. Areas for improvement
3. Strengths to leverage
4. Specific actionable recommendations
5. Productivity score (1-10)

Keep it concise and actionable.`;

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate insights
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const insights = response.text();

    // Update user stats
    req.user.stats.aiInteractions += 1;
    await req.user.save();

    logger.info(`AI insights generated for ${req.user.email}`);

    res.json({
      success: true,
      data: {
        insights,
        metadata: {
          tasksAnalyzed: tasks.length,
          completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
          overdueCount: overdueTasks.length,
          generatedAt: new Date()
        }
      }
    });
  } catch (error) {
    logger.error('AI insights error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI insights',
      error: error.message
    });
  }
});

export default router;
