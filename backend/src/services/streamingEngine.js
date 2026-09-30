const fs = require("fs");
const path = require("path");

const createCSVParser = require("../streams/csvParser");
const createTransformStream = require("../streams/transformStream");
const createOutputStream = require("../streams/outputStream");

async function processLargeCSV(inputPath, outputPath) {
    return new Promise((resolve, reject) => {

        console.log("=================================");
        console.log("Starting streaming engine");
        console.log("Input :", inputPath);
        console.log("Output:", outputPath);
        console.log("=================================");

        // Check input file
        if (!fs.existsSync(inputPath)) {
            return reject(
                new Error(`Input file does not exist: ${inputPath}`)
            );
        }

        // Create output directory
        const outputDirectory = path.dirname(outputPath);

        if (!fs.existsSync(outputDirectory)) {
            fs.mkdirSync(outputDirectory, {
                recursive: true
            });
        }

        // Readable Stream
        const readableStream = fs.createReadStream(inputPath, {
            encoding: "utf8",
            highWaterMark: 64 * 1024
        });

        // CSV Parser
        const csvParser = createCSVParser();

        // Transform Stream
        const transformStream = createTransformStream();

        // Writable Stream
        const writableStream = createOutputStream(outputPath);

        let rowsProcessed = 0;

        transformStream.on("data", () => {
            rowsProcessed++;

            if (rowsProcessed % 10000 === 0) {
                console.log(
                    `Processed ${rowsProcessed} rows`
                );
            }
        });

        // Error handling
        readableStream.on("error", (error) => {
            console.error(
                "Readable stream error:",
                error.message
            );

            reject(error);
        });

        csvParser.on("error", (error) => {
            console.error(
                "CSV parser error:",
                error.message
            );

            reject(error);
        });

        transformStream.on("error", (error) => {
            console.error(
                "Transform stream error:",
                error.message
            );

            reject(error);
        });

        writableStream.on("error", (error) => {
            console.error(
                "Writable stream error:",
                error.message
            );

            reject(error);
        });

        writableStream.on("finish", () => {
            console.log("=================================");
            console.log("Streaming completed successfully");
            console.log(`Total rows: ${rowsProcessed}`);
            console.log("=================================");

            resolve({
                success: true,
                rowsProcessed
            });
        });

        // Stream pipeline
        readableStream
            .pipe(csvParser)
            .pipe(transformStream)
            .pipe(writableStream);
    });
}

module.exports = {
    processLargeCSV
};