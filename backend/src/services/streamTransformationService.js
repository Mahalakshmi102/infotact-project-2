const { Transform } = require("stream");

const transformationService =
    require("./transformationService");


function createTransformationStream(rules) {

    return new Transform({

        objectMode: true,

        transform(row, encoding, callback) {

            try {

                const transformedRow =
                    transformationService
                        .applyTransformations(
                            row,
                            rules
                        );

                callback(
                    null,
                    transformedRow
                );

            } catch (error) {

                callback(error);
            }
        }
    });
}


module.exports = {
    createTransformationStream
};