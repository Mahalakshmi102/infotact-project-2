
const fs = require("node:fs");
const csv = require("csv-parser");
const { Transform } = require("node:stream");
const { pipeline } = require("node:stream/promises");

const {
  emitJobProgress,
  emitJobStatus
} = require("../websocket/socketServer");

async function runETL({
  jobId,
  inputPath,
  outputPath,
  totalRows
}) {
  let processedRows = 0;
  let lastReportTime = Date.now();
  let lastReportRows = 0;
  const startTime = Date.now();

  const input = fs.createReadStream(inputPath).pipe(csv());
  const output = fs.createWriteStream(outputPath);

  const transformer = new Transform({
    objectMode: true,

    transform(row, encoding, callback) {
      try {
        // Example transformation: trim all string values.
        const cleanedRow = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            typeof value === "string" ? value.trim() : value
          ])
        );

        processedRows++;

        const now = Date.now();

        // Limit progress broadcasts to roughly twice per second.
        if (now - lastReportTime >= 500) {
          const elapsedSeconds = (now - lastReportTime) / 1000;
          const speed = Math.round(
            (processedRows - lastReportRows) / elapsedSeconds
          );

          const percentage =
            Number.isFinite(totalRows) && totalRows > 0
              ? Math.min(
                  100,
                  Math.round((processedRows / totalRows) * 100)
                )
              : null;

          emitJobProgress(jobId, {
            processedRows,
            totalRows: Number.isFinite(totalRows) ? totalRows : null,
            percentage,
            speed,
            status: "processing"
          });

          lastReportTime = now;
          lastReportRows = processedRows;
        }

        callback(null, JSON.stringify(cleanedRow) + "\n");
      } catch (error) {
        callback(error);
      }
    }
  });

  try {
    emitJobStatus(jobId, "processing", "ETL job started");

    await pipeline(input, transformer, output);

    // Always send the final counts, even if the job finished quickly.
    const elapsedSeconds = Math.max(
      (Date.now() - startTime) / 1000,
      0.001
    );

    emitJobProgress(jobId, {
      processedRows,
      totalRows: Number.isFinite(totalRows) ? totalRows : processedRows,
      percentage: 100,
      speed: Math.round(processedRows / elapsedSeconds),
      status: "completed"
    });

    emitJobStatus(jobId, "completed", "ETL job finished successfully");

    return { jobId, processedRows, status: "completed" };
  } catch (error) {
    emitJobStatus(jobId, "failed", "ETL job failed");

    throw error;
  }
}

module.exports = { runETL };
