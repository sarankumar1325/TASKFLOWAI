import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Clerk user ID
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Basic user information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  
  profileImage: {
    type: String,
    default: ''
  },
  
  // User preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      taskReminders: {
        type: Boolean,
        default: true
      },
      weeklyDigest: {
        type: Boolean,
        default: false
      }
    },
    
    language: {
      type: String,
      default: 'en'
    },
    
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Subscription information
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'past_due'],
      default: 'active'
    },
    
    stripeCustomerId: {
      type: String,
      sparse: true
    },
    
    currentPeriodEnd: {
      type: Date
    }
  },
  
  // Activity tracking
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  
  // Statistics
  stats: {
    tasksCreated: {
      type: Number,
      default: 0
    },
    
    tasksCompleted: {
      type: Number,
      default: 0
    },
    
    collaborations: {
      type: Number,
      default: 0
    },
    
    aiInteractions: {
      type: Number,
      default: 0
    }
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Security
  twoFactorEnabled: {
    type: Boolean,
    default: false
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
userSchema.index({ clerkId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ lastActiveAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Instance method to update last active time
userSchema.methods.updateLastActive = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

// Instance method to check if user is premium
userSchema.methods.isPremium = function() {
  return this.subscription.plan !== 'free' && this.subscription.status === 'active';
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  
  if (this.isModified('username') && this.username) {
    this.username = this.username.toLowerCase();
  }
  
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
