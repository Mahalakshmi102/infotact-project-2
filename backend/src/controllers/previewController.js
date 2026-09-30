const path = require("path");

const {
    previewCSV
} = require("../services/previewService");

const previewFile = async (req, res) => {

    try {

        const {
            fileName,
            limit = 10,
            transformations = []
        } = req.body;

        if (!fileName) {

            return res.status(400).json({
                success: false,
                message: "fileName is required"
            });
        }

        const safeFileName = path.basename(fileName);

        const filePath = path.join(
            process.cwd(),
            "uploads",
            safeFileName
        );

        const rowsLimit = Math.min(
            Number(limit) || 10,
            100
        );

        const previewRows = await previewCSV(
            filePath,
            rowsLimit,
            transformations
        );

        res.status(200).json({

            success: true,

            count: previewRows.length,

            data: previewRows

        });

    } catch (error) {

        console.error(
            "Preview error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Failed to generate preview",

            error: error.message

        });
    }
};

module.exports = {
    previewFile
};