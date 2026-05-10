const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadProfile } = require('../middleware/upload');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getDepartments,
} = require('../controllers/studentController');

router.get('/departments', protect, getDepartments);
router.route('/').get(protect, getStudents).post(protect, uploadProfile.single('photo'), createStudent);
router
  .route('/:id')
  .get(protect, getStudent)
  .put(protect, uploadProfile.single('photo'), updateStudent)
  .delete(protect, deleteStudent);

module.exports = router;
