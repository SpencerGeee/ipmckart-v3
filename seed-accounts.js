const Account = require('./models/Account');
const connectDB = require('./db');
require('dotenv').config();

const seedAccounts = async () => {
  await connectDB();

  const accounts = [
    { name: 'Account 1 (Primary)', apiKey: process.env.AI_KEY_1 || 'sk-xxx1', quotaLimit: 1000000, priority: 10 },
    { name: 'Account 2', apiKey: process.env.AI_KEY_2 || 'sk-xxx2', quotaLimit: 500000, priority: 5 },
    { name: 'Account 3', apiKey: process.env.AI_KEY_3 || 'sk-xxx3', quotaLimit: 500000, priority: 5 },
    { name: 'Account 4', apiKey: process.env.AI_KEY_4 || 'sk-xxx4', quotaLimit: 250000, priority: 3 },
    { name: 'Account 5 (Backup)', apiKey: process.env.AI_KEY_5 || 'sk-xxx5', quotaLimit: 100000, priority: 1 }
  ];

  try {
    await Account.deleteMany({});
    await Account.insertMany(accounts);
    console.log('✅ AI Accounts seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding accounts:', error);
    process.exit(1);
  }
};

seedAccounts();
