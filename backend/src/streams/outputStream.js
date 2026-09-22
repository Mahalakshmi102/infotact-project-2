const { Writable } = require("stream");
const fs = require("fs");

function createOutputStream(outputPath) {
    const fileStream = fs.createWriteStream(outputPath);

    const writable = new Writable({
        objectMode: true,

        write(row, encoding, callback) {
            try {
                const line = JSON.stringify(row) + "\n";

                if (!fileStream.write(line)) {
                    fileStream.once("drain", callback);
                } else {
                    callback();
                }

            } catch (error) {
                callback(error);
            }
        },

        final(callback) {
            fileStream.end(callback);
        }
    });

    return writable;
}

module.exports = createOutputStream;