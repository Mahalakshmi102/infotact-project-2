const fs = require("fs");
const csv = require("csv-parser");

const {
    applyTransformations
} = require("./transformationService");

function previewCSV(filePath, limit = 10, transformations = []) {

    return new Promise((resolve, reject) => {

        const rows = [];

        const stream = fs.createReadStream(filePath);

        stream
            .pipe(csv())

            .on("data", (row) => {

                if (rows.length >= limit) {
                    return;
                }

                try {

                    const transformedRow =
                        applyTransformations(
                            row,
                            transformations
                        );

                    rows.push(transformedRow);

                } catch (error) {

                    stream.destroy();

                    reject(error);
                }
            })

            .on("end", () => {

                resolve(rows);

            })

            .on("error", (error) => {

                reject(error);

            });
    });
}

module.exports = {
    previewCSV
};