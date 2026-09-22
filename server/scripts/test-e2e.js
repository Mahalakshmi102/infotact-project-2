const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function runEndToEndVerification() {
  console.log('=====================================================');
  console.log('STREAMWEAVER - DAY 5: END-TO-END DEMO FLOW TEST');
  console.log('Demo: Login -> Dashboard -> Upload CSV -> Backend Stream -> MongoDB -> Status');
  console.log('=====================================================');

  // 1. Health check
  console.log('\n[Step 1] Check Backend Health and DB Connection...');
  const healthRes = await axios.get(`${API_BASE}/health`);
  console.log(' Health status:', healthRes.data.status);
  console.log(' DB state:', healthRes.data.database.state);

  // 2. Authentication: Register / Login
  console.log('\n[Step 2] User Authentication...');
  const testEmail = `demo.user.${Date.now()}@streamweaver.io`;
  const registerRes = await axios.post(`${API_BASE}/auth/register`, {
    name: 'Demo Hari',
    email: testEmail,
    password: 'secureDemoPassword123',
  });
  console.log(' User registered:', registerRes.data.data.email);
  const token = registerRes.data.data.token;

  const authHeaders = { Authorization: `Bearer ${token}` };

  // Verify Profile /me
  const meRes = await axios.get(`${API_BASE}/auth/me`, { headers: authHeaders });
  console.log(' Verified authenticated profile for:', meRes.data.data.name);

  // 3. Upload CSV file to trigger streaming processor
  console.log('\n[Step 3] Uploading CSV file (medium.csv) via streaming endpoint...');
  const samplePath = path.join(__dirname, '../data/samples/medium.csv');
  if (!fs.existsSync(samplePath)) {
    throw new Error(`Sample file not found at ${samplePath}`);
  }

  const form = new FormData();
  form.append('file', fs.createReadStream(samplePath));

  const uploadRes = await axios.post(`${API_BASE}/datasets/upload`, form, {
    headers: {
      ...authHeaders,
      ...form.getHeaders(),
    },
  });

  const datasetId = uploadRes.data.data._id;
  console.log(' Dataset created in MongoDB with ID:', datasetId);
  console.log(' Initial upload status:', uploadRes.data.data.status);

  // 4. Poll dataset status until completed (streaming pipeline verification)
  console.log('\n[Step 4] Monitoring stream processing and MongoDB updates...');
  let completed = false;
  let attempts = 0;
  let datasetData = null;

  while (!completed && attempts < 15) {
    await new Promise((r) => setTimeout(r, 400));
    attempts++;
    const statusRes = await axios.get(`${API_BASE}/datasets/${datasetId}`, { headers: authHeaders });
    datasetData = statusRes.data.data;
    console.log(` Attempt ${attempts}: Status = ${datasetData.status} | Rows = ${datasetData.totalRows}`);
    if (datasetData.status === 'completed') {
      completed = true;
    }
  }

  if (!completed) {
    throw new Error('Dataset stream processing did not complete in time!');
  }

  console.log('\n Stream processing successfully finished!');
  console.log(' - Final Status:', datasetData.status);
  console.log(' - Total Rows Counted:', datasetData.totalRows);
  console.log(' - Processing Time:', datasetData.processingTimeMs + 'ms');
  console.log(' - Headers:', datasetData.headers.join(', '));

  // 5. Query user datasets list (as displayed on React dashboard)
  console.log('\n[Step 5] Fetching dashboard dataset list...');
  const listRes = await axios.get(`${API_BASE}/datasets`, { headers: authHeaders });
  console.log(` Retrieved ${listRes.data.count} dataset(s) for user.`);

  console.log('\n=====================================================');
  console.log(' ALL WEEK 1 TASKS & DEMO FLOW SUCCESSFULLY VERIFIED!');
  console.log('=====================================================\n');
}

runEndToEndVerification().catch((err) => {
  console.error('E2E verification failed:', err.response?.data || err.message);
  process.exit(1);
});
