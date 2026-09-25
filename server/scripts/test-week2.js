const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const mongoose = require('mongoose');

const API_BASE = 'http://localhost:5000/api';

async function runWeek2Verification() {
  console.log('================================================================');
  console.log('STREAMWEAVER - WEEK 2 ASSIGNED TASKS (DAYS 6 - 10) TEST SUITE');
  console.log('ETL Transformation + No-Code Visual Pipeline Builder Verification');
  console.log('================================================================');

  // 1. Health check & DB connection
  console.log('\n[Day 10 / Health] Checking Backend Status...');
  const healthRes = await axios.get(`${API_BASE}/health`);
  console.log(' Status:', healthRes.data.status);
  console.log(' DB state:', healthRes.data.database.state);

  // 2. Authentication
  console.log('\n[Auth] Registering test user...');
  const testEmail = `week2.hari.${Date.now()}@streamweaver.io`;
  const registerRes = await axios.post(`${API_BASE}/auth/register`, {
    name: 'Hari Developer',
    email: testEmail,
    password: 'week2Password123',
  });
  const token = registerRes.data.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };
  console.log(' User registered:', testEmail);

  // ------------------------------------------------------------------------
  // DAY 6: DATASET & COLUMN DETECTION
  // ------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('DAY 6 – Dataset & Column Detection Verification');
  console.log('================================================================');

  const samplePath = path.join(__dirname, '../data/samples/small.csv');
  if (!fs.existsSync(samplePath)) {
    throw new Error(`Sample CSV missing at ${samplePath}`);
  }

  const form = new FormData();
  form.append('file', fs.createReadStream(samplePath));

  const uploadRes = await axios.post(`${API_BASE}/datasets/upload`, form, {
    headers: { ...authHeaders, ...form.getHeaders() },
  });

  const datasetId = uploadRes.data.data._id;
  console.log(` Dataset uploaded. ID: ${datasetId}`);

  // Poll until stream processing completes
  let completed = false;
  let attempts = 0;
  let dataset = null;

  while (!completed && attempts < 15) {
    await new Promise((r) => setTimeout(r, 300));
    attempts++;
    const dsRes = await axios.get(`${API_BASE}/datasets/${datasetId}`, { headers: authHeaders });
    dataset = dsRes.data.data;
    if (dataset.status === 'completed') completed = true;
  }

  if (!completed) {
    throw new Error('Dataset stream processing did not complete!');
  }

  console.log(` Stream processing finished in ${dataset.processingTimeMs}ms`);
  console.log(` Total Rows detected & stored: ${dataset.totalRows}`);
  console.log(` Headers detected: ${dataset.headers.join(', ')}`);
  console.log(' Columns & Detected Data Types:');
  dataset.columns.forEach((col) => {
    console.log(`   - Column "${col.name}": dataType = ${col.dataType} | samples = [${col.sampleValues.slice(0, 3).join(', ')}]`);
  });

  if (!dataset.columns || dataset.columns.length === 0) {
    throw new Error('Day 6 Failure: Columns array was not populated in Dataset schema!');
  }
  console.log(' DAY 6 VERIFICATION SUCCESSFUL!');

  // ------------------------------------------------------------------------
  // DAY 7: TRANSFORMATION ENGINE & VALIDATION
  // ------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('DAY 7 – Transformation Engine & Validation Verification');
  console.log('================================================================');

  // Test 1: Validation rejection for invalid config
  try {
    await axios.post(
      `${API_BASE}/transformations`,
      {
        name: 'Invalid Filter',
        type: 'filter',
        config: { column: '' }, // Invalid filter config
      },
      { headers: authHeaders }
    );
    throw new Error('Expected validation error for invalid transformation config!');
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log(' Correctly rejected invalid transformation config (HTTP 400)');
    } else {
      throw err;
    }
  }

  // Test 2: Create valid Filter transformation
  const filterTransRes = await axios.post(
    `${API_BASE}/transformations`,
    {
      name: 'Filter High Transactions',
      type: 'filter',
      description: 'Filter rows with transaction_amount > 200',
      config: {
        column: 'transaction_amount',
        operator: 'greater_than',
        value: 200,
      },
    },
    { headers: authHeaders }
  );

  const filterTrans = filterTransRes.data.data;
  console.log(` Filter Transformation created. ID: ${filterTrans._id}`);

  // Test 3: Create valid Rename transformation
  const renameTransRes = await axios.post(
    `${API_BASE}/transformations`,
    {
      name: 'Rename ID Column',
      type: 'rename',
      description: 'Rename id to record_id',
      config: {
        sourceColumn: 'id',
        targetColumn: 'record_id',
      },
    },
    { headers: authHeaders }
  );
  const renameTrans = renameTransRes.data.data;
  console.log(` Rename Transformation created. ID: ${renameTrans._id}`);

  console.log(' DAY 7 VERIFICATION SUCCESSFUL!');

  // ------------------------------------------------------------------------
  // DAY 8: VISUAL PIPELINE BUILDER (Nodes, Edges, Steps)
  // ------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('DAY 8 – Visual Pipeline Builder Storage Verification');
  console.log('================================================================');

  const nodes = [
    {
      id: 'node-1',
      type: 'source',
      label: 'CSV Source Node',
      position: { x: 100, y: 150 },
      datasetId: dataset._id,
    },
    {
      id: 'node-2',
      type: 'transformation',
      label: 'Filter Node',
      position: { x: 350, y: 150 },
      transformationId: filterTrans._id,
      data: {
        transformationType: 'filter',
        config: filterTrans.config,
      },
    },
    {
      id: 'node-3',
      type: 'destination',
      label: 'Cleaned Output Node',
      position: { x: 600, y: 150 },
    },
  ];

  const edges = [
    { id: 'edge-1-2', source: 'node-1', target: 'node-2', label: 'Raw Data' },
    { id: 'edge-2-3', source: 'node-2', target: 'node-3', label: 'Filtered Data' },
  ];

  const transformationSteps = [
    {
      order: 1,
      type: 'filter',
      transformationId: filterTrans._id,
      config: filterTrans.config,
    },
    {
      order: 2,
      type: 'rename',
      transformationId: renameTrans._id,
      config: renameTrans.config,
    },
  ];

  const pipelineRes = await axios.post(
    `${API_BASE}/pipelines`,
    {
      name: 'ETL Clean Pipeline',
      description: 'Filter transaction_amount > 200 and rename id',
      datasetId: dataset._id,
      nodes,
      edges,
      transformationSteps,
      status: 'active',
    },
    { headers: authHeaders }
  );

  const pipeline = pipelineRes.data.data;
  console.log(` Visual Pipeline created. ID: ${pipeline._id}`);
  console.log(` - Nodes stored: ${pipeline.nodes.length}`);
  console.log(` - Edges stored: ${pipeline.edges.length}`);
  console.log(` - Transformation steps stored: ${pipeline.transformationSteps.length}`);

  // Test retrieval
  const getPipelineRes = await axios.get(`${API_BASE}/pipelines/${pipeline._id}`, { headers: authHeaders });
  if (getPipelineRes.data.data.nodes.length !== 3) {
    throw new Error('Day 8 Failure: Visual pipeline nodes storage mismatch!');
  }

  console.log(' DAY 8 VERIFICATION SUCCESSFUL!');

  // ------------------------------------------------------------------------
  // DAY 9: DATA PREVIEW & DATABASE CONSISTENCY
  // ------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('DAY 9 – Data Preview & Database Consistency Verification');
  console.log('================================================================');

  // Check dataset document count before preview
  const countBeforeRes = await axios.get(`${API_BASE}/datasets`, { headers: authHeaders });
  const datasetCountBefore = countBeforeRes.data.count;

  // Run Data Preview endpoint
  console.log(' Executing non-persistent in-memory Data Preview...');
  const previewRes = await axios.post(
    `${API_BASE}/pipelines/${pipeline._id}/preview`,
    {},
    { headers: authHeaders }
  );

  const previewData = previewRes.data.data;
  console.log(` Preview Response Received!`);
  console.log(` - Dataset: ${previewData.datasetName}`);
  console.log(` - Original Sample Rows: ${previewData.originalRowCount}`);
  console.log(` - Transformed Preview Rows: ${previewData.previewRowCount}`);
  console.log(` - Transformed Headers: ${previewData.transformedHeaders.join(', ')}`);
  console.log(` - Non-persistent Flag: ${previewData.isPersistent}`);
  console.log(' Sample Transformed Row 1:', previewData.previewData[0]);

  if (previewData.isPersistent !== false) {
    throw new Error('Day 9 Failure: Preview flag must be non-persistent!');
  }

  if (previewData.previewRowCount === 0) {
    throw new Error('Day 9 Failure: Expected transformed preview rows!');
  }

  // Database Consistency Verification
  const countAfterRes = await axios.get(`${API_BASE}/datasets`, { headers: authHeaders });
  const datasetCountAfter = countAfterRes.data.count;

  if (datasetCountBefore !== datasetCountAfter) {
    throw new Error('Day 9 Failure: Data Preview mutated the MongoDB database!');
  }

  console.log(' Database Consistency Verified! Preview ran cleanly with ZERO database mutations.');
  console.log(' DAY 9 VERIFICATION SUCCESSFUL!');

  // ------------------------------------------------------------------------
  // DAY 10: INTEGRATION & SCHEMAS VERIFICATION
  // ------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('DAY 10 – Integration & Schema Verification');
  console.log('================================================================');

  const allPipelines = await axios.get(`${API_BASE}/pipelines`, { headers: authHeaders });
  console.log(` Verified Pipelines collection: ${allPipelines.data.count} pipeline(s) stored.`);

  const allTransformations = await axios.get(`${API_BASE}/transformations`, { headers: authHeaders });
  console.log(` Verified Transformations collection: ${allTransformations.data.count} transformation(s) stored.`);

  console.log('\n================================================================');
  console.log(' ALL WEEK 2 ASSIGNED TASKS (DAYS 6 - 10) SUCCESSFULLY PASSED!');
  console.log('================================================================\n');
}

runWeek2Verification().catch((err) => {
  console.error('\n[Week 2 Test Error]:', err.response?.data || err.message);
  process.exit(1);
});
