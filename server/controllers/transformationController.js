const Transformation = require('../models/Transformation');
const { validateTransformationConfig } = require('../services/transformationEngine');

/**
 * @desc    Create a new transformation rule with validation
 * @route   POST /api/transformations
 * @access  Private
 */
const createTransformation = async (req, res) => {
  try {
    const { name, type, description, config, isTemplate } = req.body;

    if (!name || !type || !config) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, and config are required fields.',
      });
    }

    // Validate transformation configuration
    const validation = validateTransformationConfig(type, config);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: `Invalid transformation data: ${validation.message}`,
      });
    }

    const transformation = await Transformation.create({
      name,
      type,
      description: description || '',
      config,
      createdBy: req.user._id,
      isTemplate: Boolean(isTemplate),
    });

    return res.status(201).json({
      success: true,
      message: 'Transformation created successfully',
      data: transformation,
    });
  } catch (error) {
    console.error('[TransformationController] Error creating transformation:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get all transformations for current user (plus system templates)
 * @route   GET /api/transformations
 * @access  Private
 */
const getTransformations = async (req, res) => {
  try {
    const transformations = await Transformation.find({
      $or: [{ createdBy: req.user._id }, { isTemplate: true }],
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: transformations.length,
      data: transformations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get single transformation by ID
 * @route   GET /api/transformations/:id
 * @access  Private
 */
const getTransformationById = async (req, res) => {
  try {
    const transformation = await Transformation.findOne({
      _id: req.params.id,
      $or: [{ createdBy: req.user._id }, { isTemplate: true }],
    });

    if (!transformation) {
      return res.status(404).json({
        success: false,
        message: 'Transformation not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: transformation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update transformation rule
 * @route   PUT /api/transformations/:id
 * @access  Private
 */
const updateTransformation = async (req, res) => {
  try {
    const { name, type, description, config, isTemplate } = req.body;

    const transformation = await Transformation.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!transformation) {
      return res.status(404).json({
        success: false,
        message: 'Transformation not found or unauthorized',
      });
    }

    const updatedType = type || transformation.type;
    const updatedConfig = config || transformation.config;

    // Validate new config
    const validation = validateTransformationConfig(updatedType, updatedConfig);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: `Invalid transformation configuration: ${validation.message}`,
      });
    }

    if (name) transformation.name = name;
    transformation.type = updatedType;
    if (description !== undefined) transformation.description = description;
    transformation.config = updatedConfig;
    if (isTemplate !== undefined) transformation.isTemplate = isTemplate;

    await transformation.save();

    return res.status(200).json({
      success: true,
      message: 'Transformation updated successfully',
      data: transformation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete transformation rule
 * @route   DELETE /api/transformations/:id
 * @access  Private
 */
const deleteTransformation = async (req, res) => {
  try {
    const transformation = await Transformation.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!transformation) {
      return res.status(404).json({
        success: false,
        message: 'Transformation not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transformation deleted successfully',
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
  createTransformation,
  getTransformations,
  getTransformationById,
  updateTransformation,
  deleteTransformation,
};
