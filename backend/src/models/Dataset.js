const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    totalRows: {
        type: Number,
        default: 0
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Uploaded', 'Processing', 'Completed', 'Failed'],
        default: 'Uploaded'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Dataset', datasetSchema);
