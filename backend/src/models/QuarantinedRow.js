const mongoose = require('mongoose');

const quarantinedRowSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EtlJob',
        required: true,
        index: true
    },
    rowIndex: {
        type: Number,
        required: true
    },
    originalData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    errors: [{
        field: String,
        rule: String,
        message: String,
        value: mongoose.Schema.Types.Mixed
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    suppressReservedKeysWarning: true
});

module.exports = mongoose.model('QuarantinedRow', quarantinedRowSchema);
