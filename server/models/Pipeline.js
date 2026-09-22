const mongoose = require('mongoose');

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
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
    },
    transformationSteps: [
      {
        order: { type: Number, required: true },
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

module.exports = mongoose.model('Pipeline', pipelineSchema);
