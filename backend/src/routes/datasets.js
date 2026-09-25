const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const datasetController = require('../controllers/datasetController');

// Multer Config
const upload = multer({ dest: 'uploads/' });

router.post('/upload', auth, upload.single('file'), datasetController.uploadDataset);
router.get('/', auth, datasetController.getDatasets);

module.exports = router;
