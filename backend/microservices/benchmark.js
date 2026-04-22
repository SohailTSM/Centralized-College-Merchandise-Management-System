const axios = require('axios');
const autocannon = require('autocannon');
const fs = require('fs');

const GATEWAY_URL = 'http://localhost:5000/api';
const AUTH_URL = 'http://localhost:5001/api';

const NUM_USERS = 100;
const CONCURRENCY_LEVELS = [10, 25, 50, 75, 100];
const DURATION = 10; // seconds per test

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const setupUsers = async () => {
  console.log(`\n[SETUP] Provisioning & Logging in ${NUM_USERS} users...`);
  const tokens = [];
  for (let i = 1; i <= NUM_USERS; i++) {
    const user = {
      name: `User ${i}`,
      email: `u${i}@ccmms.college`,
      password: '123456',
      role: 'student',
      rollNumber: `R${i}-${Date.now()}`,
      mobile: `9999990${i.toString().padStart(3, '0')}`,
    };

    try {
      // Ignore 400s if user already exists
      await axios.post(`${AUTH_URL}/auth/register`, user).catch(() => {});
      const loginRes = await axios.post(`${AUTH_URL}/auth/login`, { email: user.email, password: user.password });
      tokens.push(loginRes.data.token);
    } catch (e) {
      console.error(`Failed to setup u${i}:`, e.message);
    }
  }
  console.log(`[SETUP] Successfully acquired ${tokens.length} valid JWT tokens.`);
  return tokens;
};

const runTargetedCannon = (options) => {
  return new Promise((resolve, reject) => {
    const instance = autocannon(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    autocannon.track(instance, { renderProgressBar: true });
  });
};

const executeBenchmarks = async () => {
  console.log('======================================================');
  console.log('   CCMMS APEX LOAD BENCHMARK (Autocannon)             ');
  console.log('======================================================\n');
  
  if (fs.existsSync('apex_benchmark.txt')) fs.unlinkSync('apex_benchmark.txt');
  const logToFile = (msg) => { fs.appendFileSync('apex_benchmark.txt', msg + '\n'); console.log(msg); };

  const tokens = await setupUsers();
  if (tokens.length === 0) return console.log('Fatal: No users initialized.');

  // ============================================
  // READ BENCHMARK (GET /api/merchandise)
  // ============================================
  logToFile('\n======================================================');
  logToFile('   STAGE 1: READ BENCHMARK (Catalog via Gateway)      ');
  logToFile('======================================================');

  // Autocannon will round-robin through these requests, simulating distributed unique users
  const readRequests = tokens.map((token) => ({
    method: 'GET',
    path: '/api/merchandise',
    headers: { Authorization: `Bearer ${token}` }
  }));

  for (const concurrency of CONCURRENCY_LEVELS) {
    logToFile(`\n--- Concurrency: ${concurrency} | Duration: ${DURATION}s ---`);
    const options = {
      url: 'http://localhost:5000',
      connections: concurrency,
      pipelining: 1,
      duration: DURATION,
      requests: readRequests,
    };

    const result = await runTargetedCannon(options);
    logToFile(`Throughput: ${result.requests.mean.toFixed(2)} req/sec`);
    logToFile(`Latency:    ${result.latency.mean.toFixed(2)} ms (Mean) | ${result.latency.p99.toFixed(2)} ms (p99)`);
    logToFile(`Total Req:  ${result.requests.total} | Errors: ${result.errors}`);
    await sleep(2000); // Cooldown to bleed socket queue
  }

  // Set up Write payload parameter
  const targetMerchRes = await axios.get(`${GATEWAY_URL}/merchandise`, { headers: { Authorization: `Bearer ${tokens[0]}` } });
  if (!targetMerchRes.data.items || targetMerchRes.data.items.length === 0) {
    return console.log('\n[!] Skipping Write Benchmark: No merchandise items exist in the database. Please create one manually using club admin.');
  }
  const targetMerch = targetMerchRes.data.items[0];

  // ============================================
  // WRITE BENCHMARK (POST /api/orders)
  // ============================================
  logToFile('\n======================================================');
  logToFile('   STAGE 2: WRITE BENCHMARK (Orders via Gateway)      ');
  logToFile('======================================================');
  logToFile(`Targeting Merchandise ID: ${targetMerch._id} | Price: ${targetMerch.price}`);

  const writeRequests = tokens.map((token) => ({
    method: 'POST',
    path: '/api/orders',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: [{ merchandiseId: targetMerch._id, quantity: 1, size: targetMerch.availableSizes[0] || 'M', price: targetMerch.price }],
      totalAmount: targetMerch.price
    })
  }));

  for (const concurrency of CONCURRENCY_LEVELS) {
    logToFile(`\n--- Concurrency: ${concurrency} | Duration: ${DURATION}s ---`);
    const options = {
      url: 'http://localhost:5000',
      connections: concurrency,
      pipelining: 1,
      duration: DURATION,
      requests: writeRequests,
    };

    const result = await runTargetedCannon(options);
    logToFile(`Throughput: ${result.requests.mean.toFixed(2)} req/sec`);
    logToFile(`Latency:    ${result.latency.mean.toFixed(2)} ms (Mean) | ${result.latency.p99.toFixed(2)} ms (p99)`);
    logToFile(`Total Req:  ${result.requests.total} | Errors: ${result.errors}`);
    await sleep(2000); // Cooldown
  }

  logToFile('\n[✓] Autocannon Benchmarking Suite Complete. Matrix finalized.');
};

executeBenchmarks();
