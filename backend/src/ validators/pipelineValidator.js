const allowedSources = ["csv", "json"];

const allowedDestinations = ["mongodb"];

const allowedTransformations = [
  "uppercase",
  "lowercase",
  "trim",
  "rename",
  "remove"
];

function validatePipeline(data) {
  const errors = [];

  // Validate name
  if (!data.name || typeof data.name !== "string") {
    errors.push("Pipeline name is required");
  } else if (data.name.trim().length < 3) {
    errors.push("Pipeline name must contain at least 3 characters");
  }

  // Validate source
  if (!data.source) {
    errors.push("Source is required");
  } else if (!allowedSources.includes(data.source)) {
    errors.push("Source must be csv or json");
  }

  // Validate destination
  if (!data.destination) {
    errors.push("Destination is required");
  } else if (!allowedDestinations.includes(data.destination)) {
    errors.push("Destination must be mongodb");
  }

  // Validate transformations
  if (data.transformations !== undefined) {

    if (!Array.isArray(data.transformations)) {
      errors.push("Transformations must be an array");
    } else {

      data.transformations.forEach((transformation, index) => {

        if (!transformation.type) {
          errors.push(
            `Transformation ${index}: type is required`
          );
        }

        if (
          transformation.type &&
          !allowedTransformations.includes(
            transformation.type
          )
        ) {
          errors.push(
            `Transformation ${index}: invalid transformation type`
          );
        }

        if (!transformation.column) {
          errors.push(
            `Transformation ${index}: column is required`
          );
        }
      });
    }
  }

  return errors;
}

module.exports = {
  validatePipeline
};
