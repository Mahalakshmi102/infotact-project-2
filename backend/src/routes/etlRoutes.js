
const express = require("express");
const path = require("node:path");
const fs = require("node:fs/promises");
const { randomUUID } = require("node:crypto");

const { runETL } = require("../services/etlService");

const router = express.Router();
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
const OUTPUT_DIR = path.resolve(process.cwd(), "outputs");

router.post("/start", async (req, res) => {
  try {
    const { datasetId, totalRows } = req.body;

    if (
      typeof datasetId !== "string" ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(datasetId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid dataset ID"
      });
    }

    if (
      totalRows !== undefined &&
      (!Number.isSafeInteger(totalRows) || totalRows < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "totalRows must be a non-negative integer"
      });
    }

    // Production: authorize access to datasetId here.
    const inputPath = path.join(UPLOAD_DIR, `${datasetId}.csv`);

    await fs.access(inputPath);
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const jobId = randomUUID();
    const outputPath = path.join(OUTPUT_DIR, `${jobId}.jsonl`);

    // Respond first; the job continues asynchronously.
    res.status(202).json({
      success: true,
      jobId,
      status: "queued",
      message: "ETL job accepted"
    });

    // Always handle the background promise rejection.
    runETL({
      jobId,
      inputPath,
      outputPath,
      totalRows
    }).catch((error) => {
      console.error(`ETL job ${jobId} failed:`, error.message);
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({
        success: false,
        message: "Dataset file not found"
      });
    }

    console.error("Unable to start ETL job:", error.message);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Unable to start ETL job"
      });
    }
  }
});

module.exports = router;
