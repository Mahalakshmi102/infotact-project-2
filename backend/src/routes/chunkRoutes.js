
const express = require("express");
const router = express.Router();

const {
  getDatasetChunk
} = require("../controllers/chunkController");

router.get("/:id/chunks", getDatasetChunk);

module.exports = router;
