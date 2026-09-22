const mongoose = require('mongoose');

let isConnected = false;

/**
 * Connect to MongoDB with robust event listeners and Atlas support
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/streamweaver';

  // Set up connection event listeners for monitoring
  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log(`[MongoDB] Connected to database: ${mongoose.connection.name} @ ${mongoose.connection.host}`);
  });

  mongoose.connection.on('error', (err) => {
    isConnected = false;
    console.error(`[MongoDB] Connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[MongoDB] Disconnected from database');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('[MongoDB] Reconnected to database');
  });

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Initial connection failed: ${error.message}`);
    // If local or atlas fails, in development we can fallback or log instructions
    if (process.env.USE_MEMORY_DB_FALLBACK === 'true') {
      console.log('[MongoDB] Falling back to in-memory MongoDB for local testing...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      return await mongoose.connect(memUri);
    }
    throw error;
  }
};

const getDBStatus = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const readyState = mongoose.connection.readyState;
  return {
    state: states[readyState] || 'unknown',
    isConnected: readyState === 1,
    host: mongoose.connection.host || 'none',
    database: mongoose.connection.name || 'none',
    models: Object.keys(mongoose.models),
  };
};

module.exports = { connectDB, getDBStatus };
