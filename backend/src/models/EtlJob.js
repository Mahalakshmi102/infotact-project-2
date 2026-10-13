const mongoose = require('mongoose');

const etlJobSchema = new mongoose.Schema({
    datasetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dataset'
    },
    fileName: {
        type: String,
        default: 'Streaming Upload'
    },
    targetCollection: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mappings: [{
        sourceField: String,
        targetField: String,
        targetType: {
            type: String,
            enum: ['string', 'number', 'boolean', 'date', 'json', 'none'],
            default: 'string'
        },
        transformType: {
            type: String,
            enum: ['direct', 'trim', 'uppercase', 'lowercase', 'round', 'custom_js'],
            default: 'direct'
        },
        customJs: {
            type: String,
            default: ''
        },
        validation: {
            required: { type: Boolean, default: false },
            notEmpty: { type: Boolean, default: false },
            isEmail: { type: Boolean, default: false },
            min: { type: Number },
            max: { type: Number },
            regexPattern: { type: String, default: '' }
        }
    }],
    batchSize: {
        type: Number,
        default: 5000
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Cancelled'],
        default: 'Pending'
    },
    totalRows: {
        type: Number,
        default: 0
    },
    validRows: {
        type: Number,
        default: 0
    },
    quarantinedRows: {
        type: Number,
        default: 0
    },
    batchesProcessed: {
        type: Number,
        default: 0
    },
    durationMs: {
        type: Number,
        default: 0
    },
    rowsPerSecond: {
        type: Number,
        default: 0
    },
    peakHeapMB: {
        type: Number,
        default: 0
    },
    peakRssMB: {
        type: Number,
        default: 0
    },
    errorMessage: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    }
});

module.exports = mongoose.model('EtlJob', etlJobSchema);
