
const fs = require("node:fs");
const csv = require("csv-parser");

async function getCsvChunk(filePath, offset, limit) {
  const rows = [];
  let rowIndex = 0;

  const stream = fs
    .createReadStream(filePath)
    .pipe(csv());

  try {
    for await (const row of stream) {
      if (rowIndex >= offset) {
        rows.push(row);
      }

      rowIndex++;

      // One extra row tells us whether another chunk exists.
      if (rows.length > limit) {
        break;
      }
    }

    const hasMore = rows.length > limit;

    if (hasMore) {
      rows.pop();
    }

    return {
      data: rows,
      pagination: {
        offset,
        limit,
        returned: rows.length,
        nextOffset: hasMore ? offset + rows.length : null,
        hasMore
      }
    };
  } finally {
    // Also release the file stream if the loop stops early.
    stream.destroy();
  }
}

module.exports = { getCsvChunk };
