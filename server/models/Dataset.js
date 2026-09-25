const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dataType: {
      type: String,
      enum: ['string', 'integer', 'float', 'number', 'boolean', 'date', 'unknown'],
      default: 'string',
    },
    sampleValues: {
      type: [String],
      default: [],
    },
    nullCount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

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
    columns: {
      type: [columnSchema],
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

// Compound and field indexes for fast querying & column searches
datasetSchema.index({ uploadedBy: 1, createdAt: -1 });
datasetSchema.index({ uploadedBy: 1, status: 1 });
datasetSchema.index({ 'columns.name': 1 });

module.exports = mongoose.model('Dataset', datasetSchema);
