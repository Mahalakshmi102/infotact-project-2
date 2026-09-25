const express = require('express');
const router = express.Router();
const {
  createTransformation,
  getTransformations,
  getTransformationById,
  updateTransformation,
  deleteTransformation,
} = require('../controllers/transformationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(createTransformation)
  .get(getTransformations);

router.route('/:id')
  .get(getTransformationById)
  .put(updateTransformation)
  .delete(deleteTransformation);

module.exports = router;
