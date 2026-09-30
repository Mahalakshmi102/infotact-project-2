const express = require("express");

const {
    previewFile
} = require("../controllers/previewController");

const router = express.Router();

router.post(
    "/preview",
    previewFile
);

module.exports = router;