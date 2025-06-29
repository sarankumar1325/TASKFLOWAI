import mongoose from 'mongoose';
import logger from './logger.js';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      logger.warn('⚠️  MONGODB_URI is not defined in environment variables');
      return null;
    }

    logger.info('🔄 Connecting to MongoDB...');
    logger.info(`📍 URI: ${mongoURI.replace(/\/\/.*:.*@/, '//***:***@')}`); // Log URI without credentials

    const conn = await mongoose.connect(mongoURI, {
      serverApi: {
        version: mongoose.mongo.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`📊 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    return conn;
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error.message);
    
    // Log specific MongoDB connection errors
    if (error.message.includes('IP')) {
      logger.error('🔍 IP Whitelist Error - Please add your IP to MongoDB Atlas whitelist');
      logger.error('🔗 Go to: https://cloud.mongodb.com/v2/clusters → Network Access → Add IP Address');
    } else if (error.name === 'MongooseServerSelectionError') {
      logger.error('🔍 Server selection error - Check your MongoDB URI and network connection');
    } else if (error.name === 'MongoParseError') {
      logger.error('🔍 Parse error - Check your MongoDB URI format');
    }
    
    // Don't exit the process, just log the error and continue without DB
    logger.warn('⚠️  Continuing without database connection...');
    return null;
  }
};

export default connectDB;
