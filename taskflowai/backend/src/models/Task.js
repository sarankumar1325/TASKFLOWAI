import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  // Basic task information
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Task status and priority
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'completed', 'cancelled'],
    default: 'todo'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Task categorization
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Time management
  dueDate: {
    type: Date
  },
  
  estimatedTime: {
    type: Number, // in minutes
    min: [1, 'Estimated time must be at least 1 minute']
  },
  
  actualTime: {
    type: Number, // in minutes
    min: [0, 'Actual time cannot be negative']
  },
  
  // Task ownership and collaboration
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  assignees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['assignee', 'reviewer', 'observer'],
      default: 'assignee'
    }
  }],
  
  // Task hierarchy
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    index: true
  },
  
  subtasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  
  // Project association
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  
  // Sharing and permissions
  isPublic: {
    type: Boolean,
    default: false
  },
  
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    permission: {
      type: String,
      enum: ['view', 'edit', 'admin'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  
  // File attachments
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Comments and activity
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    editedAt: {
      type: Date
    },
    isEdited: {
      type: Boolean,
      default: false
    }
  }],
  
  // AI-generated suggestions
  aiSuggestions: [{
    type: {
      type: String,
      enum: ['optimization', 'deadline', 'priority', 'resource', 'breakdown'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    isApplied: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Tracking and analytics
  timeTracking: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number // in minutes
    },
    description: {
      type: String,
      trim: true
    }
  }],
  
  // Completion tracking
  completedAt: {
    type: Date,
    index: true
  },
  
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Recurring task settings
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: {
      type: Date
    },
    nextDueDate: {
      type: Date
    }
  },
  
  // Metadata
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  
  archivedAt: {
    type: Date
  },
  
  viewCount: {
    type: Number,
    default: 0
  },
  
  lastViewedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
taskSchema.index({ owner: 1, status: 1 });
taskSchema.index({ owner: 1, dueDate: 1 });
taskSchema.index({ owner: 1, priority: 1 });
taskSchema.index({ 'assignees.user': 1 });
taskSchema.index({ project: 1 });
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ category: 1 });
taskSchema.index({ isArchived: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ completedAt: -1 });

// Text search index
taskSchema.index({
  title: 'text',
  description: 'text',
  category: 'text',
  tags: 'text'
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'completed';
});

// Virtual for progress percentage (if has subtasks)
taskSchema.virtual('progress').get(function() {
  if (this.subtasks && this.subtasks.length > 0) {
    // This would need to be populated to calculate actual progress
    return 0; // Placeholder
  }
  return this.status === 'completed' ? 100 : 0;
});

// Instance method to check if user has access
taskSchema.methods.hasAccess = function(userId, permission = 'view') {
  // Owner always has full access
  if (this.owner.toString() === userId.toString()) {
    return true;
  }
  
  // Check if user is assigned
  const isAssignee = this.assignees.some(
    assignee => assignee.user.toString() === userId.toString()
  );
  if (isAssignee) return true;
  
  // Check shared permissions
  const sharedAccess = this.sharedWith.find(
    share => share.user.toString() === userId.toString()
  );
  
  if (!sharedAccess) return false;
  
  // Permission hierarchy: admin > edit > view
  const permissions = ['view', 'edit', 'admin'];
  const userPermLevel = permissions.indexOf(sharedAccess.permission);
  const requiredPermLevel = permissions.indexOf(permission);
  
  return userPermLevel >= requiredPermLevel;
};

// Instance method to add comment
taskSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content: content
  });
  return this.save();
};

// Instance method to complete task
taskSchema.methods.complete = function(userId) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.completedBy = userId;
  return this.save();
};

// Static method to find tasks by user
taskSchema.statics.findByUser = function(userId, options = {}) {
  const query = {
    $or: [
      { owner: userId },
      { 'assignees.user': userId },
      { 'sharedWith.user': userId }
    ]
  };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.archived !== undefined) {
    query.isArchived = options.archived;
  }
  
  return this.find(query);
};

// Static method to find overdue tasks
taskSchema.statics.findOverdue = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $ne: 'completed' },
    isArchived: false
  });
};

// Pre-save middleware
taskSchema.pre('save', function(next) {
  // Update progress and completion
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed') {
      this.completedAt = undefined;
      this.completedBy = undefined;
    }
  }
  
  // Handle recurring tasks
  if (this.isModified('status') && this.status === 'completed' && this.recurring.isRecurring) {
    // Create next occurrence (this would be handled in the service layer)
  }
  
  next();
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
