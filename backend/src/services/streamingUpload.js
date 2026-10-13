const busboy = require('busboy');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Handle multipart streaming upload via busboy.
 * Saves file directly to disk via stream and captures up to 1,000 preview rows on the fly.
 */
function handleStreamingUpload(req, maxPreviewRows = 1000) {
    return new Promise((resolve, reject) => {
        let isResolved = false;
        const bb = busboy({ headers: req.headers });

        let fileMetadata = null;
        let tempFilePath = '';
        let fileWriteStream = null;
        let previewRows = [];
        let detectedHeaders = [];
        let rowCount = 0;
        let isCsv = true;

        bb.on('file', (name, fileStream, info) => {
            const { filename, mimeType } = info;
            const ext = path.extname(filename).toLowerCase();
            isCsv = ext === '.csv';
            const uniqueFilename = `stream_${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            tempFilePath = path.join(UPLOADS_DIR, uniqueFilename);
            fileWriteStream = fs.createWriteStream(tempFilePath);

            fileMetadata = {
                fileName: filename,
                fileType: isCsv ? 'csv' : 'json',
                mimeType,
                tempFilePath
            };

            // Stream file to disk
            fileStream.pipe(fileWriteStream);

            if (isCsv) {
                // Also pipe into CSV parser for the first 1,000 rows preview
                const parser = csv();
                fileStream.pipe(parser);

                parser.on('headers', (headers) => {
                    detectedHeaders = headers;
                });

                parser.on('data', (row) => {
                    rowCount++;
                    if (previewRows.length < maxPreviewRows) {
                        previewRows.push(row);
                    }
                });

                parser.on('error', (err) => {
                    console.error('CSV preview parsing error:', err);
                });
            } else {
                // JSON handling: buffer small initial chunk to parse preview if JSON
                let jsonBuffer = '';
                fileStream.on('data', (chunk) => {
                    if (previewRows.length === 0 && jsonBuffer.length < 500000) { // first ~500KB
                        jsonBuffer += chunk.toString();
                    }
                });

                fileStream.on('end', () => {
                    try {
                        let parsed = JSON.parse(jsonBuffer);
                        if (Array.isArray(parsed)) {
                            previewRows = parsed.slice(0, maxPreviewRows);
                            if (previewRows.length > 0) {
                                detectedHeaders = Object.keys(previewRows[0]);
                            }
                        } else if (typeof parsed === 'object') {
                            previewRows = [parsed];
                            detectedHeaders = Object.keys(parsed);
                        }
                    } catch (e) {
                        // Might be JSON Lines (NDJSON)
                        try {
                            const lines = jsonBuffer.split('\n').filter(Boolean);
                            previewRows = lines.slice(0, maxPreviewRows).map(l => JSON.parse(l));
                            if (previewRows.length > 0) {
                                detectedHeaders = Object.keys(previewRows[0]);
                            }
                        } catch (ndErr) {
                            console.warn('Could not parse JSON preview:', ndErr.message);
                        }
                    }
                });
            }
        });

        bb.on('finish', () => {
            if (isResolved) return;
            isResolved = true;

            // Wait a tiny tick for file write stream to close
            if (fileWriteStream) {
                fileWriteStream.on('finish', () => {
                    const stats = fs.statSync(tempFilePath);
                    resolve({
                        ...fileMetadata,
                        fileSize: stats.size,
                        headers: detectedHeaders,
                        previewRows,
                        previewCount: previewRows.length,
                        tempFilePath
                    });
                });
            } else {
                reject(new Error('No file provided in request'));
            }
        });

        bb.on('error', (err) => {
            if (isResolved) return;
            isResolved = true;
            reject(err);
        });

        req.pipe(bb);
    });
}

module.exports = {
    handleStreamingUpload
};
