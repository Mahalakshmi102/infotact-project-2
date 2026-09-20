const Dataset = require("../models/Dataset");
const {
    processCSV
} = require("../services/streamService");

const uploadFile = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: "Please upload a CSV or JSON file"
            });
        }

        const file = req.file;

        const extension =
            file.originalname
                .split(".")
                .pop()
                .toLowerCase();

        const dataset = await Dataset.create({
            originalName: file.originalname,

            fileName: file.filename,

            filePath: file.path,

            fileType: extension,

            fileSize: file.size,

            status: "uploaded"
        });

        res.status(201).json({
            message: "File uploaded successfully",

            dataset: {
                id: dataset._id,
                name: dataset.originalName,
                type: dataset.fileType,
                size: dataset.fileSize
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "File upload failed",
            error: error.message
        });
    }
};

const processFile = async (req, res) => {

    try {

        const dataset =
            await Dataset.findById(req.params.id);

        if (!dataset) {
            return res.status(404).json({
                message: "Dataset not found"
            });
        }

        if (dataset.fileType !== "csv") {
            return res.status(400).json({
                message:
                    "CSV streaming is implemented in Week 1"
            });
        }

        const result =
            await processCSV(dataset.filePath);

        dataset.status = "processed";

        await dataset.save();

        res.json({
            message: "File processed successfully",
            rowsProcessed: result.rowCount
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "File processing failed",
            error: error.message
        });
    }
};

const getDatasets = async (req, res) => {

    try {

        const datasets =
            await Dataset.find()
                .sort({ createdAt: -1 });

        res.json(datasets);

    } catch (error) {

        res.status(500).json({
            message: "Could not fetch datasets",
            error: error.message
        });
    }
};

module.exports = {
    uploadFile,
    processFile,
    getDatasets
};