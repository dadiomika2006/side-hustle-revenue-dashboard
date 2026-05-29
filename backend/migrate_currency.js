/**
 * Side Hustle Revenue Dashboard — Developer Utility: migrate_currency.js
 * 
 * This CLI tool allows developers and administrators to quickly migrate all registered
 * users in either the offline local JSON database or the live MongoDB Atlas database to
 * default to Indian Rupees (INR) and convert existing transaction currencies accordingly.
 * 
 * Usage: node migrate_currency.js
 */

require('dotenv').config();
const path = require('path');

// Hijack require for mongoose if running in local database fallback mode
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'mongoose' && process.env.USE_LOCAL_DB === 'true') {
    return originalRequire.call(this, path.join(__dirname, 'utils', 'mockMongoose'));
  }
  return originalRequire.apply(this, arguments);
};

const mongoose = require('mongoose');

// Load Models
const User = require('./models/User');
const Transaction = require('./models/Transaction');

async function run() {
  const isLocalMode = process.env.USE_LOCAL_DB === 'true';

  console.log('==================================================');
  console.log('🪙  SIDE HUSTLE REVENUE DASHBOARD — CURRENCY MIGRATOR');
  console.log(`📂 Database Mode: ${isLocalMode ? 'Offline Local File Fallback Mode 💾' : 'Live MongoDB Atlas Cluster Mode 🌐'}`);
  console.log('🔄 Objective: Convert all existing accounts & transactions to default to INR');
  console.log('==================================================');

  try {
    // Connect to database
    if (isLocalMode) {
      await mongoose.connect();
    } else {
      if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is missing in your .env file!');
      }
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Connected to MongoDB Atlas successfully. ✅');
    }

    // 1. Update all users to default to INR
    const userResult = await User.updateMany(
      { $or: [{ currency: { $ne: 'INR' } }, { currency: { $exists: false } }] },
      { $set: { currency: 'INR' } }
    );
    console.log(`\n👤 Users: Successfully updated ${userResult.modifiedCount || userResult.nModified || 0} user profile(s) to INR.`);

    // 2. Update all transactions to default to INR
    const txResult = await Transaction.updateMany(
      { $or: [{ currency: { $ne: 'INR' } }, { currency: { $exists: false } }] },
      { $set: { currency: 'INR' } }
    );
    console.log(`📊 Transactions: Successfully updated ${txResult.modifiedCount || txResult.nModified || 0} transaction(s) to INR.`);

    console.log('--------------------------------------------------');
    console.log('🎉 SUCCESS: Database migrated to Indian Rupees (INR) successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ CRITICAL ERROR during migration:', err.message);
    process.exit(1);
  }
}

run();
