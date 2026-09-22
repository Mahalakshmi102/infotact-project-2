const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Dataset = require('../models/Dataset');
const { processCsvStream } = require('../services/streamProcessor');
const { generateCsv } = require('../data/sample_generator');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testStreaming() {
  console.log('==============================================');
  console.log('STREAMWEAVER - DAY 3 & 4: STREAMING & METADATA');
  console.log('==============================================');

  let mongod = null;
  let uri = process.env.MONGODB_URI;

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(' Connected to MongoDB');
  } catch (err) {
    console.log(' Using MongoMemoryServer for Streaming verification...');
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    await mongoose.connect(uri);
  }

  // Create test user
  const user = await User.create({
    name: 'Stream Tester',
    email: `stream.test.${Date.now()}@streamweaver.io`,
    password: 'password123',
  });

  const samplesDir = path.join(__dirname, '../data/samples');
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }

  const testFiles = [
    { name: 'small.csv', rows: 100 },
    { name: 'medium.csv', rows: 10000 },
    { name: 'large.csv', rows: 50000 },
  ];

  for (const item of testFiles) {
    const filePath = path.join(samplesDir, item.name);
    if (!fs.existsSync(filePath)) {
      await generateCsv(filePath, item.rows, item.name);
    }

    const fileStat = fs.statSync(filePath);
    console.log(`\n--- Testing ${item.name} (${(fileStat.size / 1024).toFixed(1)} KB) ---`);

    // 1. Create dataset metadata record (Day 3 task)
    const dataset = await Dataset.create({
      fileName: item.name,
      fileSize: fileStat.size,
      fileType: 'text/csv',
      filePath: filePath,
      totalRows: 0,
      uploadedBy: user._id,
      status: 'pending',
    });

    console.log(`Initial Dataset record created with status: '${dataset.status}'`);

    // 2. Process via Native Node.js Stream (Day 4 task)
    const memBefore = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    console.log(`Heap before streaming: ${memBefore} MB`);

    const processed = await processCsvStream(dataset._id, filePath);

    const memAfter = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    console.log(`Heap after streaming: ${memAfter} MB`);

    // 3. Verify in MongoDB (Day 5 verification task)
    const saved = await Dataset.findById(dataset._id);
    console.log('Stored in MongoDB:');
    console.log(' - Status:', saved.status);
    console.log(' - Total Rows:', saved.totalRows.toLocaleString());
    console.log(' - Processing Time:', saved.processingTimeMs + ' ms');
    console.log(' - Headers Detected:', saved.headers.join(', '));
    console.log(' - MongoDB Connection State:', mongoose.connection.readyState === 1 ? 'Stable & Healthy' : 'Unstable');

    if (saved.status !== 'completed' || saved.totalRows !== item.rows) {
      throw new Error(`Streaming verification failed for ${item.name}: expected ${item.rows} rows, got ${saved.totalRows}`);
    }
  }

  await mongoose.disconnect();
  if (mongod) await mongod.stop();

  console.log('\n All Streaming and Metadata Tests for small, medium, and large CSVs PASSED!');
  console.log('==============================================\n');
}

testStreaming().catch((err) => {
  console.error('Streaming test failed:', err);
  process.exit(1);
});
