
const ivm = require("isolated-vm");

const MAX_CODE_LENGTH = 10_000;
const MAX_INPUT_LENGTH = 100_000;
const EXECUTION_TIMEOUT_MS = 1_000;
const MEMORY_LIMIT_MB = 32;

async function executeTransform(userCode, inputData) {
  if (typeof userCode !== "string" ||
      userCode.length === 0 ||
      userCode.length > MAX_CODE_LENGTH) {
    throw new Error("Invalid transformation code");
  }

  const inputJson = JSON.stringify(inputData);

  if (inputJson === undefined ||
      inputJson.length > MAX_INPUT_LENGTH) {
    throw new Error("Invalid or oversized input data");
  }

  // Create an isolated V8 environment.
  const isolate = new ivm.Isolate({
    memoryLimit: MEMORY_LIMIT_MB
  });

  try {
    const context = await isolate.createContext();

    // Pass only serialized JSON, never Node.js objects.
    const jail = context.global;

    await jail.set("inputJson", inputJson);

    // User code receives a plain data object.
    // It must return the transformed record.
    const wrapper = `
      (() => {
        const input = JSON.parse(inputJson);

        const transform = (${userCode});

        if (typeof transform !== "function") {
          throw new Error("Code must define a function");
        }

        const result = transform(input);

        return JSON.stringify(result);
      })()
    `;

    const resultJson = await context.eval(
      wrapper,
      {
        timeout: EXECUTION_TIMEOUT_MS
      }
    );

    if (typeof resultJson !== "string") {
      throw new Error("Transformation must return JSON data");
    }

    // Validate the output before returning it to the app.
    return JSON.parse(resultJson);
  } catch (error) {
    if (/timed out|execution timed out/i.test(error.message)) {
      throw new Error("Transformation execution timed out");
    }

    throw new Error(`Transformation failed: ${error.message}`);
  } finally {
    // Release isolate memory and invalidate its handles.
    isolate.dispose();
  }
}

module.exports = { executeTransform };
