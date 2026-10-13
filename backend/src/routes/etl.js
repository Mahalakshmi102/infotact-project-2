const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const etlController = require('../controllers/etlController');

// Streaming upload & 1,000-row preview (multipart handled via busboy directly)
router.post('/preview', auth, etlController.uploadAndPreview);

// Test isolated-vm JS sandbox snippet
router.post('/test-sandbox', auth, etlController.testSandbox);

// Execute Streaming ETL Pipeline
router.post('/execute', auth, etlController.executeEtl);

// ETL Jobs management
router.get('/jobs', auth, etlController.getJobs);
router.get('/jobs/:id', auth, etlController.getJobById);
router.get('/jobs/:id/errors', auth, etlController.getJobErrors);

// MongoDB Ingested Collections Explorer
router.get('/collections', auth, etlController.getCollections);
router.get('/collections/:name/data', auth, etlController.getCollectionData);

// Memory Audit & Live Profiling
router.post('/memory-audit', auth, etlController.runMemoryAudit);
router.get('/memory-stats', etlController.getMemoryStats);

module.exports = router;
