/**
 * Side Hustle Revenue Dashboard — Developer Utility: delete_user.js
 * 
 * This CLI tool allows developers and administrators to quickly and cleanly delete 
 * a registered user and all their associated data (transactions, invoices, clients, 
 * goals, mileage, receipts, tax buckets, etc.) from either the local offline database 
 * or the live MongoDB Atlas cluster.
 * 
 * Usage: node delete_user.js <email>
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
const Client = require('./models/Client');
const Transaction = require('./models/Transaction');
const Invoice = require('./models/Invoice');
const Goal = require('./models/Goal');
const Mileage = require('./models/Mileage');
const Receipt = require('./models/Receipt');
const TaxBucket = require('./models/TaxBucket');
const IncomeStream = require('./models/IncomeStream');
const RecurringTransaction = require('./models/RecurringTransaction');
const Reminder = require('./models/Reminder');

async function run() {
  const emailArg = process.argv[2];
  if (!emailArg) {
    console.error('\n❌ ERROR: Please specify the email address of the user to delete.');
    console.log('Usage: node delete_user.js <email>');
    console.log('Example: node delete_user.js test@example.com\n');
    process.exit(1);
  }

  const targetEmail = emailArg.trim().toLowerCase();
  const isLocalMode = process.env.USE_LOCAL_DB === 'true';

  console.log('==================================================');
  console.log('🧹 SIDE HUSTLE REVENUE DASHBOARD — USER CLEANUP');
  console.log(`📂 Environment Mode: ${isLocalMode ? 'Offline Local File Fallback Mode 💾' : 'Live MongoDB Atlas Cluster Mode 🌐'}`);
  console.log(`📧 Target Account: ${targetEmail}`);
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

    // Find the user
    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      console.log(`\n⚠️  No user account was found with the email: "${targetEmail}"\n`);
      process.exit(0);
    }

    const userId = user._id;
    console.log(`\n👤 User Found: ${user.name}`);
    console.log(`🆔 Database ID: ${userId}`);
    console.log(`💼 Business: ${user.businessName || 'N/A'}`);
    console.log('--------------------------------------------------');
    console.log('Proceeding to delete all associated records...');

    // Perform deletions in parallel
    const [
      txResult,
      invResult,
      clientResult,
      goalResult,
      mileageResult,
      receiptResult,
      taxResult,
      streamResult,
      recurringResult,
      reminderResult,
      userResult
    ] = await Promise.all([
      Transaction.deleteMany({ user: userId }),
      Invoice.deleteMany({ user: userId }),
      Client.deleteMany({ user: userId }),
      Goal.deleteMany({ user: userId }),
      Mileage.deleteMany({ user: userId }),
      Receipt.deleteMany({ user: userId }),
      TaxBucket.deleteMany({ user: userId }),
      IncomeStream.deleteMany({ user: userId }),
      RecurringTransaction.deleteMany({ user: userId }),
      Reminder.deleteMany({ user: userId }),
      User.deleteOne({ _id: userId })
    ]);

    console.log('\n✨ CLEANUP SUMMARY:');
    console.log(`  🗑️  User Account: 1 deleted`);
    console.log(`  📊 Transactions: ${txResult.deletedCount || 0} deleted`);
    console.log(`  🧾 Invoices: ${invResult.deletedCount || 0} deleted`);
    console.log(`  👥 Clients: ${clientResult.deletedCount || 0} deleted`);
    console.log(`  🎯 Goals: ${goalResult.deletedCount || 0} deleted`);
    console.log(`  🚗 Mileage Logs: ${mileageResult.deletedCount || 0} deleted`);
    console.log(`  📁 Uploaded Receipts: ${receiptResult.deletedCount || 0} deleted`);
    console.log(`  📈 Custom Income Streams: ${streamResult.deletedCount || 0} deleted`);
    console.log(`  ⚙️  Recurring Rules: ${recurringResult.deletedCount || 0} deleted`);
    console.log(`  🔔 Reminders & Tasks: ${reminderResult.deletedCount || 0} deleted`);
    console.log(`  💼 Tax Buckets: ${taxResult.deletedCount || 0} deleted`);
    console.log('--------------------------------------------------');
    console.log('🎉 SUCCESS: User and all associated data deleted successfully!\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ CRITICAL ERROR during cleanup:', err.message);
    process.exit(1);
  }
}

run();
