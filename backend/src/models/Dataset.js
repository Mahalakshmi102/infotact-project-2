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
    headers: [{
        type: String
    }],
    previewRows: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    previewCount: {
        type: Number,
        default: 0
    },
    tempFilePath: {
        type: String,
        default: ''
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Dataset', datasetSchema);
