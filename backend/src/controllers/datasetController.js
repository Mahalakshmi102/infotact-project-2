const uploadDataset = (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a CSV or JSON file"
            });
        }

        res.status(201).json({
            success: true,
            message: "Dataset uploaded successfully",

            file: {
                originalName: req.file.originalname,
                fileName: req.file.filename,
                path: req.file.path,
                size: req.file.size,
                mimeType: req.file.mimetype
            }
        });

    } catch (error) {

        console.error("Upload error:", error);

        res.status(500).json({
            success: false,
            message: "File upload failed"
        });
    }
};

module.exports = {
    uploadDataset
};