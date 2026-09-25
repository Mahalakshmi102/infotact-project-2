const express = require('express');
const router = express.Router();
const {
  createPipeline,
  getPipelines,
  getPipelineById,
  updatePipeline,
  deletePipeline,
  previewPipeline,
} = require('../controllers/pipelineController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/preview', previewPipeline);

router.route('/')
  .post(createPipeline)
  .get(getPipelines);

router.route('/:id')
  .get(getPipelineById)
  .put(updatePipeline)
  .delete(deletePipeline);

router.post('/:id/preview', previewPipeline);

module.exports = router;
