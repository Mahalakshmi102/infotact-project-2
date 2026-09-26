const express = require("express");

const {
    transformRow
} = require("../controllers/transformationController");


const router =
    express.Router();


router.post(
    "/transform",
    transformRow
);


module.exports = router;