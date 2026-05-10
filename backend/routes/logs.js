const express = require('express');
const { protect } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');
const Student = require('../models/Student');
const router = express.Router();

// @desc    Get activity logs
// @route   GET /api/logs
router.get('/', protect, async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('user', 'name email')
      .populate('student', 'fullName rollNumber')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get dashboard stats
// @route   GET /api/logs/dashboard
router.get('/dashboard', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const Attendance = require('../models/Attendance');

    const [totalStudents, todayPresent, totalLogs] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Attendance.countDocuments({ date: today }),
      ActivityLog.countDocuments(),
    ]);

    const recentRecognized = await Attendance.find({ date: today, markedBy: 'face_recognition' })
      .populate('student', 'fullName rollNumber photo department')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: { totalStudents, todayPresent, totalLogs },
      recentRecognized,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
