const ivm = require('isolated-vm');

class SandboxEngine {
    constructor() {
        this.isolate = null;
        this.context = null;
        this.jail = null;
        this.initIsolate();
    }

    initIsolate() {
        try {
            // Allocate an isolated V8 instance with strict 16MB heap limit
            this.isolate = new ivm.Isolate({ memoryLimit: 16 });
            this.context = this.isolate.createContextSync();
            this.jail = this.context.global;
            this.jail.setSync('global', this.jail.derefInto());
        } catch (err) {
            console.error('Failed to initialize isolated-vm:', err);
        }
    }

    /**
     * Precompile a transform script for high-throughput streaming
     * @param {string} userCode - User defined JS e.g. "return value.toUpperCase();"
     * @returns {Object} compiled script runner
     */
    compileTransform(userCode) {
        if (!userCode || !userCode.trim()) {
            return null;
        }

        const trimmed = userCode.trim();
        // Wrap user snippet in a callable function closure
        const wrappedCode = `
            (function(value, row) {
                try {
                    ${trimmed.includes('return') ? trimmed : 'return ' + trimmed + ';'}
                } catch(e) {
                    throw new Error('Sandbox Execution Error: ' + e.message);
                }
            })
        `;

        try {
            const script = this.isolate.compileScriptSync(wrappedCode);
            const fnReference = script.runSync(this.context, { timeout: 100 });

            return {
                run: (val, rowObj = {}) => {
                    try {
                        const copyVal = (val === undefined || val === null) ? null : val;
                        // Use copyInto for safe argument transfer
                        const res = fnReference.applySync(undefined, [
                            copyVal,
                            new ivm.ExternalCopy(rowObj).copyInto()
                        ], { timeout: 30 }); // 30ms strict timeout per row

                        return { success: true, value: res };
                    } catch (execErr) {
                        return { success: false, error: execErr.message };
                    }
                }
            };
        } catch (compileErr) {
            return {
                compileError: compileErr.message,
                run: () => ({ success: false, error: 'Compilation Error: ' + compileErr.message })
            };
        }
    }

    /**
     * Test a user snippet interactively from the UI
     */
    testSnippet(userCode, sampleValue = 'Sample String', sampleRow = {}) {
        const start = process.hrtime.bigint();
        try {
            const compiled = this.compileTransform(userCode);
            if (!compiled) {
                return {
                    success: false,
                    error: 'Empty script provided'
                };
            }
            if (compiled.compileError) {
                return {
                    success: false,
                    error: compiled.compileError
                };
            }

            const result = compiled.run(sampleValue, sampleRow);
            const end = process.hrtime.bigint();
            const elapsedMs = Number(end - start) / 1000000;

            return {
                success: result.success,
                output: result.value,
                error: result.error,
                durationMs: +elapsedMs.toFixed(3),
                sandboxEngine: 'isolated-vm (V8 Sandbox)'
            };
        } catch (err) {
            const end = process.hrtime.bigint();
            const elapsedMs = Number(end - start) / 1000000;
            return {
                success: false,
                error: err.message,
                durationMs: +elapsedMs.toFixed(3),
                sandboxEngine: 'isolated-vm (V8 Sandbox)'
            };
        }
    }
}

// Singleton engine
const sandboxEngine = new SandboxEngine();

module.exports = sandboxEngine;
