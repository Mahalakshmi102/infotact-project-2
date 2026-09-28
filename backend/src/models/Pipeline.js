const mongoose = require("mongoose");

const pipelineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100
    },

    description: {
      type: String,
      default: ""
    },

    source: {
      type: String,
      required: true,
      enum: ["csv", "json"]
    },

    transformations: {
      type: [
        {
          type: {
            type: String,
            required: true,
            enum: [
              "uppercase",
              "lowercase",
              "trim",
              "rename",
              "remove"
            ]
          },

          column: {
            type: String,
            required: true
          },

          value: {
            type: String,
            default: ""
          }
        }
      ],
      default: []
    },

    destination: {
      type: String,
      required: true,
      enum: ["mongodb"]
    },

    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "draft"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Pipeline", pipelineSchema);