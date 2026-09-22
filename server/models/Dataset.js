const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    originalName: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative'],
    },
    fileType: {
      type: String,
      default: 'text/csv',
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    headers: {
      type: [String],
      default: [],
    },
    processingTimeMs: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Provides createdAt & updatedAt
  }
);

// Compound index for querying user datasets ordered by newest first
datasetSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Dataset', datasetSchema);
