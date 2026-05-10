const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadFace } = require('../middleware/upload');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  captureFace,
  trainModel,
  recognizeFace,
  checkHealth,
  getDatasetStatus,
} = require('../controllers/recognitionController');

// Temp storage for recognition (face to recognize)
const tempStorage = multer.memoryStorage();
const uploadTemp = multer({ storage: tempStorage });

router.get('/health', checkHealth);
router.get('/dataset-status', protect, getDatasetStatus);
router.post('/capture/:studentNumId', protect, uploadFace.single('face'), captureFace);
router.post('/train', protect, trainModel);
router.post('/recognize', protect, uploadTemp.single('image'), recognizeFace);

module.exports = router;
