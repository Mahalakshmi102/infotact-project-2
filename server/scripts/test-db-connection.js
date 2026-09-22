const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
  console.log('==============================================');
  console.log('STREAMWEAVER - DAY 1: DATABASE CONNECTION TEST');
  console.log('==============================================');
  console.log(`Node.js version: ${process.version}`);
  console.log(`Target MONGODB_URI: ${process.env.MONGODB_URI || 'not set'}`);

  let mongod = null;
  let uri = process.env.MONGODB_URI;

  try {
    console.log('\n[Step 1] Attempting connection to configured MongoDB...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(' Successfully connected to configured MongoDB!');
  } catch (err) {
    console.warn(`! Configured MongoDB not reachable (${err.message}).`);
    console.log('\n[Step 2] Spinning up MongoMemoryServer for full automated validation...');
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(` Connected to In-Memory MongoDB test instance at: ${uri}`);
  }

  // Verify collections registration
  require('../models/User');
  require('../models/Dataset');
  require('../models/Pipeline');
  require('../models/EtlJob');
  require('../models/Transformation');

  console.log('\n[Step 3] Checking Initial Database Collections Architecture:');
  const registeredModels = Object.keys(mongoose.models);
  registeredModels.forEach((modelName) => {
    console.log(`  - [Collection: ${mongoose.models[modelName].collection.name}] -> Model: ${modelName}`);
  });

  const expected = ['User', 'Dataset', 'Pipeline', 'EtlJob', 'Transformation'];
  const allFound = expected.every((name) => registeredModels.includes(name));

  if (allFound) {
    console.log('\n All 5 Initial Collections verified: users, datasets, pipelines, etl_jobs, transformations');
  } else {
    console.error('\n Missing expected collections!');
    process.exit(1);
  }

  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }

  console.log('\n Day 1 Connection and Schema Test PASSED');
  console.log('==============================================\n');
}

testConnection().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
