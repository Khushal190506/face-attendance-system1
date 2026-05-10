const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
    },
    time: {
      type: String, // HH:MM:SS format
      required: true,
    },
    subject: {
      type: String,
      default: 'General',
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'present',
    },
    markedBy: {
      type: String,
      enum: ['face_recognition', 'manual'],
      default: 'face_recognition',
    },
    confidence: {
      type: Number, // face recognition confidence 0-100
      default: null,
    },
    sessionId: {
      type: String, // to group attendance by session
      default: null,
    },
    markedByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate attendance for same student/date/subject
attendanceSchema.index({ student: 1, date: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
