const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const ActivityLog = require('../models/ActivityLog');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// @desc    Capture face sample and save to dataset
// @route   POST /api/recognition/capture/:studentNumId
const captureFace = async (req, res) => {
  try {
    const { studentNumId } = req.params;
    const student = await Student.findOne({ studentId: Number(studentNumId) });

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // The image was saved by multer already, now notify Python service
    const imagePath = req.file ? req.file.path : null;
    if (!imagePath) return res.status(400).json({ success: false, message: 'No image provided' });

    // Update student faceImages array and count
    const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      {
        $push: { faceImages: imagePath },
        $inc: { faceDatasetCount: 1 },
      },
      { new: true }
    );

    const count = updatedStudent.faceDatasetCount;
    if (count >= 5 && !updatedStudent.isFaceRegistered) {
      await Student.findByIdAndUpdate(student._id, { isFaceRegistered: true });
    }

    res.json({
      success: true,
      message: 'Face sample captured',
      count,
      isRegistered: count >= 5,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Trigger model training on Python service
// @route   POST /api/recognition/train
const trainModel = async (req, res) => {
  try {
    // Fetch all active students with face images
    const students = await Student.find({ isActive: true, faceImages: { $not: { $size: 0 } } })
      .select('studentId faceImages');

    const payload = {
      students: students.map((s) => ({
        studentId: s.studentId,
        images: s.faceImages,
      })),
    };

    const response = await axios.post(`${AI_URL}/train`, payload, { timeout: 120000 });
    
    await ActivityLog.create({
      action: 'MODEL_TRAINED',
      description: 'Face recognition model retrained',
      type: 'system',
    });

    res.json({ success: true, message: 'Model trained successfully', data: response.data });
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    res.status(500).json({ success: false, message: `Training failed: ${msg}` });
  }
};

// @desc    Recognize face in uploaded image
// @route   POST /api/recognition/recognize
const recognizeFace = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image provided' });

    // Forward image buffer to Python AI service
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname || 'temp.jpg',
      contentType: req.file.mimetype || 'image/jpeg',
    });

    const aiResponse = await axios.post(`${AI_URL}/recognize`, formData, {
      headers: formData.getHeaders(),
      timeout: 15000,
    });

    const { studentId: numId, confidence, recognized } = aiResponse.data;

    if (!recognized || numId === -1) {
      return res.json({ success: true, recognized: false, message: 'Face not recognized' });
    }

    // Find student by numeric ID
    const student = await Student.findOne({ studentId: numId, isActive: true });
    if (!student) {
      return res.json({ success: true, recognized: false, message: 'Student not found in database' });
    }

    // Mark attendance
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0];
    const subject = req.body.subject || 'General';

    let attendanceRecord;
    let alreadyMarked = false;

    const existing = await Attendance.findOne({ student: student._id, date: today, subject });
    if (existing) {
      alreadyMarked = true;
      attendanceRecord = existing;
    } else {
      attendanceRecord = await Attendance.create({
        student: student._id,
        date: today,
        time: now,
        subject,
        status: 'present',
        markedBy: 'face_recognition',
        confidence: Math.round(confidence),
        sessionId: req.body.sessionId || null,
      });

      await ActivityLog.create({
        action: 'FACE_RECOGNITION_ATTENDANCE',
        description: `Face recognized: ${student.fullName} (${Math.round(confidence)}% confidence)`,
        type: 'recognition',
        student: student._id,
        metadata: { confidence: Math.round(confidence), subject },
      });
    }

    res.json({
      success: true,
      recognized: true,
      alreadyMarked,
      confidence: Math.round(confidence),
      student: {
        _id: student._id,
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        department: student.department,
        year: student.year,
        photo: student.photo,
      },
      attendance: attendanceRecord,
    });
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    res.status(500).json({ success: false, message: `Recognition error: ${msg}` });
  }
};

// @desc    Check Python AI service health
// @route   GET /api/recognition/health
const checkHealth = async (req, res) => {
  try {
    const response = await axios.get(`${AI_URL}/health`, { timeout: 5000 });
    res.json({ success: true, aiService: 'online', data: response.data });
  } catch (error) {
    res.json({ success: false, aiService: 'offline', message: 'Python AI service is not running' });
  }
};

// @desc    Get dataset count per student
// @route   GET /api/recognition/dataset-status
const getDatasetStatus = async (req, res) => {
  try {
    const students = await Student.find({ isActive: true }).select(
      'fullName rollNumber studentId faceDatasetCount isFaceRegistered'
    );
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { captureFace, trainModel, recognizeFace, checkHealth, getDatasetStatus };
