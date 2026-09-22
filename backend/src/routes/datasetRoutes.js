const express = require("express");

const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const {
    uploadDataset
} = require("../controllers/datasetController");

// POST /api/datasets/upload
router.post(
    "/upload",
    upload.single("file"),
    uploadDataset
);

module.exports = router;