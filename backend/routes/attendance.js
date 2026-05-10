const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAttendance,
  markAttendance,
  getTodayAttendance,
  getAnalytics,
  getStudentAttendance,
  exportExcel,
  exportPDF,
  deleteAttendance,
} = require('../controllers/attendanceController');

router.get('/today', protect, getTodayAttendance);
router.get('/analytics', protect, getAnalytics);
router.get('/export/excel', protect, exportExcel);
router.get('/export/pdf', protect, exportPDF);
router.get('/student/:id', protect, getStudentAttendance);
router.route('/').get(protect, getAttendance).post(protect, markAttendance);
router.delete('/:id', protect, deleteAttendance);

module.exports = router;
