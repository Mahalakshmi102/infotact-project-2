
const express = require("express");
const router = express.Router();

const {
  runTransformation
} = require("../controllers/sandboxController");

router.post("/execute", runTransformation);

module.exports = router;
