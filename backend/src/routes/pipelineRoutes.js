const express = require("express");

const router = express.Router();

const {
  createPipeline,
  getPipelines,
  getPipelineById,
  updatePipeline,
  deletePipeline
} = require("../controllers/pipelineController");

// Create
router.post("/", createPipeline);

// Get all
router.get("/", getPipelines);

// Get by ID
router.get("/:id", getPipelineById);

// Update
router.put("/:id", updatePipeline);

// Delete
router.delete("/:id", deletePipeline);

module.exports = router;