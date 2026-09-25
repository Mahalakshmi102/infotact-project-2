const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true }, // 'source', 'transformation', 'destination'
    label: { type: String, default: '' },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    transformationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transformation',
    },
    datasetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dataset',
    },
  },
  { _id: false }
);

const edgeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    label: { type: String, default: '' },
  },
  { _id: false }
);

const pipelineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Pipeline name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    datasetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dataset',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
      index: true,
    },
    nodes: {
      type: [nodeSchema],
      default: [],
    },
    edges: {
      type: [edgeSchema],
      default: [],
    },
    transformationSteps: [
      {
        order: { type: Number, required: true },
        type: { type: String },
        transformationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Transformation',
        },
        config: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],
  },
  {
    timestamps: true,
  }
);

pipelineSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('Pipeline', pipelineSchema);
