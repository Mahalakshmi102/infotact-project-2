const { Transform, Writable } = require('stream');
const mongoose = require('mongoose');
const sandboxEngine = require('./sandboxService');
const { broadcastJobProgress, broadcastJobEvent } = require('./websocketManager');
const QuarantinedRow = require('../models/QuarantinedRow');
const EtlJob = require('../models/EtlJob');

/**
 * Transform stream that applies column mapping, type casting,
 * isolated-vm sandbox transformation, and validation checks.
 */
class MappingAndValidationTransform extends Transform {
    constructor(options = {}) {
        super({ objectMode: true });
        this.mappings = options.mappings || [];
        this.jobId = options.jobId;
        this.totalRowsRead = 0;
        this.validRowsCount = 0;
        this.quarantinedRowsCount = 0;
        this.quarantineBuffer = [];

        // Precompile custom JS scripts using isolated-vm
        this.compiledSandboxRules = new Map();
        for (const map of this.mappings) {
            if (map.transformType === 'custom_js' && map.customJs && map.customJs.trim()) {
                const compiled = sandboxEngine.compileTransform(map.customJs);
                this.compiledSandboxRules.set(map.sourceField, compiled);
            }
        }
    }

    _transform(chunk, encoding, callback) {
        this.totalRowsRead++;
        const rowIndex = this.totalRowsRead;
        const rowErrors = [];
        const transformedDoc = {};

        // If no explicit mappings provided, pass through cleaned keys
        const mappingsToUse = (this.mappings && this.mappings.length > 0)
            ? this.mappings
            : Object.keys(chunk).map(k => ({
                sourceField: k,
                targetField: k.trim().replace(/[^a-zA-Z0-9_]/g, '_'),
                targetType: 'string',
                transformType: 'direct'
            }));

        for (const mapping of mappingsToUse) {
            const { sourceField, targetField, targetType, transformType, validation } = mapping;
            if (!targetField || targetType === 'none') continue;

            let val = chunk[sourceField];

            // 1. Apply Transformation
            if (transformType === 'trim' && typeof val === 'string') {
                val = val.trim();
            } else if (transformType === 'uppercase' && typeof val === 'string') {
                val = val.toUpperCase();
            } else if (transformType === 'lowercase' && typeof val === 'string') {
                val = val.toLowerCase();
            } else if (transformType === 'round' && (typeof val === 'number' || !isNaN(val))) {
                val = Math.round(Number(val) * 100) / 100;
            } else if (transformType === 'custom_js') {
                const compiled = this.compiledSandboxRules.get(sourceField);
                if (compiled) {
                    const execResult = compiled.run(val, chunk);
                    if (!execResult.success) {
                        rowErrors.push({
                            field: sourceField,
                            rule: 'custom_js',
                            message: `Sandbox JS Execution Error: ${execResult.error}`,
                            value: val
                        });
                    } else {
                        val = execResult.value;
                    }
                }
            }

            // 2. Apply Type Casting
            if (val !== undefined && val !== null && val !== '') {
                try {
                    if (targetType === 'number') {
                        const num = Number(val);
                        if (isNaN(num)) {
                            rowErrors.push({
                                field: sourceField,
                                rule: 'type_cast_number',
                                message: `Cannot cast "${val}" to Number`,
                                value: val
                            });
                        } else {
                            val = num;
                        }
                    } else if (targetType === 'boolean') {
                        val = (val === true || val === 'true' || val === 1 || val === '1');
                    } else if (targetType === 'date') {
                        const d = new Date(val);
                        if (isNaN(d.getTime())) {
                            rowErrors.push({
                                field: sourceField,
                                rule: 'type_cast_date',
                                message: `Cannot cast "${val}" to Date`,
                                value: val
                            });
                        } else {
                            val = d;
                        }
                    } else if (targetType === 'json') {
                        if (typeof val === 'string') {
                            val = JSON.parse(val);
                        }
                    } else if (targetType === 'string') {
                        val = String(val);
                    }
                } catch (castErr) {
                    rowErrors.push({
                        field: sourceField,
                        rule: 'type_cast_error',
                        message: castErr.message,
                        value: val
                    });
                }
            }

            // 3. Validation Rules
            if (validation) {
                if (validation.required && (val === undefined || val === null || val === '')) {
                    rowErrors.push({
                        field: sourceField,
                        rule: 'required',
                        message: `Field is required but was empty`,
                        value: val
                    });
                }
                if (validation.notEmpty && typeof val === 'string' && val.trim() === '') {
                    rowErrors.push({
                        field: sourceField,
                        rule: 'notEmpty',
                        message: `Field cannot be empty whitespace`,
                        value: val
                    });
                }
                if (validation.isEmail && val) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(String(val))) {
                        rowErrors.push({
                            field: sourceField,
                            rule: 'isEmail',
                            message: `Value "${val}" is not a valid email address`,
                            value: val
                        });
                    }
                }
                if (validation.min !== undefined && validation.min !== null && val !== undefined && val !== null) {
                    if (Number(val) < validation.min) {
                        rowErrors.push({
                            field: sourceField,
                            rule: 'min',
                            message: `Value ${val} is less than minimum ${validation.min}`,
                            value: val
                        });
                    }
                }
                if (validation.max !== undefined && validation.max !== null && val !== undefined && val !== null) {
                    if (Number(val) > validation.max) {
                        rowErrors.push({
                            field: sourceField,
                            rule: 'max',
                            message: `Value ${val} is greater than maximum ${validation.max}`,
                            value: val
                        });
                    }
                }
                if (validation.regexPattern && val) {
                    try {
                        const regex = new RegExp(validation.regexPattern);
                        if (!regex.test(String(val))) {
                            rowErrors.push({
                                field: sourceField,
                                rule: 'regexPattern',
                                message: `Value did not match pattern ${validation.regexPattern}`,
                                value: val
                            });
                        }
                    } catch (regErr) {
                        console.warn('Invalid regex provided:', validation.regexPattern);
                    }
                }
            }

            transformedDoc[targetField] = val;
        }

        // Check if row failed validation
        if (rowErrors.length > 0) {
            this.quarantinedRowsCount++;
            this.quarantineBuffer.push({
                jobId: this.jobId,
                rowIndex,
                originalData: chunk,
                errors: rowErrors
            });

            // Flush quarantined rows in batches of 500 to keep memory low
            if (this.quarantineBuffer.length >= 500) {
                const toFlush = this.quarantineBuffer;
                this.quarantineBuffer = [];
                QuarantinedRow.insertMany(toFlush, { ordered: false }).catch(err => {
                    console.error('Error inserting quarantined rows batch:', err.message);
                });
            }

            return callback(); // Drop from valid pipeline stream
        }

        this.validRowsCount++;
        transformedDoc._importedAt = new Date();
        transformedDoc._sourceRowIndex = rowIndex;

        callback(null, transformedDoc);
    }

    _flush(callback) {
        if (this.quarantineBuffer.length > 0) {
            const toFlush = this.quarantineBuffer;
            this.quarantineBuffer = [];
            QuarantinedRow.insertMany(toFlush, { ordered: false })
                .then(() => callback())
                .catch(err => {
                    console.error('Error flushing final quarantined rows:', err.message);
                    callback();
                });
        } else {
            callback();
        }
    }
}

/**
 * Bulk Ingestion Writable Stream that buffers records and triggers
 * MongoDB bulkWrite / insertMany operations every 5,000 records (configurable).
 */
class BulkIngestStream extends Writable {
    constructor(options = {}) {
        super({ objectMode: true });
        this.jobId = options.jobId;
        this.targetCollectionName = options.targetCollectionName;
        this.batchSize = options.batchSize || 5000;
        this.buffer = [];
        this.totalInserted = 0;
        this.batchesProcessed = 0;
        this.startTime = Date.now();
        this.lastEmitTime = Date.now();
        this.lastEmittedCount = 0;
        this.peakHeapMB = 0;
        this.peakRssMB = 0;

        // Dynamic MongoDB collection reference
        this.db = mongoose.connection.db;
        this.collection = this.db.collection(this.targetCollectionName);
    }

    async _write(record, encoding, callback) {
        this.buffer.push(record);

        // Memory profiling check
        const mem = process.memoryUsage();
        const heapUsedMB = +(mem.heapUsed / 1024 / 1024).toFixed(2);
        const rssMB = +(mem.rss / 1024 / 1024).toFixed(2);
        if (heapUsedMB > this.peakHeapMB) this.peakHeapMB = heapUsedMB;
        if (rssMB > this.peakRssMB) this.peakRssMB = rssMB;

        // Flush when buffer reaches batchSize (default 5,000)
        if (this.buffer.length >= this.batchSize) {
            try {
                await this.flushBatch();
                callback();
            } catch (err) {
                callback(err);
            }
        } else {
            // Emit progress updates periodically even within large batches
            const now = Date.now();
            if (now - this.lastEmitTime > 800) { // every 800ms
                this.emitProgress(false);
            }
            callback();
        }
    }

    async flushBatch() {
        if (this.buffer.length === 0) return;

        const recordsToInsert = this.buffer;
        this.buffer = [];

        // Prepare bulk operations for maximum MongoDB throughput
        const bulkOps = recordsToInsert.map(doc => ({
            insertOne: { document: doc }
        }));

        await this.collection.bulkWrite(bulkOps, { ordered: false });

        this.totalInserted += recordsToInsert.length;
        this.batchesProcessed++;

        this.emitProgress(true);
    }

    emitProgress(isBatchCompleted = false) {
        const now = Date.now();
        const elapsedSec = Math.max((now - this.startTime) / 1000, 0.1);
        const currentTotal = this.totalInserted + this.buffer.length;
        const rowsPerSecond = +(currentTotal / elapsedSec).toFixed(1);

        this.lastEmitTime = now;
        this.lastEmittedCount = currentTotal;

        broadcastJobProgress(this.jobId, {
            status: 'Processing',
            validRows: currentTotal,
            batchesProcessed: this.batchesProcessed,
            rowsPerSecond,
            elapsedSec: +elapsedSec.toFixed(1),
            isBatchCompleted,
            peakHeapMB: this.peakHeapMB,
            peakRssMB: this.peakRssMB
        });
    }

    async _final(callback) {
        try {
            if (this.buffer.length > 0) {
                await this.flushBatch();
            }
            callback();
        } catch (err) {
            callback(err);
        }
    }
}

module.exports = {
    MappingAndValidationTransform,
    BulkIngestStream
};
