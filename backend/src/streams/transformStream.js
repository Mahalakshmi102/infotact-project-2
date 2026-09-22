const { Transform } = require("stream");

function createTransformStream() {
    return new Transform({
        objectMode: true,

        transform(row, encoding, callback) {
            try {
                // Example ETL processing

                row.name = row.name
                    ? row.name.trim().toUpperCase()
                    : "";

                row.age = Number(row.age);

                row.processed = true;

                callback(null, row);
            } catch (error) {
                callback(error);
            }
        }
    });
}

module.exports = createTransformStream;