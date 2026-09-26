const fs = require("fs");
const csv = require("csv-parser");
const { detectType } = require("../utils/typeDetector");

function analyzeCSV(filePath) {
    return new Promise((resolve, reject) => {

        let columns = [];
        let rowCount = 0;

        const columnTypes = {};

        const readStream = fs.createReadStream(filePath);

        readStream
            .pipe(csv())
            .on("headers", (headers) => {

                columns = headers;

                headers.forEach((column) => {
                    columnTypes[column] = new Set();
                });
            })

            .on("data", (row) => {

                rowCount++;

                Object.keys(row).forEach((column) => {

                    const type = detectType(row[column]);

                    columnTypes[column].add(type);
                });
            })

            .on("end", () => {

                const types = {};

                Object.keys(columnTypes).forEach((column) => {

                    types[column] =
                        getFinalType(columnTypes[column]);
                });

                resolve({
                    format: "CSV",
                    columns,
                    rowCount,
                    types
                });
            })

            .on("error", (error) => {
                reject(error);
            });
    });
}