const fs = require('fs');
const csv = require('csv-parser');
const Dataset = require('../models/Dataset');
const mongoose = require('mongoose');

/**
 * Process a CSV file using native Node.js streams.
 * Computes total row count, detects column headers, tracks duration,
 * and updates Dataset metadata in MongoDB without buffering the file into memory.
 * 
 * @param {string} datasetId - MongoDB Dataset ObjectId
 * @param {string} filePath - Absolute path to uploaded file
 * @returns {Promise<Object>} Processed dataset document
 */
async function processCsvStream(datasetId, filePath) {
  const startTime = Date.now();
  console.log(`[StreamProcessor] Starting stream processing for Dataset: ${datasetId}`);

  // Update status to processing
  await Dataset.findByIdAndUpdate(datasetId, { status: 'processing' });

  return new Promise((resolve, reject) => {
    let rowCount = 0;
    let headers = [];
    let initialMemory = process.memoryUsage().heapUsed;

    const readStream = fs.createReadStream(filePath);
    const parser = csv();

    parser.on('headers', (detectedHeaders) => {
      headers = detectedHeaders;
      console.log(`[StreamProcessor] Detected headers (${headers.length}):`, headers);
    });

    parser.on('data', (row) => {
      rowCount++;
      // Log progress periodically for large files (every 50,000 rows)
      if (rowCount % 50000 === 0) {
        const currentMemMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        console.log(`[StreamProcessor] Streamed ${rowCount.toLocaleString()} rows | Memory: ${currentMemMB} MB | DB state: ${mongoose.connection.readyState === 1 ? 'Healthy (connected)' : 'Issue'}`);
      }
    });

    parser.on('error', async (error) => {
      console.error(`[StreamProcessor] Error streaming CSV:`, error.message);
      const processingTime = Date.now() - startTime;
      await Dataset.findByIdAndUpdate(datasetId, {
        status: 'failed',
        errorMessage: error.message,
        processingTimeMs: processingTime,
      });
      reject(error);
    });

    parser.on('end', async () => {
      const processingTime = Date.now() - startTime;
      const finalMemory = process.memoryUsage().heapUsed;
      const memDeltaMB = ((finalMemory - initialMemory) / 1024 / 1024).toFixed(2);

      console.log(`[StreamProcessor] Stream completed: ${rowCount.toLocaleString()} rows in ${processingTime}ms. Heap delta: ${memDeltaMB} MB`);

      try {
        const updatedDataset = await Dataset.findByIdAndUpdate(
          datasetId,
          {
            status: 'completed',
            totalRows: rowCount,
            headers: headers,
            processingTimeMs: processingTime,
          },
          { new: true }
        );
        resolve(updatedDataset);
      } catch (dbErr) {
        console.error('[StreamProcessor] Failed to persist dataset metadata:', dbErr);
        reject(dbErr);
      }
    });

    // Pipe the native read stream into the CSV parser stream
    readStream.pipe(parser);
  });
}

module.exports = {
  processCsvStream,
};
