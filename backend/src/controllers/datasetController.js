const Dataset = require('../models/Dataset');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

exports.uploadDataset = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }

    try {
        const dataset = new Dataset({
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: path.extname(req.file.originalname).toLowerCase() === '.csv' ? 'csv' : 'json',
            uploadedBy: req.user.id,
            status: 'Processing'
        });

        await dataset.save();
        res.status(202).json({ msg: 'File uploaded and is being processed', dataset });

        // Stream processing
        let rowCount = 0;
        const readStream = fs.createReadStream(req.file.path);
        
        readStream
            .pipe(csv())
            .on('data', () => {
                rowCount++;
            })
            .on('end', async () => {
                dataset.totalRows = rowCount;
                dataset.status = 'Completed';
                await dataset.save();
                fs.unlinkSync(req.file.path); // Remove temp file
            })
            .on('error', async (err) => {
                console.error(err);
                dataset.status = 'Failed';
                await dataset.save();
                fs.unlinkSync(req.file.path);
            });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error during upload' });
    }
};

exports.getDatasets = async (req, res) => {
    try {
        const datasets = await Dataset.find({ uploadedBy: req.user.id }).sort({ createdAt: -1 });
        res.json(datasets);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};
