const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';
let token = '';
let testClientId = '';
let testGoalId = '';

console.log('==================================================');
console.log('🧪 SIDE HUSTLE REVENUE DASHBOARD — FULL API TEST');
console.log('==================================================\n');

async function runTests() {
  try {
    // ----------------------------------------------------
    // TEST 1: Register a new test user
    // ----------------------------------------------------
    console.log('Test 1: Registering new test user...');
    const registerEmail = `tester_${Date.now()}@example.com`;
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test Runner',
      email: registerEmail,
      password: 'password123',
      businessName: 'Automation Testing',
      currency: 'USD'
    });
    console.log('✅ User registered successfully. isVerified:', regRes.data.isVerified);

    // ----------------------------------------------------
    // TEST 2: Retrieve verification code from local_db.json
    // ----------------------------------------------------
    console.log('\nTest 2: Retrieving OTP verification code from local DB...');
    const dbPath = path.join(__dirname, 'local_db.json');
    if (!fs.existsSync(dbPath)) {
      throw new Error('local_db.json not found! Is the server running in Local DB mode?');
    }
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const userInDb = db.users.find(u => u.email === registerEmail);
    if (!userInDb) {
      throw new Error(`User ${registerEmail} not found in local_db.json`);
    }
    const otpCode = userInDb.verificationCode;
    console.log(`✅ Found OTP verification code in database: ${otpCode}`);

    // ----------------------------------------------------
    // TEST 3: Verify email using the retrieved OTP code
    // ----------------------------------------------------
    console.log('\nTest 3: Verifying email via OTP verification endpoint...');
    const verifyRes = await axios.post(`${API_URL}/auth/verify-email`, {
      email: registerEmail,
      code: otpCode
    });
    console.log('✅ Email verified successfully! Msg:', verifyRes.data.msg);

    // ----------------------------------------------------
    // TEST 4: Log in to obtain JWT Token
    // ----------------------------------------------------
    console.log('\nTest 4: Logging in to get JWT access token...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: registerEmail,
      password: 'password123'
    });
    token = loginRes.data.token;
    console.log('✅ Logged in successfully. Token received:', token.substring(0, 20) + '...');
    
    // Set default auth header for subsequent requests
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // ----------------------------------------------------
    // TEST 5: Inject Realistic Mock Demo Data
    // ----------------------------------------------------
    console.log('\nTest 5: Injecting realistic demo data for charts and reports...');
    const injectRes = await axios.post(`${API_URL}/dashboard/inject-mock-data`, {}, config);
    console.log('✅ Demo data injected successfully! Msg:', injectRes.data.msg);

    // ----------------------------------------------------
    // TEST 6: Get Dashboard Statistics
    // ----------------------------------------------------
    console.log('\nTest 6: Fetching overall dashboard statistics...');
    const statsRes = await axios.get(`${API_URL}/dashboard/stats`, config);
    const stats = statsRes.data.stats;
    console.log('✅ Dashboard stats loaded successfully:');
    console.log(`   - Total Transactions: ${stats.totalTransactions}`);
    console.log(`   - Total Revenue: $${stats.totalRevenue}`);
    console.log(`   - Total Expenses: $${stats.totalExpenses}`);
    console.log(`   - Pending Invoices: ${stats.pendingInvoices}`);

    // ----------------------------------------------------
    // TEST 7: Clients CRM Ledger & Margins
    // ----------------------------------------------------
    console.log('\nTest 7: Auditing Clients CRM ledger and margin analytics...');
    const clientsRes = await axios.get(`${API_URL}/clients`, config);
    console.log(`✅ Loaded clients successfully. Count: ${clientsRes.data.length}`);
    
    // Add a new client
    const newClientRes = await axios.post(`${API_URL}/clients`, {
      name: 'Apex Gigs Corp',
      email: 'contact@apexgigs.com',
      phone: '+1 555 777 9999',
      company: 'Apex Consulting'
    }, config);
    testClientId = newClientRes.data._id;
    console.log(`✅ Added new client successfully. ID: ${testClientId}, Name: ${newClientRes.data.name}`);

    // Edit client details (representing the Edit details form update)
    const editClientRes = await axios.put(`${API_URL}/clients/${testClientId}`, {
      name: 'Apex Gigs Corp (Updated)',
      email: 'contact@apexgigs.com',
      phone: '+1 555 777 9999',
      company: 'Apex Consulting Inc',
      address: '777 Consulting Lane',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'USA',
      notes: 'Premium contract partner for React UI development.'
    }, config);
    console.log(`✅ Edited client details successfully. New Company: ${editClientRes.data.company}`);

    // Get margins
    const marginsRes = await axios.get(`${API_URL}/clients/margins`, config);
    console.log('✅ Client margins aggregated successfully! Margin counts:', Object.keys(marginsRes.data).length);

    // ----------------------------------------------------
    // TEST 8: Transactions List & Skip/Limit Pagination
    // ----------------------------------------------------
    console.log('\nTest 8: Verifying Transactions skip/limit pagination...');
    const txRes = await axios.get(`${API_URL}/transactions?page=1&limit=5`, config);
    console.log(`✅ Transactions loaded successfully. Page: ${txRes.data.page}, Limit: ${txRes.data.limit}, Total: ${txRes.data.total}`);
    
    const summaryRes = await axios.get(`${API_URL}/transactions/summary`, config);
    console.log(`✅ Transactions summary computed: Balance: $${summaryRes.data.balance}, Savings Rate: ${summaryRes.data.savingsRate}%`);

    // ----------------------------------------------------
    // TEST 8b: Create an Income Transaction via API
    // ----------------------------------------------------
    console.log('\nTest 8b: Creating an Income Transaction via API...');
    const newIncomeRes = await axios.post(`${API_URL}/transactions`, {
      type: 'income',
      amount: 450,
      description: 'E2E Testing Income',
      date: new Date().toISOString(),
      category: 'freelance',
      paymentMethod: 'bank'
    }, config);
    console.log(`✅ Income transaction created successfully. ID: ${newIncomeRes.data._id}, Amount: $${newIncomeRes.data.amount}`);

    // ----------------------------------------------------
    // TEST 8c: Create an Expense Transaction via API
    // ----------------------------------------------------
    console.log('\nTest 8c: Creating an Expense Transaction via API...');
    const newExpenseRes = await axios.post(`${API_URL}/transactions`, {
      type: 'expense',
      amount: 120,
      description: 'E2E Testing Expense',
      date: new Date().toISOString(),
      category: 'rent',
      paymentMethod: 'card',
      taxCategory: 'Rent or Lease (Vehicles/Real Estate)'
    }, config);
    console.log(`✅ Expense transaction created successfully. ID: ${newExpenseRes.data._id}, Amount: $${newExpenseRes.data.amount}`);

    // ----------------------------------------------------
    // TEST 9: Goals & Progress Tracking
    // ----------------------------------------------------
    console.log('\nTest 9: Testing recurring Goals creation and progress milestones...');
    const newGoalRes = await axios.post(`${API_URL}/goals`, {
      name: 'Q2 Profit Target',
      targetAmount: 8000,
      frequency: 'monthly',
      startDate: new Date().toISOString()
    }, config);
    testGoalId = newGoalRes.data._id;
    console.log(`✅ Added new active goal: ${newGoalRes.data.name}, Target: $${newGoalRes.data.targetAmount}`);

    const goalsRes = await axios.get(`${API_URL}/goals`, config);
    console.log(`✅ Active goals loaded successfully. Count: ${goalsRes.data.goals.length}`);

    const progressRes = await axios.get(`${API_URL}/goals/progress`, config);
    console.log(`✅ Goals progress matching matched: Count: ${progressRes.data.goals.length}`);
    if (progressRes.data.goals.length > 0) {
      console.log(`   - Sample Goal Progress: "${progressRes.data.goals[0].name}" is ${progressRes.data.goals[0].progress.toFixed(1)}% achieved`);
    }

    // ----------------------------------------------------
    // TEST 10: Reports Charts Aggregations
    // ----------------------------------------------------
    console.log('\nTest 10: Verifying monthly revenue breakdown reports data...');
    const monthlyRes = await axios.get(`${API_URL}/dashboard/revenue-monthly`, config);
    console.log(`✅ Recharts monthly breakdown loaded successfully. Months count: ${monthlyRes.data.length}`);
    console.log(`   - Sample month: ${monthlyRes.data[0].month} (Revenue: $${monthlyRes.data[0].revenue}, Expenses: $${monthlyRes.data[0].expenses})`);

    console.log('\n==================================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! EVERYTHING WORKS!');
    console.log('==================================================');
  } catch (err) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    if (err.response) {
      console.error(`   Status: ${err.response.status}`);
      console.error('   Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(`   Msg: ${err.message}`);
    }
    process.exit(1);
  }
}

runTests();
