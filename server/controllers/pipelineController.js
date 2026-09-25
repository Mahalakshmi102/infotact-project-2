const fs = require('fs');
const csv = require('csv-parser');
const Pipeline = require('../models/Pipeline');
const Dataset = require('../models/Dataset');
const Transformation = require('../models/Transformation');
const { executeTransformations, validateTransformationConfig } = require('../services/transformationEngine');

/**
 * Helper to read sample rows from CSV file without loading entire file into memory
 * @param {string} filePath 
 * @param {number} maxRows 
 * @returns {Promise<Array<Object>>}
 */
function readSampleCsvRows(filePath, maxRows = 50) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`Dataset file not found at path: ${filePath}`));
    }

    const rows = [];
    const readStream = fs.createReadStream(filePath);
    const parser = csv();

    let resolved = false;

    parser.on('data', (row) => {
      if (rows.length < maxRows) {
        rows.push(row);
      }
      if (rows.length >= maxRows && !resolved) {
        resolved = true;
        readStream.destroy();
        resolve(rows);
      }
    });

    parser.on('end', () => {
      if (!resolved) {
        resolved = true;
        resolve(rows);
      }
    });

    parser.on('close', () => {
      if (!resolved) {
        resolved = true;
        resolve(rows);
      }
    });

    parser.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    readStream.pipe(parser);
  });
}

/**
 * Validate pipeline structure and transformation steps
 * @param {Object} pipelineData - { datasetId, nodes, edges, transformationSteps }
 * @returns {Promise<{ valid: boolean, errors: Array<string>, transformationsToRun: Array<Object>, targetDatasetId: string }>}
 */
async function validatePipelineStructure(pipelineData, userId) {
  const errors = [];
  const transformationsToRun = [];

  // 1. Identify dataset ID
  let targetDatasetId = pipelineData.datasetId;
  if (!targetDatasetId && Array.isArray(pipelineData.nodes)) {
    const sourceNode = pipelineData.nodes.find((n) => n.type === 'source' || n.datasetId);
    if (sourceNode) {
      targetDatasetId = sourceNode.datasetId || sourceNode.data?.datasetId;
    }
  }

  if (!targetDatasetId) {
    errors.push('Pipeline must specify a valid target Dataset ID or Source Node.');
  }

  // 2. Validate Transformation Steps / Nodes
  if (Array.isArray(pipelineData.transformationSteps) && pipelineData.transformationSteps.length > 0) {
    for (let idx = 0; idx < pipelineData.transformationSteps.length; idx++) {
      const step = pipelineData.transformationSteps[idx];
      let stepType = step.type;
      let stepConfig = step.config;

      // If step references a Transformation doc ID
      if (step.transformationId) {
        const transDoc = await Transformation.findOne({
          _id: step.transformationId,
          $or: [{ createdBy: userId }, { isTemplate: true }],
        });
        if (!transDoc) {
          errors.push(`Transformation reference ${step.transformationId} not found.`);
          continue;
        }
        stepType = stepType || transDoc.type;
        stepConfig = Object.keys(stepConfig || {}).length > 0 ? stepConfig : transDoc.config;
      }

      if (!stepType || !stepConfig) {
        errors.push(`Transformation step ${idx + 1} missing type or configuration.`);
        continue;
      }

      const val = validateTransformationConfig(stepType, stepConfig);
      if (!val.valid) {
        errors.push(`Step ${idx + 1} (${stepType}) invalid: ${val.message}`);
      } else {
        transformationsToRun.push({ type: stepType, config: stepConfig });
      }
    }
  } else if (Array.isArray(pipelineData.nodes) && pipelineData.nodes.length > 0) {
    // Collect from node configs
    const transNodes = pipelineData.nodes.filter((n) => n.type === 'transformation' || n.type === 'transform');
    for (const node of transNodes) {
      const nodeType = node.data?.transformationType || node.data?.type;
      const nodeConfig = node.data?.config || node.data;
      if (nodeType && nodeConfig) {
        const val = validateTransformationConfig(nodeType, nodeConfig);
        if (!val.valid) {
          errors.push(`Node "${node.label || node.id}" (${nodeType}) invalid: ${val.message}`);
        } else {
          transformationsToRun.push({ type: nodeType, config: nodeConfig });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    transformationsToRun,
    targetDatasetId,
  };
}

/**
 * @desc    Create a new visual pipeline
 * @route   POST /api/pipelines
 * @access  Private
 */
const createPipeline = async (req, res) => {
  try {
    const { name, description, datasetId, nodes, edges, transformationSteps, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Pipeline name is required.',
      });
    }

    const pipeline = await Pipeline.create({
      name,
      description: description || '',
      createdBy: req.user._id,
      datasetId: datasetId || null,
      nodes: nodes || [],
      edges: edges || [],
      transformationSteps: transformationSteps || [],
      status: status || 'draft',
    });

    return res.status(201).json({
      success: true,
      message: 'Pipeline created successfully',
      data: pipeline,
    });
  } catch (error) {
    console.error('[PipelineController] Error creating pipeline:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get all pipelines for logged in user
 * @route   GET /api/pipelines
 * @access  Private
 */
const getPipelines = async (req, res) => {
  try {
    const pipelines = await Pipeline.find({ createdBy: req.user._id })
      .populate('datasetId', 'fileName originalName status totalRows headers columns')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: pipelines.length,
      data: pipelines,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get single pipeline by ID
 * @route   GET /api/pipelines/:id
 * @access  Private
 */
const getPipelineById = async (req, res) => {
  try {
    const pipeline = await Pipeline.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    }).populate('datasetId', 'fileName originalName status totalRows headers columns filePath');

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: pipeline,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update pipeline
 * @route   PUT /api/pipelines/:id
 * @access  Private
 */
const updatePipeline = async (req, res) => {
  try {
    const { name, description, datasetId, nodes, edges, transformationSteps, status } = req.body;

    const pipeline = await Pipeline.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found or unauthorized',
      });
    }

    if (name) pipeline.name = name;
    if (description !== undefined) pipeline.description = description;
    if (datasetId !== undefined) pipeline.datasetId = datasetId;
    if (nodes !== undefined) pipeline.nodes = nodes;
    if (edges !== undefined) pipeline.edges = edges;
    if (transformationSteps !== undefined) pipeline.transformationSteps = transformationSteps;
    if (status) pipeline.status = status;

    await pipeline.save();

    return res.status(200).json({
      success: true,
      message: 'Pipeline updated successfully',
      data: pipeline,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete pipeline
 * @route   DELETE /api/pipelines/:id
 * @access  Private
 */
const deletePipeline = async (req, res) => {
  try {
    const pipeline = await Pipeline.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Pipeline deleted successfully',
      data: {},
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Validate pipeline and run non-persistent in-memory Data Preview
 * @route   POST /api/pipelines/preview  OR  POST /api/pipelines/:id/preview
 * @access  Private
 */
const previewPipeline = async (req, res) => {
  try {
    let pipelineData = req.body || {};

    // If param ID exists, fetch saved pipeline first
    if (req.params.id) {
      const savedPipeline = await Pipeline.findOne({
        _id: req.params.id,
        createdBy: req.user._id,
      });

      if (!savedPipeline) {
        return res.status(404).json({
          success: false,
          message: 'Pipeline not found for preview',
        });
      }

      pipelineData = {
        datasetId: req.body.datasetId || savedPipeline.datasetId,
        nodes: req.body.nodes || savedPipeline.nodes,
        edges: req.body.edges || savedPipeline.edges,
        transformationSteps: req.body.transformationSteps?.length
          ? req.body.transformationSteps
          : savedPipeline.transformationSteps,
      };
    }

    // 1. Validate Pipeline structure
    const validation = await validatePipelineStructure(pipelineData, req.user._id);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Pipeline validation failed before preview execution.',
        errors: validation.errors,
      });
    }

    // 2. Fetch dataset record
    const dataset = await Dataset.findOne({
      _id: validation.targetDatasetId,
      uploadedBy: req.user._id,
    });

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset specified in pipeline not found or inaccessible.',
      });
    }

    if (!dataset.filePath || !fs.existsSync(dataset.filePath)) {
      return res.status(400).json({
        success: false,
        message: `Dataset physical file is missing at ${dataset.filePath}`,
      });
    }

    // 3. Read sample rows in-memory (e.g., first 50 rows)
    const sampleLimit = parseInt(req.query.limit || '50', 10);
    const sampleRows = await readSampleCsvRows(dataset.filePath, sampleLimit);

    // 4. Run Transformation Engine in-memory (Zero DB mutations)
    const previewRows = executeTransformations(sampleRows, validation.transformationsToRun);

    // 5. Extract transformed headers
    const transformedHeadersSet = new Set();
    previewRows.forEach((r) => {
      Object.keys(r).forEach((k) => transformedHeadersSet.add(k));
    });
    const transformedHeaders = Array.from(transformedHeadersSet);

    // Return non-persistent preview results
    return res.status(200).json({
      success: true,
      message: 'Pipeline validated successfully. In-memory data preview generated without database mutation.',
      data: {
        datasetName: dataset.originalName || dataset.fileName,
        originalRowCount: sampleRows.length,
        previewRowCount: previewRows.length,
        originalHeaders: dataset.headers,
        transformedHeaders: transformedHeaders,
        previewData: previewRows,
        isPersistent: false,
        appliedRulesCount: validation.transformationsToRun.length,
      },
    });
  } catch (error) {
    console.error('[PipelineController] Error generating data preview:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPipeline,
  getPipelines,
  getPipelineById,
  updatePipeline,
  deletePipeline,
  previewPipeline,
};
