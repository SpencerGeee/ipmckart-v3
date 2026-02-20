// jest.setup.js (in project root)
process.env.NODE_ENV = 'test';
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  
  process.env.PORT = '0'; // Random port
  console.log('Global test setup: In-memory MongoDB connected'); // Debug log
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('Global test teardown: In-memory MongoDB disconnected'); // Debug log
});