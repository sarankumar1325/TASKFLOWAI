import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Task from '../models/Task.js';
import logger from '../config/logger.js';

// Store connected users
const connectedUsers = new Map();

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId).select('-__v');
    
    if (!user || !user.isActive) {
      return next(new Error('Authentication error: Invalid user'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};

// Setup Socket.IO event handlers
const setupSocketHandlers = (io) => {
  // Use authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.email} (${socket.id})`);

    // Store user connection
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to TaskFlow AI',
      userId: socket.userId,
      timestamp: new Date()
    });

    // Broadcast user online status to collaborators
    broadcastUserStatus(io, socket.userId, 'online');

    // Handle joining task rooms
    socket.on('join:task', async (taskId) => {
      try {
        // Verify user has access to task
        const task = await Task.findOne({
          _id: taskId,
          $or: [
            { owner: socket.userId },
            { 'assignees.user': socket.userId },
            { 'sharedWith.user': socket.userId }
          ]
        });

        if (task) {
          socket.join(`task:${taskId}`);
          socket.emit('joined:task', { taskId, message: 'Joined task room' });
          
          // Notify others in the task room
          socket.to(`task:${taskId}`).emit('user:joined', {
            userId: socket.userId,
            userName: `${socket.user.firstName} ${socket.user.lastName}`,
            taskId
          });

          logger.info(`User ${socket.user.email} joined task room: ${taskId}`);
        } else {
          socket.emit('error', { message: 'Access denied to task room' });
        }
      } catch (error) {
        logger.error('Join task room error:', error.message);
        socket.emit('error', { message: 'Failed to join task room' });
      }
    });

    // Handle leaving task rooms
    socket.on('leave:task', (taskId) => {
      socket.leave(`task:${taskId}`);
      socket.to(`task:${taskId}`).emit('user:left', {
        userId: socket.userId,
        userName: `${socket.user.firstName} ${socket.user.lastName}`,
        taskId
      });
      socket.emit('left:task', { taskId, message: 'Left task room' });
    });

    // Handle task updates
    socket.on('task:update', async (data) => {
      try {
        const { taskId, updates, action } = data;

        // Verify user has edit access to task
        const task = await Task.findById(taskId);
        if (!task || !task.hasAccess(socket.userId, 'edit')) {
          socket.emit('error', { message: 'Access denied for task update' });
          return;
        }

        // Broadcast update to task room
        socket.to(`task:${taskId}`).emit('task:updated', {
          taskId,
          updates,
          action,
          updatedBy: {
            id: socket.userId,
            name: `${socket.user.firstName} ${socket.user.lastName}`
          },
          timestamp: new Date()
        });

        logger.info(`Task update broadcasted: ${taskId} by ${socket.user.email}`);
      } catch (error) {
        logger.error('Task update broadcast error:', error.message);
        socket.emit('error', { message: 'Failed to broadcast task update' });
      }
    });

    // Handle real-time comments
    socket.on('task:comment', async (data) => {
      try {
        const { taskId, comment } = data;

        // Verify user has access to task
        const task = await Task.findById(taskId);
        if (!task || !task.hasAccess(socket.userId, 'view')) {
          socket.emit('error', { message: 'Access denied for commenting' });
          return;
        }

        // Broadcast comment to task room
        const commentData = {
          taskId,
          comment: {
            id: new Date().getTime(), // Temporary ID
            content: comment.content,
            user: {
              id: socket.userId,
              firstName: socket.user.firstName,
              lastName: socket.user.lastName,
              profileImage: socket.user.profileImage
            },
            createdAt: new Date()
          },
          timestamp: new Date()
        };

        io.to(`task:${taskId}`).emit('task:comment:new', commentData);

        logger.info(`Comment broadcasted on task ${taskId} by ${socket.user.email}`);
      } catch (error) {
        logger.error('Comment broadcast error:', error.message);
        socket.emit('error', { message: 'Failed to broadcast comment' });
      }
    });

    // Handle typing indicators
    socket.on('task:typing', (data) => {
      const { taskId, isTyping } = data;
      
      socket.to(`task:${taskId}`).emit('task:typing:status', {
        taskId,
        user: {
          id: socket.userId,
          name: `${socket.user.firstName} ${socket.user.lastName}`
        },
        isTyping,
        timestamp: new Date()
      });
    });

    // Handle task status changes
    socket.on('task:status:change', async (data) => {
      try {
        const { taskId, fromStatus, toStatus } = data;

        // Verify user has access to task
        const task = await Task.findById(taskId);
        if (!task || !task.hasAccess(socket.userId, 'edit')) {
          socket.emit('error', { message: 'Access denied for status change' });
          return;
        }

        // Broadcast status change
        socket.to(`task:${taskId}`).emit('task:status:changed', {
          taskId,
          fromStatus,
          toStatus,
          changedBy: {
            id: socket.userId,
            name: `${socket.user.firstName} ${socket.user.lastName}`
          },
          timestamp: new Date()
        });

        // Notify task owner and assignees
        const notificationRecipients = [
          task.owner.toString(),
          ...task.assignees.map(a => a.user.toString()),
          ...task.sharedWith.map(s => s.user.toString())
        ].filter(userId => userId !== socket.userId);

        notificationRecipients.forEach(userId => {
          io.to(`user:${userId}`).emit('notification', {
            type: 'task_status_changed',
            message: `Task "${task.title}" status changed to ${toStatus}`,
            taskId,
            fromUser: {
              id: socket.userId,
              name: `${socket.user.firstName} ${socket.user.lastName}`
            },
            timestamp: new Date()
          });
        });

        logger.info(`Task status change broadcasted: ${taskId} (${fromStatus} -> ${toStatus}) by ${socket.user.email}`);
      } catch (error) {
        logger.error('Task status change broadcast error:', error.message);
        socket.emit('error', { message: 'Failed to broadcast status change' });
      }
    });

    // Handle AI interactions
    socket.on('ai:chat', (data) => {
      // Broadcast AI interaction status to user's other devices
      socket.to(`user:${socket.userId}`).emit('ai:chat:sync', {
        message: data.message,
        timestamp: new Date()
      });
    });

    // Handle collaboration invites
    socket.on('collaboration:invite', async (data) => {
      try {
        const { taskId, invitedUserId, permission } = data;

        // Verify user can invite others
        const task = await Task.findById(taskId);
        if (!task || !task.hasAccess(socket.userId, 'admin')) {
          socket.emit('error', { message: 'Access denied for sending invites' });
          return;
        }

        // Send invitation to invited user
        io.to(`user:${invitedUserId}`).emit('collaboration:invited', {
          taskId,
          taskTitle: task.title,
          permission,
          invitedBy: {
            id: socket.userId,
            name: `${socket.user.firstName} ${socket.user.lastName}`,
            profileImage: socket.user.profileImage
          },
          timestamp: new Date()
        });

        socket.emit('collaboration:invite:sent', {
          taskId,
          invitedUserId,
          message: 'Invitation sent successfully'
        });

        logger.info(`Collaboration invite sent for task ${taskId} to user ${invitedUserId} by ${socket.user.email}`);
      } catch (error) {
        logger.error('Collaboration invite error:', error.message);
        socket.emit('error', { message: 'Failed to send collaboration invite' });
      }
    });

    // Handle user activity updates
    socket.on('user:activity', (data) => {
      const { activity, metadata } = data;
      
      // Update user's last active time
      socket.user.updateLastActive();

      // Broadcast activity to collaborators (optional feature)
      if (activity === 'task_view' && metadata.taskId) {
        socket.to(`task:${metadata.taskId}`).emit('user:activity', {
          userId: socket.userId,
          userName: `${socket.user.firstName} ${socket.user.lastName}`,
          activity,
          metadata,
          timestamp: new Date()
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.user.email} (${socket.id}) - Reason: ${reason}`);

      // Remove from connected users
      connectedUsers.delete(socket.userId);

      // Broadcast user offline status
      broadcastUserStatus(io, socket.userId, 'offline');

      // Leave all task rooms
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room.startsWith('task:')) {
          socket.to(room).emit('user:left', {
            userId: socket.userId,
            userName: `${socket.user.firstName} ${socket.user.lastName}`,
            reason: 'disconnected'
          });
        }
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.user.email}:`, error);
    });
  });

  // Global error handler
  io.engine.on('connection_error', (err) => {
    logger.error('Socket.IO connection error:', err);
  });
};

// Helper function to broadcast user status
const broadcastUserStatus = async (io, userId, status) => {
  try {
    // Find tasks where user collaborates
    const collaborativeTasks = await Task.find({
      $or: [
        { 'assignees.user': userId },
        { 'sharedWith.user': userId },
        { owner: userId }
      ]
    }).select('_id owner assignees sharedWith');

    // Get all collaborators
    const collaborators = new Set();
    
    collaborativeTasks.forEach(task => {
      // Add task owner
      if (task.owner.toString() !== userId) {
        collaborators.add(task.owner.toString());
      }
      
      // Add assignees
      task.assignees.forEach(assignee => {
        if (assignee.user.toString() !== userId) {
          collaborators.add(assignee.user.toString());
        }
      });
      
      // Add shared users
      task.sharedWith.forEach(shared => {
        if (shared.user.toString() !== userId) {
          collaborators.add(shared.user.toString());
        }
      });
    });

    // Broadcast status to collaborators
    collaborators.forEach(collaboratorId => {
      io.to(`user:${collaboratorId}`).emit('user:status', {
        userId,
        status,
        timestamp: new Date()
      });
    });
  } catch (error) {
    logger.error('Broadcast user status error:', error.message);
  }
};

// Export connected users for external access
export const getConnectedUsers = () => connectedUsers;

export default setupSocketHandlers;
