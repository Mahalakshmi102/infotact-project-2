const fs = require('fs');
const csv = require('csv-parser');
const Dataset = require('../models/Dataset');
const mongoose = require('mongoose');

/**
 * Infer the best matching data type for a string value
 * @param {string} val 
 * @returns {string} 'integer' | 'float' | 'boolean' | 'date' | 'string'
 */
function detectValueType(val) {
  if (val === null || val === undefined || val.trim() === '') return null;
  const str = val.trim();

  // Pure Integer check
  if (/^-?\d+$/.test(str)) {
    return 'integer';
  }

  // Float check
  if (/^-?\d+\.\d+$/.test(str)) {
    return 'float';
  }

  // Boolean check
  if (/^(true|false|yes|no)$/i.test(str)) {
    return 'boolean';
  }

  // Date check (ISO string or standard date formats)
  if ((str.includes('-') || str.includes('/') || str.includes('T')) && !isNaN(Date.parse(str)) && str.length >= 6) {
    return 'date';
  }

  return 'string';
}

/**
 * Infer overall column data type from detected sample type counts using majority threshold (>= 75%)
 * @param {Object} typeCounts 
 * @returns {string}
 */
function inferColumnType(typeCounts) {
  const total = Object.values(typeCounts).reduce((a, b) => a + b, 0);
  if (total === 0) return 'string';

  if (typeCounts.integer / total >= 0.75) return 'integer';
  if ((typeCounts.float + typeCounts.integer) / total >= 0.75 && typeCounts.float > 0) return 'float';
  if (typeCounts.boolean / total >= 0.75) return 'boolean';
  if (typeCounts.date / total >= 0.75) return 'date';

  return 'string';
}

/**
 * Process a CSV file using native Node.js streams.
 * Computes total row count, detects column headers, infers data types,
 * tracks duration, and updates Dataset metadata in MongoDB without buffering the file into memory.
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
    const columnStats = {};

    const readStream = fs.createReadStream(filePath);
    const parser = csv();

    parser.on('headers', (detectedHeaders) => {
      headers = detectedHeaders;
      headers.forEach((h) => {
        columnStats[h] = {
          sampleValues: [],
          nullCount: 0,
          typeCounts: { integer: 0, float: 0, boolean: 0, date: 0, string: 0 },
        };
      });
      console.log(`[StreamProcessor] Detected headers (${headers.length}):`, headers);
    });

    parser.on('data', (row) => {
      rowCount++;

      // Collect column stats from initial rows (up to 200 rows sampled for type detection)
      headers.forEach((h) => {
        const val = row[h];
        const stats = columnStats[h];

        if (val === undefined || val === null || String(val).trim() === '') {
          stats.nullCount++;
        } else {
          const strVal = String(val).trim();
          if (stats.sampleValues.length < 5) {
            stats.sampleValues.push(strVal);
          }

          if (rowCount <= 200) {
            const type = detectValueType(strVal);
            if (type && stats.typeCounts[type] !== undefined) {
              stats.typeCounts[type]++;
            }
          }
        }
      });

      // Log progress periodically for large files (every 50,000 rows)
      if (rowCount % 50000 === 0) {
        const currentMemMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        console.log(`[StreamProcessor] Streamed ${rowCount.toLocaleString()} rows | Memory: ${currentMemMB} MB | DB state: ${mongoose.connection.readyState === 1 ? 'Healthy' : 'Issue'}`);
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

      // Construct columns metadata array with inferred types
      const columns = headers.map((h) => {
        const stats = columnStats[h] || { sampleValues: [], nullCount: 0, typeCounts: {} };
        const inferredType = inferColumnType(stats.typeCounts || {});
        return {
          name: h,
          dataType: inferredType,
          sampleValues: stats.sampleValues,
          nullCount: stats.nullCount,
        };
      });

      console.log(`[StreamProcessor] Stream completed: ${rowCount.toLocaleString()} rows in ${processingTime}ms. Columns detected: ${columns.length}`);

      try {
        const updatedDataset = await Dataset.findByIdAndUpdate(
          datasetId,
          {
            status: 'completed',
            totalRows: rowCount,
            headers: headers,
            columns: columns,
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

    // Pipe native read stream into CSV parser
    readStream.pipe(parser);
  });
}

module.exports = {
  processCsvStream,
};
