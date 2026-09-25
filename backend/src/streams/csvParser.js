const csv = require("csv-parser");

function createCSVParser() {
    return csv({
        separator: ",",
        skipLines: 0
    });
}

module.exports = createCSVParser;