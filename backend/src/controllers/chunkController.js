
const fs = require("node:fs/promises");
const path = require("node:path");

const { getCsvChunk } = require("../services/chunkService");

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
const DEFAULT_LIMIT = 1000;
const MAX_LIMIT = 5000;

async function getDatasetChunk(req, res) {
  try {
    const { id } = req.params;

    // Accept only safe dataset identifiers, not file paths.
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid dataset ID"
      });
    }

    const offset = Number(req.query.offset ?? 0);
    const limit = Number(req.query.limit ?? DEFAULT_LIMIT);

    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > MAX_LIMIT
    ) {
      return res.status(400).json({
        success: false,
        message: `Offset must be non-negative and limit must be 1-${MAX_LIMIT}`
      });
    }

    const filePath = path.join(UPLOAD_DIR, `${id}.csv`);

    // Check that the expected dataset file exists.
    await fs.access(filePath);

    const result = await getCsvChunk(filePath, offset, limit);

    res.set("Cache-Control", "private, no-store");

    return res.status(200).json({
      success: true,
      datasetId: id,
      ...result
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({
        success: false,
        message: "Dataset not found"
      });
    }

    console.error("Chunk retrieval failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve dataset chunk"
    });
  }
}

module.exports = { getDatasetChunk };
