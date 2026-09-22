const path = require('path');
const fs = require('fs');
const Dataset = require('../models/Dataset');
const { processCsvStream } = require('../services/streamProcessor');

/**
 * @desc    Upload a new dataset and trigger streaming processor
 * @route   POST /api/datasets/upload
 * @access  Private
 */
const uploadDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a CSV file.',
      });
    }

    const { originalname, filename, size, mimetype, path: filePath } = req.file;

    // Create dataset record in MongoDB with initial status 'pending'
    const dataset = await Dataset.create({
      fileName: filename,
      originalName: originalname,
      fileSize: size,
      fileType: mimetype || 'text/csv',
      filePath: filePath,
      uploadedBy: req.user._id,
      status: 'pending',
    });

    // Start native Node.js stream processing asynchronously so response is fast
    // (Or await if file is small; we launch streaming and let it update DB status)
    processCsvStream(dataset._id, filePath).catch((err) => {
      console.error(`[Upload] Background stream processing failed for ${dataset._id}:`, err);
    });

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully, stream processing initiated.',
      data: dataset,
    });
  } catch (error) {
    console.error('[Upload] Error in uploadDataset:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get all datasets for current user
 * @route   GET /api/datasets
 * @access  Private
 */
const getDatasets = async (req, res) => {
  try {
    const datasets = await Dataset.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: datasets.length,
      data: datasets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get single dataset by ID
 * @route   GET /api/datasets/:id
 * @access  Private
 */
const getDatasetById = async (req, res) => {
  try {
    const dataset = await Dataset.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    });

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: dataset,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete a dataset and remove its physical file
 * @route   DELETE /api/datasets/:id
 * @access  Private
 */
const deleteDataset = async (req, res) => {
  try {
    const dataset = await Dataset.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    });

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found',
      });
    }

    // Try deleting physical file if exists
    if (dataset.filePath && fs.existsSync(dataset.filePath)) {
      try {
        fs.unlinkSync(dataset.filePath);
      } catch (err) {
        console.warn(`[Delete] Could not delete physical file: ${err.message}`);
      }
    }

    await Dataset.findByIdAndDelete(dataset._id);

    return res.status(200).json({
      success: true,
      message: 'Dataset removed successfully',
      data: {},
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  uploadDataset,
  getDatasets,
  getDatasetById,
  deleteDataset,
};
