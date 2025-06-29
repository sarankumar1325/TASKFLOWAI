import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../config/logger.js';

// Clerk-compatible authentication middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    try {
      // Try to decode as Clerk JWT token first
      const decoded = jwt.decode(token, { complete: true });
      
      if (decoded && decoded.payload && decoded.payload.sub) {
        // This looks like a Clerk token
        const clerkUserId = decoded.payload.sub;
        
        // Find or create user with Clerk ID
        let user = await User.findOne({ clerkId: clerkUserId });
        
        if (!user) {
          // Create a new user with Clerk data
          user = new User({
            clerkId: clerkUserId,
            email: decoded.payload.email || `user-${clerkUserId}@clerk.local`,
            username: decoded.payload.username || `user-${clerkUserId}`,
            firstName: decoded.payload.given_name || '',
            lastName: decoded.payload.family_name || '',
            isActive: true
          });
          await user.save();
          logger.info(`Created new user from Clerk: ${user.email}`);
        }
        
        req.user = user;
        req.clerkUserId = clerkUserId;
        return next();
      }
    } catch (clerkError) {
      logger.debug('Token is not a Clerk token, trying JWT verification');
    }

    // Fallback to JWT verification for existing tokens
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user
    const user = await User.findById(decoded.userId).select('-__v');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    // Update last active time
    user.lastActiveAt = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Clerk-based authentication middleware (for webhooks and direct Clerk integration)
export const authenticateClerk = async (req, res, next) => {
  try {
    // This would integrate with Clerk's authentication
    // For now, we'll implement a basic version
    const clerkUserId = req.headers['clerk-user-id'];
    
    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: 'Clerk user ID required'
      });
    }

    // Find user by Clerk ID
    const user = await User.findOne({ clerkId: clerkUserId }).select('-__v');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Clerk authentication error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Authorization middleware for different roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // For now, we'll use subscription plan as role
    const userRole = req.user.subscription.plan;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to check premium features
export const requirePremium = (req, res, next) => {
  if (!req.user || !req.user.isPremium()) {
    return res.status(403).json({
      success: false,
      message: 'Premium subscription required for this feature'
    });
  }
  next();
};

// Middleware to validate API key (for external integrations)
export const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }

    // In a real implementation, you would validate against stored API keys
    // For now, we'll use a simple check
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    next();
  } catch (error) {
    logger.error('API key validation error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'API key validation failed'
    });
  }
};

// Middleware to check if user owns resource
export const checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user._id;

      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      if (resource.owner.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error('Ownership check error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

// Middleware to check task access (considering shared tasks)
export const checkTaskAccess = (permission = 'view') => {
  return async (req, res, next) => {
    try {
      const taskId = req.params.id;
      const userId = req.user._id;

      const Task = (await import('../models/Task.js')).default;
      const task = await Task.findById(taskId);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      if (!task.hasAccess(userId, permission)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this task'
        });
      }

      req.task = task;
      next();
    } catch (error) {
      logger.error('Task access check error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

export default {
  authenticateToken,
  authenticateClerk,
  authorize,
  requirePremium,
  validateApiKey,
  checkOwnership,
  checkTaskAccess
};
