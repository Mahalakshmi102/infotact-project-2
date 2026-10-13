const mongoose = require('mongoose');
const { handleStreamingUpload } = require('../services/streamingUpload');
const sandboxEngine = require('../services/sandboxService');
const { executeEtlPipeline, runMemoryAuditBenchmark } = require('../services/etlPipeline');
const Dataset = require('../models/Dataset');
const EtlJob = require('../models/EtlJob');
const QuarantinedRow = require('../models/QuarantinedRow');

// 1. Multipart Streaming Upload & 1,000-Row Preview
exports.uploadAndPreview = async (req, res) => {
    try {
        const uploadResult = await handleStreamingUpload(req, 1000);

        const dataset = new Dataset({
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            fileType: uploadResult.fileType,
            headers: uploadResult.headers,
            previewRows: uploadResult.previewRows,
            previewCount: uploadResult.previewCount,
            tempFilePath: uploadResult.tempFilePath,
            uploadedBy: req.user.id
        });

        await dataset.save();

        res.status(201).json({
            success: true,
            msg: 'File streamed successfully. 1,000 row virtual preview ready.',
            dataset: {
                id: dataset._id,
                fileName: dataset.fileName,
                fileSize: dataset.fileSize,
                fileType: dataset.fileType,
                headers: dataset.headers,
                previewRows: dataset.previewRows,
                previewCount: dataset.previewCount,
                createdAt: dataset.createdAt
            }
        });
    } catch (err) {
        console.error('Upload & preview error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 2. Test isolated-vm JS sandbox snippet
exports.testSandbox = async (req, res) => {
    try {
        const { code, sampleValue, sampleRow } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, error: 'JavaScript code is required' });
        }

        const result = sandboxEngine.testSnippet(code, sampleValue, sampleRow);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 3. Start Streaming ETL Pipeline
exports.executeEtl = async (req, res) => {
    try {
        const { datasetId, targetCollection, mappings, batchSize = 5000 } = req.body;

        if (!targetCollection || !targetCollection.trim()) {
            return res.status(400).json({ success: false, error: 'Target MongoDB collection is required' });
        }

        const dataset = await Dataset.findById(datasetId);
        if (!dataset) {
            return res.status(404).json({ success: false, error: 'Dataset not found' });
        }

        // Clean collection name to avoid special characters
        const cleanCollectionName = targetCollection.trim().replace(/[^a-zA-Z0-9_-]/g, '_');

        const job = new EtlJob({
            datasetId: dataset._id,
            fileName: dataset.fileName,
            targetCollection: cleanCollectionName,
            uploadedBy: req.user.id,
            mappings: mappings || [],
            batchSize: Number(batchSize) || 5000,
            status: 'Processing'
        });

        await job.save();

        // Return immediately to frontend so it can connect to WebSocket and monitor live
        res.status(202).json({
            success: true,
            msg: 'Streaming ETL Pipeline initiated',
            jobId: job._id,
            status: job.status
        });

        // Launch streaming pipeline asynchronously in background
        executeEtlPipeline({
            jobId: job._id.toString(),
            filePath: dataset.tempFilePath,
            mappings: job.mappings,
            targetCollection: cleanCollectionName,
            batchSize: job.batchSize,
            fileType: dataset.fileType
        }).catch(err => {
            console.error(`Background ETL Job ${job._id} error:`, err);
        });

    } catch (err) {
        console.error('Execute ETL error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 4. Get all ETL jobs
exports.getJobs = async (req, res) => {
    try {
        const jobs = await EtlJob.find({ uploadedBy: req.user.id }).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. Get specific ETL job
exports.getJobById = async (req, res) => {
    try {
        const job = await EtlJob.findById(req.params.id);
        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.json(job);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 6. Get quarantined rows for error-handling UI layer
exports.getJobErrors = async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const totalErrors = await QuarantinedRow.countDocuments({ jobId: id });
        const errors = await QuarantinedRow.find({ jobId: id })
            .sort({ rowIndex: 1 })
            .skip(skip)
            .limit(limit);

        res.json({
            total: totalErrors,
            page,
            limit,
            totalPages: Math.ceil(totalErrors / limit),
            errors
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 7. Get MongoDB collections list
exports.getCollections = async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionStats = [];

        for (const col of collections) {
            // Ignore system or internal collections
            if (col.name.startsWith('system.') || col.name.startsWith('etl_')) {
                // include etl target collections
            }
            try {
                const count = await mongoose.connection.db.collection(col.name).estimatedDocumentCount();
                collectionStats.push({
                    name: col.name,
                    count
                });
            } catch {
                collectionStats.push({ name: col.name, count: 0 });
            }
        }

        res.json(collectionStats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 8. Query/explore data inside an ingested collection
exports.getCollectionData = async (req, res) => {
    try {
        const { name } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const skip = (page - 1) * limit;

        const collection = mongoose.connection.db.collection(name);
        const total = await collection.estimatedDocumentCount();
        const docs = await collection.find({}).sort({ _importedAt: -1 }).skip(skip).limit(limit).toArray();

        res.json({
            collection: name,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            documents: docs
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 9. Memory Audit Benchmark (proves RAM never exceeds 150MB)
exports.runMemoryAudit = async (req, res) => {
    try {
        const rows = parseInt(req.body.rows) || 100000;
        const result = await runMemoryAuditBenchmark({
            totalRows: rows,
            batchSize: 5000,
            targetCollection: `audit_${Date.now()}`
        });

        res.json(result);
    } catch (err) {
        console.error('Memory audit error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 10. Live memory stats endpoint
exports.getMemoryStats = async (req, res) => {
    const mem = process.memoryUsage();
    res.json({
        heapUsedMB: +(mem.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: +(mem.heapTotal / 1024 / 1024).toFixed(2),
        rssMB: +(mem.rss / 1024 / 1024).toFixed(2),
        externalMB: +(mem.external / 1024 / 1024).toFixed(2),
        maxThresholdMB: 150,
        isSafe: (mem.heapUsed / 1024 / 1024) < 150,
        uptimeSec: +process.uptime().toFixed(1)
    });
};
