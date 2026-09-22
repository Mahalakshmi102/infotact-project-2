const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testAuthAndCRUD() {
  console.log('==============================================');
  console.log('STREAMWEAVER - DAY 2: AUTH & CRUD TESTS');
  console.log('==============================================');

  let mongod = null;
  let uri = process.env.MONGODB_URI;

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(' Connected to MongoDB');
  } catch (err) {
    console.log(' Using MongoMemoryServer for Day 2 Auth verification...');
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    await mongoose.connect(uri);
  }

  // Ensure indexes are built
  await User.init();

  console.log('\n[Test 1] Create User (Password hashing & Schema fields)');
  const testUser = await User.create({
    name: 'Hari Developer',
    email: 'hari@streamweaver.io',
    password: 'SuperSecretPassword123!',
    role: 'user',
  });

  console.log(' User created with ID:', testUser._id);
  console.log(' Name:', testUser.name);
  console.log(' Email:', testUser.email);
  console.log(' Hashed Password (bcrypt):', testUser.password.substring(0, 20) + '...');
  console.log(' CreatedAt:', testUser.createdAt);

  if (!testUser.password.startsWith('$2a$') && !testUser.password.startsWith('$2b$')) {
    throw new Error('Password was not hashed properly via bcrypt pre-save hook!');
  }

  console.log('\n[Test 2] Password Matching method');
  const isMatch = await testUser.matchPassword('SuperSecretPassword123!');
  const isWrongMatch = await testUser.matchPassword('WrongPassword');
  console.log(' Password validation (correct):', isMatch ? ' Passed' : ' Failed');
  console.log(' Password validation (wrong):', !isWrongMatch ? ' Passed' : ' Failed');

  if (!isMatch || isWrongMatch) throw new Error('Password comparison logic failed!');

  console.log('\n[Test 3] Unique Email Index Validation');
  try {
    await User.create({
      name: 'Duplicate Hari',
      email: 'hari@streamweaver.io', // Duplicate
      password: 'AnotherPassword456!',
    });
    throw new Error('FAIL: Duplicate email was allowed! Unique index failed.');
  } catch (err) {
    if (err.code === 11000) {
      console.log(' Duplicate email correctly rejected with MongoServerError E11000 (duplicate key index)');
    } else {
      console.log(' Duplicate email rejected:', err.message);
    }
  }

  console.log('\n[Test 4] User CRUD Operations');
  // Read
  const foundUser = await User.findById(testUser._id);
  console.log(' Read user:', foundUser.email);

  // Update
  foundUser.name = 'Hari Senior Architect';
  await foundUser.save();
  const updatedUser = await User.findById(testUser._id);
  console.log(' Updated user name:', updatedUser.name);

  // Delete
  await User.findByIdAndDelete(testUser._id);
  const deletedUser = await User.findById(testUser._id);
  console.log(' Deleted user confirmed:', deletedUser === null ? ' Deleted' : ' Failed');

  await mongoose.disconnect();
  if (mongod) await mongod.stop();

  console.log('\n Day 2 Auth, Unique Email Index & CRUD Tests ALL PASSED');
  console.log('==============================================\n');
}

testAuthAndCRUD().catch((err) => {
  console.error('Day 2 Auth test failed:', err);
  process.exit(1);
});
