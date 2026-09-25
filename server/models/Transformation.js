const mongoose = require('mongoose');

const transformationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Transformation name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['filter', 'map', 'aggregate', 'deduplicate', 'type_cast', 'rename', 'custom'],
      required: [true, 'Transformation type is required'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Transformation configuration is required'],
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Mongoose custom validation for transformation rules structure
transformationSchema.path('config').validate(function (config) {
  if (!config || typeof config !== 'object') return false;

  switch (this.type) {
    case 'filter':
      return Boolean(config.column && config.operator);
    case 'map':
    case 'rename':
      return Boolean(config.sourceColumn && config.targetColumn);
    case 'aggregate':
      return Boolean(
        config.aggregateColumn &&
        config.function &&
        config.targetColumn &&
        ['sum', 'avg', 'min', 'max', 'count'].includes(config.function)
      );
    case 'deduplicate':
      return Array.isArray(config.columns) && config.columns.length > 0;
    case 'type_cast':
      return Boolean(
        config.column &&
        config.targetType &&
        ['integer', 'float', 'string', 'boolean', 'date'].includes(config.targetType)
      );
    case 'custom':
      return true;
    default:
      return true;
  }
}, 'Invalid transformation configuration structure for specified transformation type');

transformationSchema.index({ createdBy: 1, createdAt: -1 });
transformationSchema.index({ type: 1 });

module.exports = mongoose.model('Transformation', transformationSchema);
